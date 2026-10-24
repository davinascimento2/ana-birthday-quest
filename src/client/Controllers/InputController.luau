--!strict

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local InputController = {}

local isMouseDown = false
local currentTargetInstanceId: string? = nil

local function getBreakableUnderCursor(): string?
	local camera = Workspace.CurrentCamera
	if not camera then
		return nil
	end

	local mousePos = UserInputService:GetMouseLocation()
	local ray = camera:ViewportPointToRay(mousePos.X, mousePos.Y)

	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Include

	local breakablesFolder = Workspace:FindFirstChild("ClientBreakables")
	if not breakablesFolder then
		return nil
	end

	params.FilterDescendantsInstances = { breakablesFolder }

	local result = Workspace:Raycast(ray.Origin, ray.Direction * 500, params)
	if result and result.Instance then
		local hitPart = result.Instance
		local model = hitPart:FindFirstAncestorOfClass("Model")
		if model then
			local id = model:GetAttribute("InstanceId")
			if type(id) == "string" then
				return id
			end
		end
	end

	return nil
end

local function fireDamage(instanceId: string)
	local damageRemote = NetContracts.GetRemoteEvent(NetContracts.Names.RequestDamageBreakable)
	damageRemote:FireServer(instanceId)
end

function InputController.Init()
	UserInputService.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean)
		if gameProcessed then
			return
		end

		if
			input.UserInputType == Enum.UserInputType.MouseButton1
			or input.UserInputType == Enum.UserInputType.Touch
		then
			isMouseDown = true
			local targetId = getBreakableUnderCursor()
			if targetId then
				currentTargetInstanceId = targetId
				fireDamage(targetId)
			end
		end
	end)

	UserInputService.InputEnded:Connect(function(input: InputObject)
		if
			input.UserInputType == Enum.UserInputType.MouseButton1
			or input.UserInputType == Enum.UserInputType.Touch
		then
			isMouseDown = false
			currentTargetInstanceId = nil
		end
	end)

	-- Continuous auto-click loop while holding mouse / touch
	task.spawn(function()
		while true do
			task.wait(0.12)
			if isMouseDown and currentTargetInstanceId then
				-- Check if target is still valid, else raycast again
				local newTarget = getBreakableUnderCursor()
				if newTarget then
					currentTargetInstanceId = newTarget
					fireDamage(newTarget)
				else
					fireDamage(currentTargetInstanceId)
				end
			end
		end
	end)
end

return InputController
