--!strict

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local DataService = require(script.Parent.DataService)
local PetService = require(script.Parent.PetService)
local HypeService = require(script.Parent.HypeService)

local BreakableService = {}

local activeBreakables: { [string]: Types.ActiveBreakableState } = {}
local lastDamageTime: { [number]: number } = {}

local function generateSpawnPosition(zoneConfig: GameConfig.ZoneConfig): Vector3
	local halfX = (zoneConfig.ZoneBounds.X * 0.4)
	local halfZ = (zoneConfig.ZoneBounds.Z * 0.4)

	local offsetX = math.random(-math.floor(halfX), math.floor(halfX))
	local offsetZ = math.random(-math.floor(halfZ), math.floor(halfZ))

	return zoneConfig.CenterPosition + Vector3.new(offsetX, 2, offsetZ)
end

function BreakableService.SpawnBreakable(defId: string, zoneId: string)
	local def = GameConfig.Breakables[defId]
	local zone = GameConfig.Zones[zoneId]
	if not def or not zone then
		return
	end

	local instanceId = HttpService:GenerateGUID(false)
	local spawnPos = generateSpawnPosition(zone)

	local state: Types.ActiveBreakableState = {
		InstanceId = instanceId,
		DefinitionId = defId,
		ZoneId = zoneId,
		Position = spawnPos,
		CurrentHealth = def.MaxHealth,
		MaxHealth = def.MaxHealth,
	}

	activeBreakables[instanceId] = state

	local spawnRemote = NetContracts.GetRemoteEvent(NetContracts.Names.BreakableSpawned)
	spawnRemote:FireAllClients(state)
end

function BreakableService.DamageBreakable(player: Player, instanceId: string)
	local state = activeBreakables[instanceId]
	if not state then
		return
	end

	local def = GameConfig.Breakables[state.DefinitionId]
	if not def then
		return
	end

	-- Basic anti-cheat: rate-limiting clicks (max ~15 per second per player)
	local now = os.clock()
	local lastTime = lastDamageTime[player.UserId] or 0
	if now - lastTime < 0.05 then
		return
	end
	lastDamageTime[player.UserId] = now

	-- Proximity validation: player must be within reasonable distance (<= 120 studs)
	local character = player.Character
	if character then
		local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
		if root then
			local distance = (root.Position - state.Position).Magnitude
			if distance > 120 then
				return
			end
		end
	end

	-- Calculate damage
	local baseDamage = PetService.CalculatePlayerDamage(player)
	local isCritical = math.random() < 0.15
	local multiplier = if isCritical then 2.2 else 1.0
	local totalDamage = math.floor(baseDamage * multiplier)

	state.CurrentHealth = math.max(0, state.CurrentHealth - totalDamage)

	local damageRemote = NetContracts.GetRemoteEvent(NetContracts.Names.BreakableDamaged)
	local damagePayload: NetContracts.DamagePayload = {
		InstanceId = instanceId,
		CurrentHealth = state.CurrentHealth,
		MaxHealth = state.MaxHealth,
		Damage = totalDamage,
		IsCritical = isCritical,
		Position = state.Position,
	}
	damageRemote:FireAllClients(damagePayload)

	if state.CurrentHealth <= 0 then
		BreakableService.DestroyBreakable(player, instanceId)
	end
end

function BreakableService.DestroyBreakable(player: Player, instanceId: string)
	local state = activeBreakables[instanceId]
	if not state then
		return
	end

	local def = GameConfig.Breakables[state.DefinitionId]
	if not def then
		activeBreakables[instanceId] = nil
		return
	end

	activeBreakables[instanceId] = nil

	local isFeverActive = HypeService.IsFeverActive()
	local feverMult = if isFeverActive then 2.0 else 1.0

	local data = DataService.GetPlayerData(player)
	local rebirthBonus = if data then (1.0 + data.Rebirths * 0.5) else 1.0

	local finalCoins = math.floor(def.BaseCoinReward * feverMult * rebirthBonus)
	local finalGems = 0

	local gemRollChance = def.GemDropChance * (if isFeverActive then 1.5 else 1.0)
	if math.random() < gemRollChance then
		finalGems = def.GemReward * (if isFeverActive then 2 else 1)
	end

	-- Credit rewards to player
	DataService.AddCoins(player, finalCoins)
	if finalGems > 0 then
		DataService.AddGems(player, finalGems)
	end

	local destroyRemote = NetContracts.GetRemoteEvent(NetContracts.Names.BreakableDestroyed)
	local destroyPayload: NetContracts.DestroyPayload = {
		InstanceId = instanceId,
		OriginPosition = state.Position,
		Coins = finalCoins,
		Gems = finalGems,
		VisualBurstCount = def.VisualBurstCount,
	}
	destroyRemote:FireAllClients(destroyPayload)

	-- Schedule respawn
	local respawnDelay = if isFeverActive then 1.5 else 3.5
	task.delay(respawnDelay, function()
		BreakableService.SpawnBreakable(def.Id, state.ZoneId)
	end)
end

function BreakableService.Init()
	-- Initial population of all zones first
	for _, def in pairs(GameConfig.Breakables) do
		local spawnCount = if def.IsBossChest then 1 else 3
		for _ = 1, spawnCount do
			BreakableService.SpawnBreakable(def.Id, def.ZoneId)
		end
	end

	-- Connect network requests
	local damageRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestDamageBreakable)
	damageRemote.OnServerEvent:Connect(function(player: Player, instanceId: any)
		if type(instanceId) == "string" then
			BreakableService.DamageBreakable(player, instanceId)
		end
	end)

	local getActiveRemote = NetContracts.GetRemoteFunction("GetActiveBreakables")
	getActiveRemote.OnServerInvoke = function(_player: Player)
		local list = {}
		for _, state in pairs(activeBreakables) do
			table.insert(list, state)
		end
		return list
	end

	local function sendActiveBreakables(player: Player)
		local spawnRemote = NetContracts.GetRemoteEvent(NetContracts.Names.BreakableSpawned)
		for _, state in pairs(activeBreakables) do
			spawnRemote:FireClient(player, state)
		end
	end

	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(function()
			task.wait(0.5)
			sendActiveBreakables(player)
		end)
	end

	Players.PlayerAdded:Connect(function(player: Player)
		task.wait(0.8)
		sendActiveBreakables(player)
	end)
end

return BreakableService
