--!strict

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local DataService = require(script.Parent.DataService)

local ClawMachineService = {}

local isClawBusy = false

local function selectWeightedReward(): Types.ClawReward
	local rewards = GameConfig.ClawRewards
	local totalWeight = 0
	for _, r in ipairs(rewards) do
		totalWeight += r.Weight
	end

	local roll = math.random() * totalWeight
	local accumulated = 0

	for _, r in ipairs(rewards) do
		accumulated += r.Weight
		if roll <= accumulated then
			return r
		end
	end
	return rewards[1]
end

function ClawMachineService.PlayClaw(player: Player): Types.ClawResult
	local data = DataService.GetPlayerData(player)
	if not data then
		return {
			Success = false,
			ErrorReason = "Data unavailable",
			RemainingTokens = 0,
		}
	end

	if data.ClawTokens < GameConfig.ClawMachine.CostClawTokens then
		return {
			Success = false,
			ErrorReason = "Precisa de 1 Claw Token! Complete quests ou derrote bosses.",
			RemainingTokens = data.ClawTokens,
		}
	end

	if isClawBusy then
		return {
			Success = false,
			ErrorReason = "Máquina de Garra ocupada! Aguarde a rodada atual terminar.",
			RemainingTokens = data.ClawTokens,
		}
	end

	isClawBusy = true
	DataService.SpendClawTokens(player, GameConfig.ClawMachine.CostClawTokens)

	local wonReward = selectWeightedReward()

	-- Notify all clients of crane action
	local activatedRemote = NetContracts.GetRemoteEvent(NetContracts.Names.ClawMachineActivated)
	local payload: NetContracts.ClawPlayPayload = {
		PlayerName = player.DisplayName or player.Name,
		ClawPosition = GameConfig.ClawMachine.WorldPosition,
		RewardName = wonReward.DisplayName,
		Rarity = wonReward.Rarity,
	}
	activatedRemote:FireAllClients(payload)

	-- Wait for crane drop and retrieve animation (4.5s)
	task.delay(GameConfig.ClawMachine.DurationSeconds, function()
		isClawBusy = false

		-- Award the prize to player
		if wonReward.RewardType == "Honey" then
			DataService.AddHoney(player, wonReward.Amount)
		elseif wonReward.RewardType == "Gems" then
			DataService.UpdatePlayerData(player, function(d)
				d.Gems += wonReward.Amount
			end)
		elseif wonReward.RewardType == "SecretKey" then
			DataService.UpdatePlayerData(player, function(d)
				d.UnlockedGates["CoconutOasisGate"] = true
			end)
		elseif wonReward.RewardType == "LegendaryTool" then
			DataService.UpdatePlayerData(player, function(d)
				d.EquippedToolId = "tool_spark_staff"
			end)
		end

		local finishedRemote = NetContracts.GetRemoteEvent(NetContracts.Names.ClawMachineFinished)
		finishedRemote:FireClient(
			player,
			{
				Success = true,
				WonReward = wonReward,
				RemainingTokens = data.ClawTokens,
			} :: Types.ClawResult
		)

		-- Global server broadcast if Mythic or Secret
		if wonReward.Rarity == "Mythic" or wonReward.Rarity == "Secret" or wonReward.Rarity == "Legendary" then
			local announcementRemote = NetContracts.GetRemoteEvent(NetContracts.Names.GlobalAnnouncement)
			announcementRemote:FireAllClients({
				PlayerName = player.DisplayName or player.Name,
				PetName = wonReward.DisplayName,
				Rarity = wonReward.Rarity,
				Variant = "Normal",
			})
		end
	end)

	return {
		Success = true,
		WonReward = wonReward,
		RemainingTokens = data.ClawTokens,
	}
end

function ClawMachineService.Init()
	local playRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestPlayClawMachine)
	playRemote.OnServerEvent:Connect(function(player: Player)
		ClawMachineService.PlayClaw(player)
	end)
end

return ClawMachineService
