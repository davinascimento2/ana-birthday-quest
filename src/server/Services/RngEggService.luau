--!strict

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local Rarities = require(Shared:WaitForChild("Rarities"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local DataService = require(script.Parent.DataService)
local PetService = require(script.Parent.PetService)
local HypeService = require(script.Parent.HypeService)

local RngEggService = {}

type WeightedEntry = {
	PetDef: Types.PetDefinition,
	Weight: number,
}

local function getNearMissPetId(availablePetDefs: { Types.PetDefinition }): string
	local highTierPets: { string } = {}
	for _, petDef in ipairs(availablePetDefs) do
		if petDef.Rarity == "Mythic" or petDef.Rarity == "Secret" or petDef.Rarity == "Legendary" then
			table.insert(highTierPets, petDef.Id)
		end
	end

	if #highTierPets > 0 then
		return highTierPets[math.random(1, #highTierPets)]
	end

	return availablePetDefs[#availablePetDefs].Id
end

function RngEggService.RollSingle(
	player: Player,
	eggConfig: GameConfig.EggConfig
): {
	PetId: string,
	Rarity: Types.RarityTier,
	Variant: Types.PetVariant,
	WasPityTriggered: boolean,
	WasAutoDeleted: boolean,
	NearMissPetId: string,
}?
	local data = DataService.GetPlayerData(player)
	if not data then
		return nil
	end

	data.TotalRolls += 1
	data.SoftPityCounter += 1
	data.HardPityCounter += 1

	local isHardPity = data.HardPityCounter >= GameConfig.Pity.HardPityRollThreshold
	local isSoftPity = data.SoftPityCounter >= GameConfig.Pity.SoftPityRollThreshold
	local isFeverActive = HypeService.IsFeverActive()

	local availablePetDefs: { Types.PetDefinition } = {}
	for _, petId in ipairs(eggConfig.AvailablePetIds) do
		local def = GameConfig.Pets[petId]
		if def then
			table.insert(availablePetDefs, def)
		end
	end

	if #availablePetDefs == 0 then
		return nil
	end

	local pool: { WeightedEntry } = {}
	local totalWeight = 0

	for _, def in ipairs(availablePetDefs) do
		local rarityDef = Rarities.Get(def.Rarity)
		local baseWeight = rarityDef.ChanceWeight

		if isHardPity then
			if not Rarities.IsAtLeast(def.Rarity, "Legendary") then
				baseWeight = 0
			end
		else
			if isSoftPity and Rarities.IsAtLeast(def.Rarity, "Legendary") then
				baseWeight = baseWeight * GameConfig.Pity.SoftPityMultiplier
			end
			if isFeverActive and Rarities.IsAtLeast(def.Rarity, "Rare") then
				baseWeight = baseWeight * 2.0
			end
		end

		if baseWeight > 0 then
			table.insert(pool, {
				PetDef = def,
				Weight = baseWeight,
			})
			totalWeight += baseWeight
		end
	end

	-- Fallback if pool is empty (e.g. Hard Pity with no legendaries in egg)
	if totalWeight <= 0 or #pool == 0 then
		for _, def in ipairs(availablePetDefs) do
			local rarityDef = Rarities.Get(def.Rarity)
			table.insert(pool, {
				PetDef = def,
				Weight = rarityDef.ChanceWeight,
			})
			totalWeight += rarityDef.ChanceWeight
		end
	end

	local roll = math.random() * totalWeight
	local accumulated = 0
	local selectedPetDef = pool[1].PetDef

	for _, entry in ipairs(pool) do
		accumulated += entry.Weight
		if roll <= accumulated then
			selectedPetDef = entry.PetDef
			break
		end
	end

	-- Check if pity reset should happen
	local wasPityTriggered = isHardPity
	if Rarities.IsAtLeast(selectedPetDef.Rarity, "Legendary") then
		data.SoftPityCounter = 0
		data.HardPityCounter = 0
	end

	local nearMissPetId = ""
	if not Rarities.IsAtLeast(selectedPetDef.Rarity, "Rare") then
		nearMissPetId = getNearMissPetId(availablePetDefs)
	end

	local variant: Types.PetVariant = "Normal"
	-- Rare natural golden roll (0.5% chance)
	if math.random() < 0.005 then
		variant = "Golden"
	end

	-- Check auto-delete
	local isAutoDeleted = data.Settings.AutoDeleteRarities[selectedPetDef.Rarity] == true

	if not isAutoDeleted then
		-- Register discovery
		data.DiscoveredPets[selectedPetDef.Id] = true

		-- Add to inventory if space permits
		local currentCount = 0
		for _ in pairs(data.InventoryPets) do
			currentCount += 1
		end

		if currentCount < data.MaxInventorySize then
			local newPet = PetService.CreatePet(selectedPetDef.Id, variant)
			data.InventoryPets[newPet.UUID] = newPet
		else
			isAutoDeleted = true
		end
	end

	-- Broadcast if Mythic or Secret
	local rarityDef = Rarities.Get(selectedPetDef.Rarity)
	if rarityDef.TriggersServerAnnouncement then
		HypeService.BroadcastAnnouncement(player, selectedPetDef, variant)
	end

	return {
		PetId = selectedPetDef.Id,
		Rarity = selectedPetDef.Rarity,
		Variant = variant,
		WasPityTriggered = wasPityTriggered,
		WasAutoDeleted = isAutoDeleted,
		NearMissPetId = nearMissPetId,
	}
end

function RngEggService.RollEgg(player: Player, eggId: string, count: number)
	local eggConfig = GameConfig.Eggs[eggId]
	if not eggConfig then
		return
	end

	local rollCount = math.clamp(count, 1, 8)
	local totalCost = eggConfig.CostCoins * rollCount

	local data = DataService.GetPlayerData(player)
	if not data or data.Coins < totalCost then
		local responseRemote = NetContracts.GetRemoteEvent(NetContracts.Names.EggRollResponse)
		responseRemote:FireClient(
			player,
			{
				Success = false,
				ErrorReason = "Not enough coins!",
				UpdatedSoftPity = if data then data.SoftPityCounter else 0,
				UpdatedHardPity = if data then data.HardPityCounter else 0,
			} :: Types.EggRollResult
		)
		return
	end

	-- Check inventory space
	local inventoryCount = 0
	for _ in pairs(data.InventoryPets) do
		inventoryCount += 1
	end

	if inventoryCount + rollCount > data.MaxInventorySize then
		local responseRemote = NetContracts.GetRemoteEvent(NetContracts.Names.EggRollResponse)
		responseRemote:FireClient(
			player,
			{
				Success = false,
				ErrorReason = "Inventory full! Upgrade space or craft pets.",
				UpdatedSoftPity = data.SoftPityCounter,
				UpdatedHardPity = data.HardPityCounter,
			} :: Types.EggRollResult
		)
		return
	end

	-- Deduct coins
	data.Coins -= totalCost

	local results = {}
	for _ = 1, rollCount do
		local rollResult = RngEggService.RollSingle(player, eggConfig)
		if rollResult then
			table.insert(results, rollResult)
		end
	end

	DataService.ReplicateToClient(player)

	local responseRemote = NetContracts.GetRemoteEvent(NetContracts.Names.EggRollResponse)
	responseRemote:FireClient(
		player,
		{
			Success = true,
			RolledPets = results,
			UpdatedSoftPity = data.SoftPityCounter,
			UpdatedHardPity = data.HardPityCounter,
		} :: Types.EggRollResult
	)
end

function RngEggService.Init()
	local rollRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestRollEgg)
	rollRemote.OnServerEvent:Connect(function(player: Player, eggId: any, count: any)
		if type(eggId) == "string" and type(count) == "number" then
			RngEggService.RollEgg(player, eggId, count)
		end
	end)
end

return RngEggService
