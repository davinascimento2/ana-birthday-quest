--!strict

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local DataService = require(script.Parent.DataService)

local QuestService = {}

type QuestDef = {
	Id: string,
	Title: string,
	TargetAmount: number,
	HoneyReward: number,
	ClawTokensReward: number,
	GemsReward: number,
	NextQuestId: string?,
}

local QUESTS: { [string]: QuestDef } = {
	quest_starter_1 = {
		Id = "quest_starter_1",
		Title = "🌻 Black Bear's First Harvest (Colha 150 Pólen)",
		TargetAmount = 150,
		HoneyReward = 500,
		ClawTokensReward = 1,
		GemsReward = 5,
		NextQuestId = "quest_clover_2",
	},
	quest_clover_2 = {
		Id = "quest_clover_2",
		Title = "🍀 Science Bear's Clover Study (Colha 500 Pólen)",
		TargetAmount = 500,
		HoneyReward = 2500,
		ClawTokensReward = 1,
		GemsReward = 15,
		NextQuestId = "quest_boss_defeat",
	},
	quest_boss_defeat = {
		Id = "quest_boss_defeat",
		Title = "⚔️ Bug Hunter (Derrote 1 Monstro do Campo)",
		TargetAmount = 1,
		HoneyReward = 8000,
		ClawTokensReward = 2,
		GemsReward = 30,
		NextQuestId = "quest_claw_master",
	},
	quest_claw_master = {
		Id = "quest_claw_master",
		Title = "🕹️ Arcade Legend (Jogue na Máquina de Garra)",
		TargetAmount = 1,
		HoneyReward = 25000,
		ClawTokensReward = 3,
		GemsReward = 100,
		NextQuestId = "quest_mushroom_5",
	},
	quest_mushroom_5 = {
		Id = "quest_mushroom_5",
		Title = "🍄 Science Bear's Spore Study (Colha 2.500 Pólen)",
		TargetAmount = 2500,
		HoneyReward = 65000,
		ClawTokensReward = 4,
		GemsReward = 150,
		NextQuestId = "quest_spider_boss_6",
	},
	quest_spider_boss_6 = {
		Id = "quest_spider_boss_6",
		Title = "🕷️ Spider Meadow Slayer (Derrote o Boss da Caverna)",
		TargetAmount = 1,
		HoneyReward = 150000,
		ClawTokensReward = 5,
		GemsReward = 250,
		NextQuestId = "quest_pineapple_7",
	},
	quest_pineapple_7 = {
		Id = "quest_pineapple_7",
		Title = "🍍 Pineapple Summit (Colha 15.000 Pólen Tropical)",
		TargetAmount = 15000,
		HoneyReward = 450000,
		ClawTokensReward = 6,
		GemsReward = 500,
		NextQuestId = "quest_coconut_oasis_endgame",
	},
	quest_coconut_oasis_endgame = {
		Id = "quest_coconut_oasis_endgame",
		Title = "🥥 Coconut Oasis Master (Colha 50.000 Pólen Celestial)",
		TargetAmount = 50000,
		HoneyReward = 2500000,
		ClawTokensReward = 10,
		GemsReward = 1500,
		NextQuestId = nil,
	},
}

function QuestService.ClaimQuest(player: Player, questId: string): boolean
	local data = DataService.GetPlayerData(player)
	if not data then
		return false
	end

	local questProgress = data.ActiveQuests[questId]
	local questDef = QUESTS[questId]
	if not questProgress or not questDef then
		return false
	end

	if not questProgress.IsCompleted or questProgress.IsClaimed then
		return false
	end

	questProgress.IsClaimed = true
	data.CompletedQuestIds[questId] = true

	-- Grant Rewards
	DataService.AddHoney(player, questDef.HoneyReward)
	if questDef.ClawTokensReward > 0 then
		DataService.AddClawTokens(player, questDef.ClawTokensReward)
	end
	if questDef.GemsReward > 0 then
		DataService.UpdatePlayerData(player, function(d)
			d.Gems += questDef.GemsReward
		end)
	end

	-- Remove claimed quest and unlock next
	data.ActiveQuests[questId] = nil
	if questDef.NextQuestId and QUESTS[questDef.NextQuestId] then
		local nextDef = QUESTS[questDef.NextQuestId]
		data.ActiveQuests[nextDef.Id] = {
			QuestId = nextDef.Id,
			CurrentAmount = 0,
			TargetAmount = nextDef.TargetAmount,
			IsCompleted = false,
			IsClaimed = false,
		} :: Types.QuestProgress
	end

	DataService.ReplicateToClient(player)
	return true
end

function QuestService.Init()
	local claimRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestClaimQuest)
	claimRemote.OnServerEvent:Connect(function(player: Player, questId: any)
		if type(questId) == "string" then
			QuestService.ClaimQuest(player, questId)
		end
	end)
end

return QuestService
