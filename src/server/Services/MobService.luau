--!strict

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local DataService = require(script.Parent.DataService)

local MobService = {}

local activeMobs: { [string]: Types.ActiveMobState } = {}
local lastAttackTime: { [number]: number } = {}

function MobService.SpawnMob(mobDefId: string)
	local def = GameConfig.Mobs[mobDefId]
	if not def then
		return
	end

	local instanceId = HttpService:GenerateGUID(false)
	local offset =
		Vector3.new(math.random(-def.RoamRadius, def.RoamRadius), 0, math.random(-def.RoamRadius, def.RoamRadius))

	local state: Types.ActiveMobState = {
		InstanceId = instanceId,
		MobId = mobDefId,
		Position = def.SpawnPosition + offset,
		CurrentHealth = def.MaxHealth,
		MaxHealth = def.MaxHealth,
		TargetPlayerId = nil,
	}

	activeMobs[instanceId] = state

	local spawnRemote = NetContracts.GetRemoteEvent(NetContracts.Names.MobSpawned)
	spawnRemote:FireAllClients(state)
end

function MobService.AttackMob(player: Player, instanceId: string)
	local state = activeMobs[instanceId]
	if not state then
		return
	end

	local def = GameConfig.Mobs[state.MobId]
	if not def then
		return
	end

	local now = os.clock()
	local lastTime = lastAttackTime[player.UserId] or 0
	if now - lastTime < 0.25 then
		return
	end
	lastAttackTime[player.UserId] = now

	local character = player.Character
	if not character then
		return
	end
	local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not root or (root.Position - state.Position).Magnitude > 35 then
		return
	end

	local data = DataService.GetPlayerData(player)
	local baseDamage = if data then data.Stats.AttackPower else 5
	local isCrit = math.random() < (if data then data.Stats.CritChance else 0.1)
	local totalDamage = if isCrit then math.floor(baseDamage * 2.2) else baseDamage

	state.CurrentHealth = math.max(0, state.CurrentHealth - totalDamage)

	local damageRemote = NetContracts.GetRemoteEvent(NetContracts.Names.MobDamaged)
	local payload: NetContracts.MobDamagePayload = {
		InstanceId = instanceId,
		Damage = totalDamage,
		CurrentHealth = state.CurrentHealth,
		MaxHealth = state.MaxHealth,
		AttackerName = player.DisplayName or player.Name,
	}
	damageRemote:FireAllClients(payload)

	if state.CurrentHealth <= 0 then
		MobService.DefeatMob(player, instanceId)
	end
end

function MobService.DefeatMob(player: Player, instanceId: string)
	local state = activeMobs[instanceId]
	if not state then
		return
	end

	local def = GameConfig.Mobs[state.MobId]
	if not def then
		activeMobs[instanceId] = nil
		return
	end

	activeMobs[instanceId] = nil

	-- Reward Honey
	DataService.AddHoney(player, def.HoneyReward)

	-- Chance to drop valuable Claw Token for progression
	local wonToken = math.random() < def.TokenRewardChance
	if wonToken then
		DataService.AddClawTokens(player, 1)
	end

	-- Update active quests
	local data = DataService.GetPlayerData(player)
	if data then
		for _, quest in pairs(data.ActiveQuests) do
			if not quest.IsCompleted and quest.QuestId == "quest_boss_defeat" then
				quest.CurrentAmount = math.min(quest.TargetAmount, quest.CurrentAmount + 1)
				if quest.CurrentAmount >= quest.TargetAmount then
					quest.IsCompleted = true
				end
			end
		end
		DataService.ReplicateToClient(player)
	end

	local defeatRemote = NetContracts.GetRemoteEvent(NetContracts.Names.MobDefeated)
	defeatRemote:FireAllClients(instanceId, def.HoneyReward, wonToken)

	-- Schedule respawn
	task.delay(def.RespawnTime, function()
		MobService.SpawnMob(def.Id)
	end)
end

function MobService.Init()
	local attackRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestAttackMob)
	attackRemote.OnServerEvent:Connect(function(player: Player, id: any)
		if type(id) == "string" then
			MobService.AttackMob(player, id)
		end
	end)

	local getMobsFunc = NetContracts.GetRemoteFunction(NetContracts.Names.GetActiveMobs)
	getMobsFunc.OnServerInvoke = function()
		local list = {}
		for _, m in pairs(activeMobs) do
			table.insert(list, m)
		end
		return list
	end

	-- Spawn initial mobs
	for _, def in pairs(GameConfig.Mobs) do
		local count = if def.Id == "mob_spider_boss" then 1 else 2
		for _ = 1, count do
			MobService.SpawnMob(def.Id)
		end
	end

	-- Send mobs to joining players
	Players.PlayerAdded:Connect(function(player: Player)
		task.wait(1.5)
		local spawnRemote = NetContracts.GetRemoteEvent(NetContracts.Names.MobSpawned)
		for _, m in pairs(activeMobs) do
			spawnRemote:FireClient(player, m)
		end
	end)
end

return MobService
