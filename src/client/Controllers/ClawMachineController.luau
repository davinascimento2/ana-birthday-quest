--!strict

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local SoundController = require(script.Parent.SoundController)
local CameraShaker = require(script.Parent.Parent.Modules.CameraShaker)

local ClawMachineController = {}

local function showRewardBanner(reward: Types.ClawReward)
	local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui") :: PlayerGui
	local screenGui = playerGui:FindFirstChild("MainGameHUD") :: ScreenGui?
	if not screenGui then
		return
	end

	SoundController.PlayFanfare(reward.Rarity)
	CameraShaker.AddTrauma(0.5)

	local modal = Instance.new("Frame")
	modal.Name = "ClawRewardModal"
	modal.Size = UDim2.new(0, 420, 0, 180)
	modal.Position = UDim2.new(0.5, -210, 0.35, -90)
	modal.BackgroundColor3 = Color3.fromRGB(20, 24, 38)
	modal.BorderSizePixel = 3
	modal.BorderColor3 = reward.Color
	modal.ZIndex = 50
	modal.Parent = screenGui

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 16)
	corner.Parent = modal

	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, 0, 0, 40)
	title.Position = UDim2.new(0, 0, 0, 15)
	title.BackgroundTransparency = 1
	title.Font = Enum.Font.FredokaOne
	title.TextSize = 28
	title.TextColor3 = reward.Color
	title.Text = "🕹️ PRÊMIO DA MÁQUINA DE GARRA!"
	title.ZIndex = 51
	title.Parent = modal

	local desc = Instance.new("TextLabel")
	desc.Size = UDim2.new(1, 0, 0, 50)
	desc.Position = UDim2.new(0, 0, 0, 65)
	desc.BackgroundTransparency = 1
	desc.Font = Enum.Font.FredokaOne
	desc.TextSize = 24
	desc.TextColor3 = Color3.fromRGB(255, 255, 255)
	desc.Text = "[" .. reward.Rarity:upper() .. "] " .. reward.DisplayName
	desc.ZIndex = 51
	desc.Parent = modal

	task.delay(3.5, function()
		local closeTween = TweenService:Create(
			modal,
			TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.In),
			{ Position = UDim2.new(0.5, -210, -0.3, 0) }
		)
		closeTween:Play()
		closeTween.Completed:Once(function()
			modal:Destroy()
		end)
	end)
end

function ClawMachineController.Play()
	local remote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestPlayClawMachine)
	remote:FireServer()
end

function ClawMachineController.Init()
	local activatedRemote = NetContracts.GetRemoteEvent(NetContracts.Names.ClawMachineActivated)
	activatedRemote.OnClientEvent:Connect(function(_payload: NetContracts.ClawPlayPayload)
		SoundController.PlayRollTick()
	end)

	local finishedRemote = NetContracts.GetRemoteEvent(NetContracts.Names.ClawMachineFinished)
	finishedRemote.OnClientEvent:Connect(function(result: Types.ClawResult)
		if result.Success and result.WonReward then
			showRewardBanner(result.WonReward)
		end
	end)
end

return ClawMachineController
