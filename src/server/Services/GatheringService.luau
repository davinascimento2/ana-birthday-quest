--!strict

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local DataService = require(script.Parent.DataService)

local GatheringService = {}

local lastGatherTime: { [number]: number } = {}

local function findFieldAtPosition(pos: Vector3): Types.PollenFieldDefinition?
	for _, field in pairs(GameConfig.Fields) do
		local deltaX = math.abs(pos.X - field.CenterPosition.X)
		local deltaZ = math.abs(pos.Z - field.CenterPosition.Z)
		if deltaX <= (field.Bounds.X / 2) and deltaZ <= (field.Bounds.Z / 2) then
			return field
		end
	end
	return nil
end

function GatheringService.GatherPollen(player: Player, hitPosition: Vector3)
	local data = DataService.GetPlayerData(player)
	if not data then
		return
	end

	-- Backpack full check
	if data.CurrentPollen >= data.MaxPollenCapacity then
		return
	end

	-- Tool & Cooldown check
	local tool = GameConfig.Tools[data.EquippedToolId] or GameConfig.Tools.tool_scoop
	local now = os.clock()
	local lastTime = lastGatherTime[player.UserId] or 0
	if now - lastTime < tool.SwingCooldown then
		return
	end
	lastGatherTime[player.UserId] = now

	-- Player distance validation
	local character = player.Character
	if not character then
		return
	end
	local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not root then
		return
	end

	if (root.Position - hitPosition).Magnitude > (tool.CollectRadius + 18) then
		return
	end

	-- Field validation
	local field = findFieldAtPosition(hitPosition)
	local basePollen = if field then field.PollenPerFlower else 3

	-- Calculate Harvest
	local isCrit = math.random() < data.Stats.CritChance
	local critMult = if isCrit then 2.0 else 1.0
	local finalPollen = math.floor(basePollen * tool.CollectPower * data.Stats.GatherMultiplier * critMult)

	data.CurrentPollen = math.min(data.MaxPollenCapacity, data.CurrentPollen + finalPollen)

	-- Update active quests for pollen gathering
	for _questId, quest in pairs(data.ActiveQuests) do
		if not quest.IsCompleted then
			quest.CurrentAmount = math.min(quest.TargetAmount, quest.CurrentAmount + finalPollen)
			if quest.CurrentAmount >= quest.TargetAmount then
				quest.IsCompleted = true
				local questRemote = NetContracts.GetRemoteEvent(NetContracts.Names.QuestProgressUpdated)
				questRemote:FireClient(player, quest)
			end
		end
	end

	DataService.ReplicateToClient(player)

	local harvestRemote = NetContracts.GetRemoteEvent(NetContracts.Names.PollenHarvested)
	local payload: NetContracts.PollenHarvestPayload = {
		PlayerName = player.DisplayName or player.Name,
		Position = hitPosition,
		PollenGained = finalPollen,
		CurrentBackpack = data.CurrentPollen,
		MaxCapacity = data.MaxPollenCapacity,
	}
	harvestRemote:FireAllClients(payload)
end

function GatheringService.BuyTool(player: Player, toolId: string): boolean
	local tool = GameConfig.Tools[toolId]
	if not tool then
		return false
	end

	local data = DataService.GetPlayerData(player)
	if not data or data.Honey < tool.CostHoney or data.Level < tool.RequiredLevel then
		return false
	end

	if DataService.SpendHoney(player, tool.CostHoney) then
		data.EquippedToolId = toolId
		DataService.ReplicateToClient(player)
		return true
	end
	return false
end

function GatheringService.BuyBackpack(player: Player, packId: string): boolean
	local pack = GameConfig.Backpacks[packId]
	if not pack then
		return false
	end

	local data = DataService.GetPlayerData(player)
	if not data or data.Honey < pack.CostHoney or data.Level < pack.RequiredLevel then
		return false
	end

	if DataService.SpendHoney(player, pack.CostHoney) then
		data.EquippedBackpackId = packId
		data.MaxPollenCapacity = pack.Capacity
		DataService.ReplicateToClient(player)
		return true
	end
	return false
end

function GatheringService.Init()
	local gatherRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestGatherPollen)
	gatherRemote.OnServerEvent:Connect(function(player: Player, pos: any)
		if typeof(pos) == "Vector3" then
			GatheringService.GatherPollen(player, pos)
		end
	end)

	local buyToolRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestBuyTool)
	buyToolRemote.OnServerEvent:Connect(function(player: Player, toolId: any)
		if type(toolId) == "string" then
			GatheringService.BuyTool(player, toolId)
		end
	end)

	local buyPackRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestBuyBackpack)
	buyPackRemote.OnServerEvent:Connect(function(player: Player, packId: any)
		if type(packId) == "string" then
			GatheringService.BuyBackpack(player, packId)
		end
	end)
end

return GatheringService
