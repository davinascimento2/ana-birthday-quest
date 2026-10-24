--!strict

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local SoundController = require(script.Parent.SoundController)

local GatheringController = {}

local isMouseDown = false
local lastGatherRequest = 0

local function getFlowerHitPosition(): Vector3?
	local camera = Workspace.CurrentCamera
	if not camera then
		return nil
	end

	local mousePos = UserInputService:GetMouseLocation()
	local ray = camera:ViewportPointToRay(mousePos.X, mousePos.Y)

	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Include

	local zonesFolder = Workspace:FindFirstChild("Zones")
	if not zonesFolder then
		return nil
	end

	params.FilterDescendantsInstances = { zonesFolder }

	local result = Workspace:Raycast(ray.Origin, ray.Direction * 200, params)
	if result and result.Position then
		return result.Position
	end
	return nil
end

local function fireHarvest(pos: Vector3)
	local now = os.clock()
	if now - lastGatherRequest < 0.25 then
		return
	end
	lastGatherRequest = now

	local remote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestGatherPollen)
	remote:FireServer(pos)
end

function GatheringController.Init()
	UserInputService.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean)
		if gameProcessed then
			return
		end

		if
			input.UserInputType == Enum.UserInputType.MouseButton1
			or input.UserInputType == Enum.UserInputType.Touch
		then
			isMouseDown = true
			local hitPos = getFlowerHitPosition()
			if hitPos then
				fireHarvest(hitPos)
			end
		end
	end)

	UserInputService.InputEnded:Connect(function(input: InputObject)
		if
			input.UserInputType == Enum.UserInputType.MouseButton1
			or input.UserInputType == Enum.UserInputType.Touch
		then
			isMouseDown = false
		end
	end)

	-- Continuous gathering loop while held down
	task.spawn(function()
		while true do
			task.wait(0.25)
			if isMouseDown then
				local hitPos = getFlowerHitPosition()
				if hitPos then
					fireHarvest(hitPos)
				end
			end
		end
	end)

	-- Pollen harvest visual feedback
	local harvestRemote = NetContracts.GetRemoteEvent(NetContracts.Names.PollenHarvested)
	harvestRemote.OnClientEvent:Connect(function(payload: NetContracts.PollenHarvestPayload)
		local localPlayer = Players.LocalPlayer
		if localPlayer and payload.PlayerName == (localPlayer.DisplayName or localPlayer.Name) then
			SoundController.PlayHit(false)
		end
	end)
end

return GatheringController
