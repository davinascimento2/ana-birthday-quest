--!strict

local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))
local DataService = require(script.Parent.DataService)

local PetService = {}

function PetService.CreatePet(petId: string, variant: Types.PetVariant?): Types.PetInstance
	return {
		UUID = HttpService:GenerateGUID(false),
		PetId = petId,
		Variant = variant or "Normal",
		Level = 1,
		XP = 0,
		Locked = false,
	}
end

function PetService.GetPetPower(pet: Types.PetInstance): number
	local def = GameConfig.Pets[pet.PetId]
	if not def then
		return 1.0
	end

	local variantMult = GameConfig.VariantMultipliers[pet.Variant] or 1.0
	local levelMult = 1.0 + (pet.Level - 1) * 0.1
	return def.BasePowerMultiplier * variantMult * levelMult
end

function PetService.CalculatePlayerDamage(player: Player): number
	local data = DataService.GetPlayerData(player)
	if not data then
		return 1.0
	end

	local rebirthMult = 1.0 + (data.Rebirths * GameConfig.RebirthFormula.PowerMultiplierPerRebirth)
	local totalPetPower = 0

	for _, uuid in ipairs(data.EquippedPetUUIDs) do
		local pet = data.InventoryPets[uuid]
		if pet then
			totalPetPower += PetService.GetPetPower(pet)
		end
	end

	-- Base click damage is 1.0 plus all pet power
	local finalDamage = (1.0 + totalPetPower) * rebirthMult
	return math.max(1.0, math.floor(finalDamage))
end

function PetService.EquipBest(player: Player)
	DataService.UpdatePlayerData(player, function(data)
		local petList: { Types.PetInstance } = {}
		for _, pet in pairs(data.InventoryPets) do
			table.insert(petList, pet)
		end

		table.sort(petList, function(a, b)
			return PetService.GetPetPower(a) > PetService.GetPetPower(b)
		end)

		local newEquipped: { string } = {}
		local equipCount = math.min(#petList, data.MaxPetsEquipped)
		for i = 1, equipCount do
			table.insert(newEquipped, petList[i].UUID)
		end

		data.EquippedPetUUIDs = newEquipped
	end)
end

function PetService.CraftVariant(player: Player, petId: string, targetVariant: Types.PetVariant): boolean
	local sourceVariant: Types.PetVariant
	if targetVariant == "Golden" then
		sourceVariant = "Normal"
	elseif targetVariant == "Rainbow" then
		sourceVariant = "Golden"
	elseif targetVariant == "DarkMatter" then
		sourceVariant = "Rainbow"
	else
		return false
	end

	local craftSuccess = false
	DataService.UpdatePlayerData(player, function(data)
		local matchingUUIDs: { string } = {}
		for uuid, pet in pairs(data.InventoryPets) do
			if pet.PetId == petId and pet.Variant == sourceVariant and not pet.Locked then
				table.insert(matchingUUIDs, uuid)
				if #matchingUUIDs == 5 then
					break
				end
			end
		end

		if #matchingUUIDs < 5 then
			return
		end

		-- Remove the 5 source pets
		for _, uuid in ipairs(matchingUUIDs) do
			data.InventoryPets[uuid] = nil
			-- Remove from equipped if was equipped
			local equippedIdx = table.find(data.EquippedPetUUIDs, uuid)
			if equippedIdx then
				table.remove(data.EquippedPetUUIDs, equippedIdx)
			end
		end

		-- Create upgraded pet
		local upgradedPet = PetService.CreatePet(petId, targetVariant)
		data.InventoryPets[upgradedPet.UUID] = upgradedPet
		craftSuccess = true
	end)

	return craftSuccess
end

function PetService.Init()
	local equipRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestEquipBest)
	equipRemote.OnServerEvent:Connect(function(player: Player)
		PetService.EquipBest(player)
	end)

	local craftRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestCraftVariant)
	craftRemote.OnServerEvent:Connect(function(player: Player, petId: any, targetVariant: any)
		if type(petId) == "string" and type(targetVariant) == "string" then
			PetService.CraftVariant(player, petId, targetVariant :: Types.PetVariant)
		end
	end)
end

return PetService
