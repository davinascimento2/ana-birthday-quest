--!strict

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local Rarities = require(Shared:WaitForChild("Rarities"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local CameraShaker = require(script.Parent.Parent.Modules.CameraShaker)
local SoundController = require(script.Parent.SoundController)

local EggCutsceneController = {}

local cutsceneGui: ScreenGui? = nil

local function getCutsceneGui(): ScreenGui
	if not cutsceneGui then
		local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui") :: PlayerGui
		local gui = playerGui:FindFirstChild("EggCutsceneGui") :: ScreenGui?
		if not gui then
			gui = Instance.new("ScreenGui")
			gui.Name = "EggCutsceneGui"
			gui.ResetOnSpawn = false
			gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
			gui.Parent = playerGui
		end
		cutsceneGui = gui
	end
	return cutsceneGui :: ScreenGui
end

local function playHighTierReveal(petDef: Types.PetDefinition, variant: Types.PetVariant)
	local gui = getCutsceneGui()

	local rarityDef = Rarities.Get(petDef.Rarity)

	CameraShaker.AddTrauma(rarityDef.ScreenShakeTrauma)
	SoundController.PlayFanfare(petDef.Rarity)

	-- Fullscreen Flash Frame
	local flash = Instance.new("Frame")
	flash.Name = "Flash"
	flash.Size = UDim2.new(1, 0, 1, 0)
	flash.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	flash.BackgroundTransparency = 0.1
	flash.ZIndex = 50
	flash.Parent = gui

	local flashTween = TweenService:Create(
		flash,
		TweenInfo.new(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		{ BackgroundTransparency = 1 }
	)
	flashTween:Play()
	flashTween.Completed:Once(function()
		flash:Destroy()
	end)

	-- Announcement Title Modal
	local banner = Instance.new("Frame")
	banner.Name = "MythicBanner"
	banner.Size = UDim2.new(0, 480, 0, 220)
	banner.Position = UDim2.new(0.5, -240, 0.35, -110)
	banner.BackgroundColor3 = Color3.fromRGB(25, 25, 35)
	banner.BorderSizePixel = 4
	banner.BorderColor3 = rarityDef.Color
	banner.ZIndex = 40
	banner.Parent = gui

	local uicorner = Instance.new("UICorner")
	uicorner.CornerRadius = UDim.new(0, 16)
	uicorner.Parent = banner

	local titleLabel = Instance.new("TextLabel")
	titleLabel.Size = UDim2.new(1, 0, 0, 50)
	titleLabel.Position = UDim2.new(0, 0, 0, 15)
	titleLabel.BackgroundTransparency = 1
	titleLabel.Font = Enum.Font.FredokaOne
	titleLabel.TextSize = 36
	titleLabel.TextColor3 = rarityDef.Color
	titleLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
	titleLabel.TextStrokeTransparency = 0.2
	titleLabel.Text = petDef.Rarity:upper() .. " PULL!"
	titleLabel.ZIndex = 41
	titleLabel.Parent = banner

	local nameLabel = Instance.new("TextLabel")
	nameLabel.Size = UDim2.new(1, 0, 0, 45)
	nameLabel.Position = UDim2.new(0, 0, 0, 75)
	nameLabel.BackgroundTransparency = 1
	nameLabel.Font = Enum.Font.FredokaOne
	nameLabel.TextSize = 28
	nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
	nameLabel.Text = (if variant ~= "Normal" then "[" .. variant .. "] " else "") .. petDef.Name
	nameLabel.ZIndex = 41
	nameLabel.Parent = banner

	local subLabel = Instance.new("TextLabel")
	subLabel.Size = UDim2.new(1, 0, 0, 30)
	subLabel.Position = UDim2.new(0, 0, 0, 140)
	subLabel.BackgroundTransparency = 1
	subLabel.Font = Enum.Font.FredokaOne
	subLabel.TextSize = 20
	subLabel.TextColor3 = Color3.fromRGB(255, 225, 80)
	subLabel.Text = "Power Multiplier: " .. tostring(petDef.BasePowerMultiplier) .. "x"
	subLabel.ZIndex = 41
	subLabel.Parent = banner

	task.delay(2.8, function()
		local closeTween = TweenService:Create(
			banner,
			TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.In),
			{ Position = UDim2.new(0.5, -240, -0.3, 0) }
		)
		closeTween:Play()
		closeTween.Completed:Once(function()
			banner:Destroy()
		end)
	end)
end

function EggCutsceneController.PlayRollAnimation(rolledPets: {
	{
		PetId: string,
		Rarity: Types.RarityTier,
		Variant: Types.PetVariant,
		WasPityTriggered: boolean,
		WasAutoDeleted: boolean,
		NearMissPetId: string,
	}
})
	for _, rollData in ipairs(rolledPets) do
		local petDef = GameConfig.Pets[rollData.PetId]
		if not petDef then
			continue
		end

		local rarityDef = Rarities.Get(rollData.Rarity)

		-- Play rolling sound ticks
		for t = 1, 6 do
			task.delay(t * 0.08, function()
				SoundController.PlayRollTick()
			end)
		end

		if rarityDef.TriggersFullCutscene then
			task.delay(0.55, function()
				playHighTierReveal(petDef, rollData.Variant)
			end)
		else
			-- Snappy mini-reveal
			CameraShaker.AddTrauma(rarityDef.ScreenShakeTrauma)
			SoundController.PlayHit(false)
		end
	end
end

function EggCutsceneController.Init()
	getCutsceneGui()

	local rollResponseRemote = NetContracts.GetRemoteEvent(NetContracts.Names.EggRollResponse)
	rollResponseRemote.OnClientEvent:Connect(function(result: Types.EggRollResult)
		if result.Success and result.RolledPets then
			EggCutsceneController.PlayRollAnimation(result.RolledPets)
		end
	end)
end

return EggCutsceneController
