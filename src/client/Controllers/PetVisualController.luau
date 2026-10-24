--!strict

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

type VisualPetData = {
	UUID: string,
	PetId: string,
	Variant: Types.PetVariant,
	Model: Model,
	CurrentCFrame: CFrame,
}

local PetVisualController = {}

local activePets: { VisualPetData } = {}
local petsFolder: Folder? = nil

local function getPetsFolder(): Folder
	if not petsFolder then
		local folder = Workspace:FindFirstChild("ClientPets")
		if not folder then
			local newFolder = Instance.new("Folder")
			newFolder.Name = "ClientPets"
			newFolder.Parent = Workspace
			petsFolder = newFolder
		else
			petsFolder = folder :: Folder
		end
	end
	return petsFolder :: Folder
end

local function createPetModel(petId: string, variant: Types.PetVariant): Model
	local def = GameConfig.Pets[petId]
	local model = Instance.new("Model")
	model.Name = "Pet_" .. petId

	-- Main cute cube body
	local body = Instance.new("Part")
	body.Name = "Primary"
	body.Size = Vector3.new(1.8, 1.8, 1.8)
	body.CanCollide = false
	body.CanQuery = false
	body.Anchored = true

	if variant == "Golden" then
		body.Material = Enum.Material.Metal
		body.Color = Color3.fromRGB(255, 215, 0)
		body.Reflectance = 0.4
	elseif variant == "Rainbow" then
		body.Material = Enum.Material.Neon
		body.Color = Color3.fromRGB(255, 100, 200)
	else
		body.Material = Enum.Material.SmoothPlastic
		body.Color = if def and def.Rarity == "Secret"
			then Color3.fromRGB(255, 255, 255)
			elseif def and def.Rarity == "Mythic" then Color3.fromRGB(255, 50, 110)
			else Color3.fromRGB(255, 180, 100)
	end
	body.Parent = model
	model.PrimaryPart = body

	-- Adornee Billboard for Pet Name & Level
	local billboard = Instance.new("BillboardGui")
	billboard.Name = "PetLabel"
	billboard.Size = UDim2.new(0, 100, 0, 25)
	billboard.StudsOffset = Vector3.new(0, 1.6, 0)
	billboard.AlwaysOnTop = true
	billboard.Adornee = body

	local nameLabel = Instance.new("TextLabel")
	nameLabel.Size = UDim2.new(1, 0, 1, 0)
	nameLabel.BackgroundTransparency = 1
	nameLabel.Font = Enum.Font.FredokaOne
	nameLabel.TextSize = 13
	nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
	nameLabel.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
	nameLabel.TextStrokeTransparency = 0.2
	nameLabel.Text = if def then def.Name else petId
	nameLabel.Parent = billboard

	billboard.Parent = model
	model.Parent = getPetsFolder()
	return model
end

function PetVisualController.UpdateEquippedPets(equippedUUIDs: { string }, inventory: { [string]: Types.PetInstance })
	-- Clean up existing
	for _, petData in ipairs(activePets) do
		petData.Model:Destroy()
	end
	table.clear(activePets)

	local localPlayer = Players.LocalPlayer
	local character = localPlayer.Character
	local root = if character then character:FindFirstChild("HumanoidRootPart") :: BasePart? else nil
	local baseCFrame = if root then root.CFrame else CFrame.identity

	for _, uuid in ipairs(equippedUUIDs) do
		local pet = inventory[uuid]
		if pet then
			local model = createPetModel(pet.PetId, pet.Variant)
			table.insert(activePets, {
				UUID = uuid,
				PetId = pet.PetId,
				Variant = pet.Variant,
				Model = model,
				CurrentCFrame = baseCFrame,
			})
		end
	end
end

function PetVisualController.Init()
	getPetsFolder()

	local dataUpdatedRemote = NetContracts.GetRemoteEvent(NetContracts.Names.PlayerDataUpdated)
	dataUpdatedRemote.OnClientEvent:Connect(function(data: Types.PlayerDataSchema)
		PetVisualController.UpdateEquippedPets(data.EquippedPetUUIDs, data.InventoryPets)
	end)

	-- Single RenderStepped CFrame rendering loop
	RunService.RenderStepped:Connect(function(dt: number)
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

		local n = #activePets
		if n == 0 then
			return
		end

		local rootCFrame = root.CFrame
		local radius = 4.8
		local deltaTheta = math.pi / (n + 1)
		local now = os.clock()

		local rollAngle = math.sin(now * 12) * math.rad(15)
		local bobbingY = math.abs(math.cos(now * 12)) * 1.8

		for i, petData in ipairs(activePets) do
			local theta = math.pi + (i - (n + 1) / 2) * deltaTheta
			local localOffset = Vector3.new(math.sin(theta) * radius, 0, math.cos(theta) * radius)
			local targetPos = rootCFrame:PointToWorldSpace(localOffset) + Vector3.new(0, bobbingY - 1, 0)

			-- Look towards character movement/root position
			local lookAtPos = rootCFrame.Position
			local targetCFrame = CFrame.lookAt(targetPos, lookAtPos) * CFrame.Angles(0, 0, rollAngle)

			petData.CurrentCFrame = petData.CurrentCFrame:Lerp(targetCFrame, math.clamp(dt * 12, 0, 1))

			if petData.Model.PrimaryPart then
				petData.Model:SetPrimaryPartCFrame(petData.CurrentCFrame)

				-- Rainbow animated hue
				if petData.Variant == "Rainbow" then
					local rainbowColor = Color3.fromHSV((now * 0.5) % 1, 0.85, 1)
					petData.Model.PrimaryPart.Color = rainbowColor
				end
			end
		end
	end)
end

return PetVisualController
