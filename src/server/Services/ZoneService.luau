--!strict

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")

local GameConfig = require(Shared:WaitForChild("GameConfig"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local DataService = require(script.Parent.DataService)

local ZoneService = {}

function ZoneService.GetRebirthCost(currentRebirths: number): number
	local formula = GameConfig.RebirthFormula
	return math.floor(formula.BaseCostCoins * (formula.GrowthFactor ^ currentRebirths))
end

function ZoneService.UnlockZone(player: Player, zoneId: string): boolean
	local zoneConfig = GameConfig.Zones[zoneId]
	if not zoneConfig then
		return false
	end

	local data = DataService.GetPlayerData(player)
	if not data then
		return false
	end

	if data.UnlockedZones[zoneId] then
		return true
	end

	if data.Rebirths < zoneConfig.RequiredRebirths then
		return false
	end

	if data.Coins < zoneConfig.CostCoins then
		return false
	end

	data.Coins -= zoneConfig.CostCoins
	data.UnlockedZones[zoneId] = true

	DataService.ReplicateToClient(player)

	local zoneRemote = NetContracts.GetRemoteEvent(NetContracts.Names.ZoneUnlocked)
	zoneRemote:FireClient(player, zoneId)

	return true
end

function ZoneService.Rebirth(player: Player): boolean
	local data = DataService.GetPlayerData(player)
	if not data then
		return false
	end

	local cost = ZoneService.GetRebirthCost(data.Rebirths)
	if data.Coins < cost then
		return false
	end

	data.Coins = 0
	data.Rebirths += 1

	DataService.ReplicateToClient(player)
	return true
end

function ZoneService.Init()
	local unlockRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestUnlockZone)
	unlockRemote.OnServerEvent:Connect(function(player: Player, zoneId: any)
		if type(zoneId) == "string" then
			ZoneService.UnlockZone(player, zoneId)
		end
	end)

	local rebirthRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestRebirth)
	rebirthRemote.OnServerEvent:Connect(function(player: Player)
		ZoneService.Rebirth(player)
	end)
end

return ZoneService
