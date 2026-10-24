--!strict

local Types = require(script.Parent.Types)

export type PollenHarvestPayload = {
	PlayerName: string,
	Position: Vector3,
	PollenGained: number,
	CurrentBackpack: number,
	MaxCapacity: number,
}

export type HoneyConvertPayload = {
	PlayerName: string,
	PollenConverted: number,
	HoneyEarned: number,
	NewHoneyTotal: number,
}

export type MobDamagePayload = {
	InstanceId: string,
	Damage: number,
	CurrentHealth: number,
	MaxHealth: number,
	AttackerName: string,
}

export type ClawPlayPayload = {
	PlayerName: string,
	ClawPosition: Vector3,
	RewardName: string,
	Rarity: Types.RarityTier,
}

local NetContracts = {
	Names = {
		-- Client -> Server Requests
		RequestGatherPollen = "RequestGatherPollen",
		RequestConvertHoney = "RequestConvertHoney",
		RequestClaimPlot = "RequestClaimPlot",
		RequestPlayClawMachine = "RequestPlayClawMachine",
		RequestBuyTool = "RequestBuyTool",
		RequestBuyBackpack = "RequestBuyBackpack",
		RequestAttackMob = "RequestAttackMob",
		RequestClaimQuest = "RequestClaimQuest",
		RequestHatchEgg = "RequestHatchEgg",

		-- Server -> Client Events
		PlayerDataUpdated = "PlayerDataUpdated",
		PollenHarvested = "PollenHarvested",
		HoneyConverted = "HoneyConverted",
		PlotClaimed = "PlotClaimed",
		ClawMachineActivated = "ClawMachineActivated",
		ClawMachineFinished = "ClawMachineFinished",
		MobSpawned = "MobSpawned",
		MobDamaged = "MobDamaged",
		MobDefeated = "MobDefeated",
		QuestProgressUpdated = "QuestProgressUpdated",
		GlobalAnnouncement = "GlobalAnnouncement",

		-- RemoteFunctions
		GetPlayerData = "GetPlayerData",
		GetActiveMobs = "GetActiveMobs",
		GetPlotStates = "GetPlotStates",
	},
}

local function getFolder(): Folder
	local replicatedStorage = game:GetService("ReplicatedStorage")
	local folder = replicatedStorage:FindFirstChild("NetRemotes")
	if not folder then
		if game:GetService("RunService"):IsServer() then
			local newFolder = Instance.new("Folder")
			newFolder.Name = "NetRemotes"
			newFolder.Parent = replicatedStorage
			return newFolder
		else
			folder = replicatedStorage:WaitForChild("NetRemotes", 10) :: Folder
		end
	end
	return folder :: Folder
end

function NetContracts.GetRemoteEvent(name: string): RemoteEvent
	local folder = getFolder()
	if game:GetService("RunService"):IsServer() then
		local remote = folder:FindFirstChild(name) :: RemoteEvent?
		if not remote then
			remote = Instance.new("RemoteEvent")
			remote.Name = name
			remote.Parent = folder
		end
		return remote
	else
		return folder:WaitForChild(name, 10) :: RemoteEvent
	end
end

function NetContracts.GetRemoteFunction(name: string): RemoteFunction
	local folder = getFolder()
	if game:GetService("RunService"):IsServer() then
		local remote = folder:FindFirstChild(name) :: RemoteFunction?
		if not remote then
			remote = Instance.new("RemoteFunction")
			remote.Name = name
			remote.Parent = folder
		end
		return remote
	else
		return folder:WaitForChild(name, 10) :: RemoteFunction
	end
end

return NetContracts
