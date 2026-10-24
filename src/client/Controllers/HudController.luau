--!strict

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local NumbersUtil = require(Shared:WaitForChild("NumbersUtil"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local SoundController = require(script.Parent.SoundController)
local ClawMachineController = require(script.Parent.ClawMachineController)

local HudController = {}

local honeyLabel: TextLabel? = nil
local gemsLabel: TextLabel? = nil
local tokensLabel: TextLabel? = nil
local pollenText: TextLabel? = nil
local pollenFill: Frame? = nil
local levelText: TextLabel? = nil

local questTitle: TextLabel? = nil
local questProgressLabel: TextLabel? = nil
local questClaimBtn: TextButton? = nil

local currentClaimableQuestId: string? = nil

local displayedHoney = 0
local targetHoney = 0
local displayedGems = 0
local targetGems = 0

local function createHud()
	local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui") :: PlayerGui
	local existing = playerGui:FindFirstChild("MainGameHUD")
	if existing then
		existing:Destroy()
	end

	local gui = Instance.new("ScreenGui")
	gui.Name = "MainGameHUD"
	gui.ResetOnSpawn = false
	gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	gui.Parent = playerGui

	-- 1. TOP CURRENCY & BACKPACK BAR
	local topBar = Instance.new("Frame")
	topBar.Name = "TopBar"
	topBar.Size = UDim2.new(0, 560, 0, 75)
	topBar.Position = UDim2.new(0.5, -280, 0, 15)
	topBar.BackgroundColor3 = Color3.fromRGB(20, 22, 32)
	topBar.BorderSizePixel = 0
	topBar.Parent = gui

	local topCorner = Instance.new("UICorner")
	topCorner.CornerRadius = UDim.new(0, 16)
	topCorner.Parent = topBar

	local topStroke = Instance.new("UIStroke")
	topStroke.Color = Color3.fromRGB(245, 180, 20)
	topStroke.Thickness = 2.5
	topStroke.Parent = topBar

	-- Level Indicator (Left)
	local lvlBox = Instance.new("Frame")
	lvlBox.Name = "LvlBox"
	lvlBox.Size = UDim2.new(0, 80, 0, 30)
	lvlBox.Position = UDim2.new(0, 10, 0, 8)
	lvlBox.BackgroundColor3 = Color3.fromRGB(35, 40, 55)
	lvlBox.BorderSizePixel = 0
	lvlBox.Parent = topBar

	local lvlCorner = Instance.new("UICorner")
	lvlCorner.CornerRadius = UDim.new(0, 8)
	lvlCorner.Parent = lvlBox

	local lText = Instance.new("TextLabel")
	lText.Size = UDim2.new(1, 0, 1, 0)
	lText.BackgroundTransparency = 1
	lText.Font = Enum.Font.FredokaOne
	lText.TextSize = 14
	lText.TextColor3 = Color3.fromRGB(255, 235, 80)
	lText.Text = "LVL 1"
	lText.Parent = lvlBox
	levelText = lText

	-- Honey Counter
	local hBox = Instance.new("Frame")
	hBox.Name = "HoneyBox"
	hBox.Size = UDim2.new(0, 140, 0, 30)
	hBox.Position = UDim2.new(0, 100, 0, 8)
	hBox.BackgroundColor3 = Color3.fromRGB(35, 40, 55)
	hBox.BorderSizePixel = 0
	hBox.Parent = topBar

	local hCorner = Instance.new("UICorner")
	hCorner.CornerRadius = UDim.new(0, 8)
	hCorner.Parent = hBox

	local hLabel = Instance.new("TextLabel")
	hLabel.Size = UDim2.new(1, -10, 1, 0)
	hLabel.Position = UDim2.new(0, 10, 0, 0)
	hLabel.BackgroundTransparency = 1
	hLabel.Font = Enum.Font.FredokaOne
	hLabel.TextSize = 16
	hLabel.TextColor3 = Color3.fromRGB(255, 200, 30)
	hLabel.TextXAlignment = Enum.TextXAlignment.Left
	hLabel.Text = "🍯 0"
	hLabel.Parent = hBox
	honeyLabel = hLabel

	-- Claw Tokens Counter (CRITICAL FOR PROGRESSION)
	local tBox = Instance.new("Frame")
	tBox.Name = "TokenBox"
	tBox.Size = UDim2.new(0, 130, 0, 30)
	tBox.Position = UDim2.new(0, 250, 0, 8)
	tBox.BackgroundColor3 = Color3.fromRGB(45, 25, 60)
	tBox.BorderSizePixel = 0
	tBox.Parent = topBar

	local tCorner = Instance.new("UICorner")
	tCorner.CornerRadius = UDim.new(0, 8)
	tCorner.Parent = tBox

	local tStroke = Instance.new("UIStroke")
	tStroke.Color = Color3.fromRGB(255, 60, 180)
	tStroke.Thickness = 1.5
	tStroke.Parent = tBox

	local tLabel = Instance.new("TextLabel")
	tLabel.Size = UDim2.new(1, -10, 1, 0)
	tLabel.Position = UDim2.new(0, 10, 0, 0)
	tLabel.BackgroundTransparency = 1
	tLabel.Font = Enum.Font.FredokaOne
	tLabel.TextSize = 15
	tLabel.TextColor3 = Color3.fromRGB(255, 100, 220)
	tLabel.TextXAlignment = Enum.TextXAlignment.Left
	tLabel.Text = "🕹️ CLAW: 3"
	tLabel.Parent = tBox
	tokensLabel = tLabel

	-- Gems Counter
	local gBox = Instance.new("Frame")
	gBox.Name = "GemsBox"
	gBox.Size = UDim2.new(0, 130, 0, 30)
	gBox.Position = UDim2.new(0, 390, 0, 8)
	gBox.BackgroundColor3 = Color3.fromRGB(20, 45, 55)
	gBox.BorderSizePixel = 0
	gBox.Parent = topBar

	local gCorner = Instance.new("UICorner")
	gCorner.CornerRadius = UDim.new(0, 8)
	gCorner.Parent = gBox

	local gLabel = Instance.new("TextLabel")
	gLabel.Size = UDim2.new(1, -10, 1, 0)
	gLabel.Position = UDim2.new(0, 10, 0, 0)
	gLabel.BackgroundTransparency = 1
	gLabel.Font = Enum.Font.FredokaOne
	gLabel.TextSize = 15
	gLabel.TextColor3 = Color3.fromRGB(0, 240, 255)
	gLabel.TextXAlignment = Enum.TextXAlignment.Left
	gLabel.Text = "💎 10"
	gLabel.Parent = gBox
	gemsLabel = gLabel

	-- Backpack Pollen Bar (Underneath Top Numbers)
	local pBg = Instance.new("Frame")
	pBg.Name = "PollenBg"
	pBg.Size = UDim2.new(1, -20, 0, 20)
	pBg.Position = UDim2.new(0, 10, 0, 45)
	pBg.BackgroundColor3 = Color3.fromRGB(30, 34, 48)
	pBg.BorderSizePixel = 0
	pBg.Parent = topBar

	local pBgCorner = Instance.new("UICorner")
	pBgCorner.CornerRadius = UDim.new(0, 6)
	pBgCorner.Parent = pBg

	local pFill = Instance.new("Frame")
	pFill.Name = "PollenFill"
	pFill.Size = UDim2.new(0, 0, 1, 0)
	pFill.BackgroundColor3 = Color3.fromRGB(255, 215, 0)
	pFill.BorderSizePixel = 0
	pFill.Parent = pBg
	pollenFill = pFill

	local pFillCorner = Instance.new("UICorner")
	pFillCorner.CornerRadius = UDim.new(0, 6)
	pFillCorner.Parent = pFill

	local pText = Instance.new("TextLabel")
	pText.Name = "PollenText"
	pText.Size = UDim2.new(1, 0, 1, 0)
	pText.BackgroundTransparency = 1
	pText.Font = Enum.Font.FredokaOne
	pText.TextSize = 12
	pText.TextColor3 = Color3.fromRGB(255, 255, 255)
	pText.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
	pText.TextStrokeTransparency = 0.2
	pText.Text = "🎒 BACKPACK PÓLEN: 0 / 200"
	pText.Parent = pBg
	pollenText = pText

	-- 2. RPG QUEST TRACKER (Right Side)
	local qBox = Instance.new("Frame")
	qBox.Name = "QuestTracker"
	qBox.Size = UDim2.new(0, 260, 0, 110)
	qBox.Position = UDim2.new(1, -275, 0, 105)
	qBox.BackgroundColor3 = Color3.fromRGB(20, 24, 35)
	qBox.BorderSizePixel = 0
	qBox.Parent = gui

	local qCorner = Instance.new("UICorner")
	qCorner.CornerRadius = UDim.new(0, 14)
	qCorner.Parent = qBox

	local qStroke = Instance.new("UIStroke")
	qStroke.Color = Color3.fromRGB(50, 180, 255)
	qStroke.Thickness = 2
	qStroke.Parent = qBox

	local qHeader = Instance.new("TextLabel")
	qHeader.Size = UDim2.new(1, -16, 0, 22)
	qHeader.Position = UDim2.new(0, 8, 0, 6)
	qHeader.BackgroundTransparency = 1
	qHeader.Font = Enum.Font.FredokaOne
	qHeader.TextSize = 13
	qHeader.TextColor3 = Color3.fromRGB(0, 230, 255)
	qHeader.TextXAlignment = Enum.TextXAlignment.Left
	qHeader.Text = "📜 RPG QUEST ATIVA:"
	qHeader.Parent = qBox

	local qTitle = Instance.new("TextLabel")
	qTitle.Size = UDim2.new(1, -16, 0, 36)
	qTitle.Position = UDim2.new(0, 8, 0, 28)
	qTitle.BackgroundTransparency = 1
	qTitle.Font = Enum.Font.FredokaOne
	qTitle.TextSize = 12
	qTitle.TextWrapped = true
	qTitle.TextColor3 = Color3.fromRGB(255, 255, 255)
	qTitle.TextXAlignment = Enum.TextXAlignment.Left
	qTitle.Text = "🌻 Black Bear: Colha 150 Pólen"
	qTitle.Parent = qBox
	questTitle = qTitle

	local qProg = Instance.new("TextLabel")
	qProg.Size = UDim2.new(1, -16, 0, 18)
	qProg.Position = UDim2.new(0, 8, 0, 64)
	qProg.BackgroundTransparency = 1
	qProg.Font = Enum.Font.FredokaOne
	qProg.TextSize = 12
	qProg.TextColor3 = Color3.fromRGB(255, 220, 80)
	qProg.TextXAlignment = Enum.TextXAlignment.Left
	qProg.Text = "Progresso: 0 / 150"
	qProg.Parent = qBox
	questProgressLabel = qProg

	local claimBtn = Instance.new("TextButton")
	claimBtn.Name = "ClaimQuestBtn"
	claimBtn.Size = UDim2.new(1, -16, 0, 22)
	claimBtn.Position = UDim2.new(0, 8, 0, 82)
	claimBtn.BackgroundColor3 = Color3.fromRGB(30, 200, 80)
	claimBtn.Font = Enum.Font.FredokaOne
	claimBtn.TextSize = 12
	claimBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
	claimBtn.Text = "CLAIM REWARD!"
	claimBtn.Visible = false
	claimBtn.Parent = qBox
	questClaimBtn = claimBtn

	local claimCorner = Instance.new("UICorner")
	claimCorner.CornerRadius = UDim.new(0, 6)
	claimCorner.Parent = claimBtn

	claimBtn.MouseButton1Click:Connect(function()
		if currentClaimableQuestId then
			SoundController.PlayPowerUp()
			local remote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestClaimQuest)
			remote:FireServer(currentClaimableQuestId)
			claimBtn.Visible = false
		end
	end)

	-- 3. BOTTOM ACTION BAR (Claw Machine, Hive Convert, Shops)
	local bottomBar = Instance.new("Frame")
	bottomBar.Name = "BottomBar"
	bottomBar.Size = UDim2.new(0, 520, 0, 65)
	bottomBar.Position = UDim2.new(0.5, -260, 1, -85)
	bottomBar.BackgroundColor3 = Color3.fromRGB(20, 22, 32)
	bottomBar.BorderSizePixel = 0
	bottomBar.Parent = gui

	local bCorner = Instance.new("UICorner")
	bCorner.CornerRadius = UDim.new(0, 18)
	bCorner.Parent = bottomBar

	local bStroke = Instance.new("UIStroke")
	bStroke.Color = Color3.fromRGB(255, 60, 180)
	bStroke.Thickness = 2.5
	bStroke.Parent = bottomBar

	local function makeBtn(name: string, text: string, color: Color3, posX: number, onClick: () -> ())
		local btn = Instance.new("TextButton")
		btn.Name = name
		btn.Size = UDim2.new(0, 115, 0, 45)
		btn.Position = UDim2.new(0, posX, 0.5, -22)
		btn.BackgroundColor3 = color
		btn.Font = Enum.Font.FredokaOne
		btn.TextSize = 13
		btn.TextColor3 = Color3.fromRGB(255, 255, 255)
		btn.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
		btn.TextStrokeTransparency = 0.3
		btn.Text = text
		btn.Parent = bottomBar

		local c = Instance.new("UICorner")
		c.CornerRadius = UDim.new(0, 12)
		c.Parent = btn

		btn.MouseButton1Click:Connect(function()
			local orig = btn.Size
			btn.Size = UDim2.new(0, 105, 0, 38)
			local tw = TweenService:Create(
				btn,
				TweenInfo.new(0.18, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out),
				{ Size = orig }
			)
			tw:Play()
			onClick()
		end)
		return btn
	end

	-- Claw Machine button (Interactive crane game)
	makeBtn("PlayClawBtn", "🕹️ JOGAR GARRA", Color3.fromRGB(255, 40, 140), 10, function()
		ClawMachineController.Play()
	end)

	-- Convert Honey button
	makeBtn("ConvertHoneyBtn", "🍯 CONVERTER", Color3.fromRGB(255, 180, 0), 135, function()
		local remote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestConvertHoney)
		remote:FireServer()
	end)

	-- Buy Rake Tool button
	makeBtn("BuyToolBtn", "⚡ RAKE (800🍯)", Color3.fromRGB(0, 180, 255), 260, function()
		local remote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestBuyTool)
		remote:FireServer("tool_rake")
	end)

	-- Buy Jar Pack button
	makeBtn("BuyPackBtn", "🎒 JAR (1.2K🍯)", Color3.fromRGB(150, 50, 240), 385, function()
		local remote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestBuyBackpack)
		remote:FireServer("pack_jar")
	end)
end

function HudController.UpdatePlayerData(data: Types.PlayerDataSchema)
	targetHoney = data.Honey
	targetGems = data.Gems

	if tokensLabel then
		tokensLabel.Text = "🕹️ CLAW: " .. tostring(data.ClawTokens)
	end

	if levelText then
		levelText.Text = "LVL " .. tostring(data.Level)
	end

	-- Update Backpack Pollen fill bar
	if pollenFill and pollenText then
		local current = data.CurrentPollen
		local max = data.MaxPollenCapacity
		local ratio = math.clamp(current / math.max(1, max), 0, 1)

		pollenFill.Size = UDim2.new(ratio, 0, 1, 0)
		pollenText.Text = string.format("🎒 BACKPACK PÓLEN: %d / %d", current, max)

		if ratio >= 1.0 then
			pollenFill.BackgroundColor3 = Color3.fromRGB(255, 60, 60)
			pollenText.Text = "🎒 MOCHILA CHEIA! VÁ ATÉ SUA COLMEIA CONVERTER!"
		else
			pollenFill.BackgroundColor3 = Color3.fromRGB(255, 215, 0)
		end
	end

	-- Update active quest tracker
	for qId, quest in pairs(data.ActiveQuests) do
		if questTitle and questProgressLabel and questClaimBtn then
			questTitle.Text = "Missão: " .. quest.QuestId
			questProgressLabel.Text = string.format("Progresso: %d / %d", quest.CurrentAmount, quest.TargetAmount)

			if quest.IsCompleted and not quest.IsClaimed then
				currentClaimableQuestId = qId
				questClaimBtn.Visible = true
				questProgressLabel.Text = "✅ COMPLETA! CLIQUE ABAIXO:"
			else
				questClaimBtn.Visible = false
			end
		end
		break
	end
end

function HudController.Init()
	createHud()

	-- Rolling ticker for Honey and Gems
	task.spawn(function()
		while true do
			task.wait(0.04)
			if displayedHoney ~= targetHoney then
				local delta = (targetHoney - displayedHoney) * 0.25
				if math.abs(delta) < 1 then
					displayedHoney = targetHoney
				else
					displayedHoney += math.floor(delta)
				end
				if honeyLabel then
					honeyLabel.Text = "🍯 " .. NumbersUtil.FormatCompact(displayedHoney)
				end
			end

			if displayedGems ~= targetGems then
				local delta = (targetGems - displayedGems) * 0.25
				if math.abs(delta) < 1 then
					displayedGems = targetGems
				else
					displayedGems += math.floor(delta)
				end
				if gemsLabel then
					gemsLabel.Text = "💎 " .. NumbersUtil.FormatCompact(displayedGems)
				end
			end
		end
	end)

	local dataRemote = NetContracts.GetRemoteEvent(NetContracts.Names.PlayerDataUpdated)
	dataRemote.OnClientEvent:Connect(function(data: Types.PlayerDataSchema)
		HudController.UpdatePlayerData(data)
	end)
end

return HudController
