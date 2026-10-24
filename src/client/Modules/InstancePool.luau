--!strict

local Workspace = game:GetService("Workspace")

local InstancePool = {}

local HIDDEN_CFRAME = CFrame.new(0, -5000, 0)

local poolFolder: Folder? = nil
local coinsAvailable: { BasePart } = {}
local gemsAvailable: { BasePart } = {}
local damagePopupsAvailable: { BillboardGui } = {}

local function getPoolFolder(): Folder
	if not poolFolder then
		local folder = Workspace:FindFirstChild("ClientInstancePool")
		if not folder then
			local newFolder = Instance.new("Folder")
			newFolder.Name = "ClientInstancePool"
			newFolder.Parent = Workspace
			poolFolder = newFolder
		else
			poolFolder = folder :: Folder
		end
	end
	return poolFolder :: Folder
end

local function createCoinTemplate(): BasePart
	local part = Instance.new("Part")
	part.Name = "PooledCoin"
	part.Shape = Enum.PartType.Cylinder
	part.Size = Vector3.new(0.35, 1.6, 1.6)
	part.Color = Color3.fromRGB(255, 215, 0)
	part.Material = Enum.Material.Neon
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Anchored = true
	part.CFrame = HIDDEN_CFRAME

	local trail = Instance.new("Trail")
	trail.Name = "CoinTrail"
	trail.Color = ColorSequence.new(Color3.fromRGB(255, 225, 50), Color3.fromRGB(255, 160, 0))
	trail.Lifetime = 0.25
	trail.LightEmission = 0.8
	trail.LightInfluence = 0
	trail.Enabled = false

	local a0 = Instance.new("Attachment")
	a0.Name = "A0"
	a0.Position = Vector3.new(0, 0.8, 0)
	a0.Parent = part

	local a1 = Instance.new("Attachment")
	a1.Name = "A1"
	a1.Position = Vector3.new(0, -0.8, 0)
	a1.Parent = part

	trail.Attachment0 = a0
	trail.Attachment1 = a1
	trail.Parent = part

	part.Parent = getPoolFolder()
	return part
end

local function createGemTemplate(): BasePart
	local part = Instance.new("Part")
	part.Name = "PooledGem"
	part.Shape = Enum.PartType.Ball
	part.Size = Vector3.new(1.3, 1.3, 1.3)
	part.Color = Color3.fromRGB(0, 240, 255)
	part.Material = Enum.Material.Neon
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Anchored = true
	part.CFrame = HIDDEN_CFRAME

	local trail = Instance.new("Trail")
	trail.Name = "GemTrail"
	trail.Color = ColorSequence.new(Color3.fromRGB(0, 255, 255), Color3.fromRGB(150, 0, 255))
	trail.Lifetime = 0.3
	trail.LightEmission = 1
	trail.LightInfluence = 0
	trail.Enabled = false

	local a0 = Instance.new("Attachment")
	a0.Name = "A0"
	a0.Position = Vector3.new(0, 0.6, 0)
	a0.Parent = part

	local a1 = Instance.new("Attachment")
	a1.Name = "A1"
	a1.Position = Vector3.new(0, -0.6, 0)
	a1.Parent = part

	trail.Attachment0 = a0
	trail.Attachment1 = a1
	trail.Parent = part

	part.Parent = getPoolFolder()
	return part
end

local function createDamagePopupTemplate(): BillboardGui
	local billboard = Instance.new("BillboardGui")
	billboard.Name = "PooledDamagePopup"
	billboard.Size = UDim2.new(0, 140, 0, 50)
	billboard.AlwaysOnTop = true
	billboard.Adornee = nil
	billboard.Enabled = false

	local label = Instance.new("TextLabel")
	label.Name = "Label"
	label.Size = UDim2.new(1, 0, 1, 0)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.FredokaOne
	label.TextScaled = true
	label.TextColor3 = Color3.fromRGB(255, 255, 255)
	label.TextStrokeColor3 = Color3.fromRGB(20, 20, 20)
	label.TextStrokeTransparency = 0
	label.Parent = billboard

	local adorneePart = Instance.new("Part")
	adorneePart.Name = "PopupAnchor"
	adorneePart.Size = Vector3.new(0.1, 0.1, 0.1)
	adorneePart.Transparency = 1
	adorneePart.CanCollide = false
	adorneePart.CanQuery = false
	adorneePart.Anchored = true
	adorneePart.CFrame = HIDDEN_CFRAME
	adorneePart.Parent = getPoolFolder()

	billboard.Adornee = adorneePart
	billboard.Parent = getPoolFolder()
	return billboard
end

function InstancePool.Init()
	getPoolFolder()

	-- Pre-allocate 150 coins
	for _ = 1, 150 do
		table.insert(coinsAvailable, createCoinTemplate())
	end

	-- Pre-allocate 100 gems
	for _ = 1, 100 do
		table.insert(gemsAvailable, createGemTemplate())
	end

	-- Pre-allocate 80 damage popups
	for _ = 1, 80 do
		table.insert(damagePopupsAvailable, createDamagePopupTemplate())
	end
end

function InstancePool.GetCoin(): BasePart
	local coin = table.remove(coinsAvailable)
	if not coin then
		coin = createCoinTemplate()
	end
	local trail = coin:FindFirstChild("CoinTrail") :: Trail?
	if trail then
		trail.Enabled = true
	end
	return coin
end

function InstancePool.ReturnCoin(coin: BasePart)
	local trail = coin:FindFirstChild("CoinTrail") :: Trail?
	if trail then
		trail.Enabled = false
	end
	coin.CFrame = HIDDEN_CFRAME
	table.insert(coinsAvailable, coin)
end

function InstancePool.GetGem(): BasePart
	local gem = table.remove(gemsAvailable)
	if not gem then
		gem = createGemTemplate()
	end
	local trail = gem:FindFirstChild("GemTrail") :: Trail?
	if trail then
		trail.Enabled = true
	end
	return gem
end

function InstancePool.ReturnGem(gem: BasePart)
	local trail = gem:FindFirstChild("GemTrail") :: Trail?
	if trail then
		trail.Enabled = false
	end
	gem.CFrame = HIDDEN_CFRAME
	table.insert(gemsAvailable, gem)
end

function InstancePool.GetDamagePopup(): BillboardGui
	local popup = table.remove(damagePopupsAvailable)
	if not popup then
		popup = createDamagePopupTemplate()
	end
	popup.Enabled = true
	return popup
end

function InstancePool.ReturnDamagePopup(popup: BillboardGui)
	popup.Enabled = false
	if popup.Adornee and popup.Adornee:IsA("BasePart") then
		popup.Adornee.CFrame = HIDDEN_CFRAME
	end
	table.insert(damagePopupsAvailable, popup)
end

return InstancePool
