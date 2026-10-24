--!strict

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))
local DataService = require(script.Parent.DataService)

local TycoonService = {}

type PlotState = {
	Index: number,
	OwnerUserId: number?,
	OwnerName: string?,
}

local plotStates: { [number]: PlotState } = {}

local function initializePlots()
	for _, plotCfg in ipairs(GameConfig.HivePlots) do
		plotStates[plotCfg.Index] = {
			Index = plotCfg.Index,
			OwnerUserId = nil,
			OwnerName = nil,
		}
	end
end

function TycoonService.ClaimPlot(player: Player, plotIndex: number): boolean
	local plot = plotStates[plotIndex]
	if not plot or plot.OwnerUserId ~= nil then
		return false
	end

	-- Check if player already has a plot
	for _, p in pairs(plotStates) do
		if p.OwnerUserId == player.UserId then
			return false
		end
	end

	plot.OwnerUserId = player.UserId
	plot.OwnerName = player.DisplayName or player.Name

	DataService.UpdatePlayerData(player, function(data)
		data.ClaimedPlotIndex = plotIndex
	end)

	local claimRemote = NetContracts.GetRemoteEvent(NetContracts.Names.PlotClaimed)
	claimRemote:FireAllClients(plotIndex, plot.OwnerName)
	return true
end

function TycoonService.ConvertHoney(player: Player): boolean
	local data = DataService.GetPlayerData(player)
	if not data or data.CurrentPollen <= 0 then
		return false
	end

	local plotIndex = data.ClaimedPlotIndex
	if not plotIndex then
		return false
	end

	local plotCfg = GameConfig.HivePlots[plotIndex]
	if not plotCfg then
		return false
	end

	-- Distance validation: player must be near their Hive platform (within 35 studs)
	local character = player.Character
	if character then
		local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
		if root then
			local distance = (root.Position - plotCfg.Position).Magnitude
			if distance > 45 then
				return false
			end
		end
	end

	local pollenToConvert = data.CurrentPollen
	local honeyEarned = math.floor(pollenToConvert * (1.0 + data.Stats.GatherMultiplier * 0.2))

	data.CurrentPollen = 0
	DataService.AddHoney(player, honeyEarned)

	local convertRemote = NetContracts.GetRemoteEvent(NetContracts.Names.HoneyConverted)
	local payload: NetContracts.HoneyConvertPayload = {
		PlayerName = player.DisplayName or player.Name,
		PollenConverted = pollenToConvert,
		HoneyEarned = honeyEarned,
		NewHoneyTotal = data.Honey,
	}
	convertRemote:FireAllClients(payload)
	return true
end

function TycoonService.Init()
	initializePlots()

	local claimRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestClaimPlot)
	claimRemote.OnServerEvent:Connect(function(player: Player, plotIndex: any)
		if type(plotIndex) == "number" then
			TycoonService.ClaimPlot(player, plotIndex)
		end
	end)

	local convertRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestConvertHoney)
	convertRemote.OnServerEvent:Connect(function(player: Player)
		TycoonService.ConvertHoney(player)
	end)

	local getPlotsFunc = NetContracts.GetRemoteFunction(NetContracts.Names.GetPlotStates)
	getPlotsFunc.OnServerInvoke = function()
		return plotStates
	end

	-- Auto-assign plot on join if not assigned
	Players.PlayerAdded:Connect(function(player: Player)
		task.wait(1.5)
		for _, plot in ipairs(plotStates) do
			if plot.OwnerUserId == nil then
				TycoonService.ClaimPlot(player, plot.Index)
				break
			end
		end
	end)

	-- Release plot when player leaves
	Players.PlayerRemoving:Connect(function(player: Player)
		for _, plot in pairs(plotStates) do
			if plot.OwnerUserId == player.UserId then
				plot.OwnerUserId = nil
				plot.OwnerName = nil
				local remote = NetContracts.GetRemoteEvent(NetContracts.Names.PlotClaimed)
				remote:FireAllClients(plot.Index, "")
			end
		end
	end)
end

return TycoonService
