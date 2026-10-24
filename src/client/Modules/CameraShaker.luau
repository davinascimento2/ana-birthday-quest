--!strict

local CameraShaker = {}

local trauma = 0
local traumaDecaySpeed = 1.4
local maxAngle = math.rad(4.0)
local maxOffset = 0.6
local timeCounter = 0

function CameraShaker.AddTrauma(amount: number)
	trauma = math.clamp(trauma + amount, 0, 1)
end

function CameraShaker.GetTrauma(): number
	return trauma
end

function CameraShaker.Update(dt: number)
	if trauma > 0 then
		trauma = math.max(0, trauma - (traumaDecaySpeed * dt))
	end
	timeCounter += dt * 25
end

function CameraShaker.GetCFrameOffset(): CFrame
	if trauma <= 0.001 then
		return CFrame.identity
	end

	local shake = trauma * trauma

	local yaw = math.noise(timeCounter, 0, 0) * maxAngle * shake
	local pitch = math.noise(0, timeCounter, 0) * maxAngle * shake
	local roll = math.noise(0, 0, timeCounter) * maxAngle * shake

	local offsetX = math.noise(timeCounter + 10, 0, 0) * maxOffset * shake
	local offsetY = math.noise(0, timeCounter + 10, 0) * maxOffset * shake
	local offsetZ = math.noise(0, 0, timeCounter + 10) * maxOffset * shake

	return CFrame.new(offsetX, offsetY, offsetZ) * CFrame.Angles(pitch, yaw, roll)
end

return CameraShaker
