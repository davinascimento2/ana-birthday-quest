--!strict

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local SoundController = require(script.Parent.SoundController)

local TycoonController = {}

local myClaimedPlotIndex: number? = nil
local lastConvertAttempt = 0

function TycoonController.Init()
	local dataRemote = NetContracts.GetRemoteEvent(NetContracts.Names.PlayerDataUpdated)
	dataRemote.OnClientEvent:Connect(function(data: Types.PlayerDataSchema)
		myClaimedPlotIndex = data.ClaimedPlotIndex
	end)

	local honeyConvertedRemote = NetContracts.GetRemoteEvent(NetContracts.Names.HoneyConverted)
	honeyConvertedRemote.OnClientEvent:Connect(function(payload: NetContracts.HoneyConvertPayload)
		local localPlayer = Players.LocalPlayer
		if localPlayer and payload.PlayerName == (localPlayer.DisplayName or localPlayer.Name) then
			SoundController.PlayPowerUp()
		end
	end)

	-- Proximity check to player's hive pad
	RunService.Heartbeat:Connect(function()
		if not myClaimedPlotIndex then
			return
		end

		local plotCfg = GameConfig.HivePlots[myClaimedPlotIndex]
		if not plotCfg then
			return
		end

		local localPlayer = Players.LocalPlayer
		if not localPlayer then
			return
		end

		local character = localPlayer.Character
		if not character then
			return
		end

		local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
		if not root then
			return
		end

		local distance = (root.Position - plotCfg.Position).Magnitude
		if distance < 20 then
			local now = os.clock()
			if now - lastConvertAttempt > 1.5 then
				lastConvertAttempt = now
				local convertRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestConvertHoney)
				convertRemote:FireServer()
			end
		end
	end)
end

return TycoonController
