--!strict

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local DATASTORE_NAME = "BeeSwarmTycoonRPG_Data_v2"
local AUTOSAVE_INTERVAL_SECONDS = 60

local DataService = {}
local sessionCache: { [number]: Types.PlayerDataSchema } = {}
local dataStore: GlobalDataStore? = nil

local dataStoreAvailable = false
if
	not RunService:IsStudio()
	or (
		RunService:IsStudio()
		and pcall(function()
			dataStore = DataStoreService:GetDataStore(DATASTORE_NAME)
			return dataStore
		end)
	)
then
	local success, result = pcall(function()
		return DataStoreService:GetDataStore(DATASTORE_NAME)
	end)
	if success and result then
		dataStore = result
		dataStoreAvailable = true
	else
		warn("[DataService] DataStoreService unavailable. Running in Mock Mode.")
	end
else
	warn("[DataService] Running in Studio Mock Mode.")
end

local function deepCopy<T>(original: T): T
	local copy: any
	if type(original) == "table" then
		copy = {}
		for key, value in pairs(original :: any) do
			copy[key] = deepCopy(value)
		end
	else
		copy = original
	end
	return copy :: T
end

local function reconcileData(savedData: any): Types.PlayerDataSchema
	local template = deepCopy(GameConfig.DefaultPlayerData)
	if type(savedData) ~= "table" then
		return template
	end

	for key, defaultValue in pairs(template :: any) do
		if savedData[key] == nil then
			savedData[key] = defaultValue
		end
	end

	if type(savedData.Stats) == "table" then
		for sKey, sVal in pairs(template.Stats :: any) do
			if savedData.Stats[sKey] == nil then
				savedData.Stats[sKey] = sVal
			end
		end
	else
		savedData.Stats = deepCopy(template.Stats)
	end

	if type(savedData.Settings) == "table" then
		for sKey, sVal in pairs(template.Settings :: any) do
			if savedData.Settings[sKey] == nil then
				savedData.Settings[sKey] = sVal
			end
		end
	else
		savedData.Settings = deepCopy(template.Settings)
	end

	return savedData :: Types.PlayerDataSchema
end

function DataService.GetPlayerData(player: Player): Types.PlayerDataSchema?
	return sessionCache[player.UserId]
end

function DataService.UpdatePlayerData(player: Player, updater: (Types.PlayerDataSchema) -> ()): Types.PlayerDataSchema?
	local data = sessionCache[player.UserId]
	if not data then
		return nil
	end

	updater(data)
	DataService.ReplicateToClient(player)
	return data
end

function DataService.ReplicateToClient(player: Player)
	local data = sessionCache[player.UserId]
	if not data then
		return
	end

	local remote = NetContracts.GetRemoteEvent(NetContracts.Names.PlayerDataUpdated)
	remote:FireClient(player, data)
end

function DataService.AddHoney(player: Player, amount: number)
	if amount <= 0 then
		return
	end
	DataService.UpdatePlayerData(player, function(data)
		data.Honey += amount
		data.XP += math.floor(amount * 0.1)
		-- Check Level Up
		local neededXP = data.Level * 1000
		if data.XP >= neededXP then
			data.Level += 1
			data.Stats.AttackPower += 2
			data.Stats.GatherMultiplier += 0.1
		end
	end)
end

function DataService.AddClawTokens(player: Player, amount: number)
	if amount <= 0 then
		return
	end
	DataService.UpdatePlayerData(player, function(data)
		data.ClawTokens += amount
	end)
end

function DataService.SpendClawTokens(player: Player, amount: number): boolean
	local data = sessionCache[player.UserId]
	if not data or data.ClawTokens < amount then
		return false
	end

	data.ClawTokens -= amount
	DataService.ReplicateToClient(player)
	return true
end

function DataService.SpendHoney(player: Player, amount: number): boolean
	local data = sessionCache[player.UserId]
	if not data or data.Honey < amount then
		return false
	end

	data.Honey -= amount
	DataService.ReplicateToClient(player)
	return true
end

local function loadPlayerData(player: Player)
	local userId = player.UserId
	local key = "BeeSwarm_" .. tostring(userId)
	local loadedData: any = nil

	if dataStoreAvailable and dataStore then
		local success, result = pcall(function()
			return dataStore:GetAsync(key)
		end)
		if success and result then
			loadedData = result
		end
	end

	local cleanData = reconcileData(loadedData)
	sessionCache[userId] = cleanData

	task.defer(function()
		DataService.ReplicateToClient(player)
	end)
end

local function savePlayerData(player: Player)
	local userId = player.UserId
	local data = sessionCache[userId]
	if not data then
		return
	end

	if dataStoreAvailable and dataStore then
		local key = "BeeSwarm_" .. tostring(userId)
		pcall(function()
			dataStore:SetAsync(key, data)
		end)
	end
end

function DataService.Init()
	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(loadPlayerData, player)
	end

	Players.PlayerAdded:Connect(loadPlayerData)

	Players.PlayerRemoving:Connect(function(player: Player)
		savePlayerData(player)
		sessionCache[player.UserId] = nil
	end)

	game:BindToClose(function()
		for _, player in ipairs(Players:GetPlayers()) do
			savePlayerData(player)
		end
	end)

	-- RemoteFunction to retrieve player data on demand
	local getFunc = NetContracts.GetRemoteFunction(NetContracts.Names.GetPlayerData)
	getFunc.OnServerInvoke = function(player: Player)
		return sessionCache[player.UserId]
	end

	-- Auto-save loop
	task.spawn(function()
		while true do
			task.wait(AUTOSAVE_INTERVAL_SECONDS)
			for _, player in ipairs(Players:GetPlayers()) do
				savePlayerData(player)
			end
		end
	end)
end

return DataService
