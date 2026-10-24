--!strict

local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local InstancePool = require(script.Modules.InstancePool)
local CameraShaker = require(script.Modules.CameraShaker)

local SoundController = require(script.Controllers.SoundController)
local JuiceController = require(script.Controllers.JuiceController)
local DropMagnetController = require(script.Controllers.DropMagnetController)
local PetVisualController = require(script.Controllers.PetVisualController)
local EggCutsceneController = require(script.Controllers.EggCutsceneController)
local HudController = require(script.Controllers.HudController)
local InputController = require(script.Controllers.InputController)
local GatheringController = require(script.Controllers.GatheringController)
local TycoonController = require(script.Controllers.TycoonController)
local ClawMachineController = require(script.Controllers.ClawMachineController)

local function bootstrap()
	print("==================================================")
	print("[CLIENT] Initializing Dopamine Crush: Bee Swarm & Claw Machine...")
	print("==================================================")

	InstancePool.Init()
	print("[CLIENT] [1/11] InstancePool Initialized (Zero-GC Pooling Ready).")

	SoundController.Init()
	print("[CLIENT] [2/11] SoundController Initialized.")

	JuiceController.Init()
	print("[CLIENT] [3/11] JuiceController Initialized.")

	DropMagnetController.Init()
	print("[CLIENT] [4/11] DropMagnetController Initialized (Bézier Magnetism Ready).")

	PetVisualController.Init()
	print("[CLIENT] [5/11] PetVisualController Initialized (Zero-Physics CFrames).")

	EggCutsceneController.Init()
	print("[CLIENT] [6/11] EggCutsceneController Initialized (Casino Roulette & Pity Cutscene).")

	HudController.Init()
	print("[CLIENT] [7/11] HudController Initialized (2D Reactive HUD).")

	InputController.Init()
	print("[CLIENT] [8/11] InputController Initialized.")

	GatheringController.Init()
	print("[CLIENT] [9/11] GatheringController Initialized (Bee Swarm Harvest Engine).")

	TycoonController.Init()
	print("[CLIENT] [10/11] TycoonController Initialized (Hive Conversion & Claim Engine).")

	ClawMachineController.Init()
	print("[CLIENT] [11/11] ClawMachineController Initialized (Arcade Claw Machine Engine).")

	-- Hook CameraShaker to RenderStepped
	RunService.RenderStepped:Connect(function(dt: number)
		CameraShaker.Update(dt)
		local camera = Workspace.CurrentCamera
		if camera then
			local offset = CameraShaker.GetCFrameOffset()
			camera.CFrame = camera.CFrame * offset
		end
	end)

	print("==================================================")
	print("[CLIENT] All 11 Client Controllers Deterministically Ready!")
	print("==================================================")
end

bootstrap()
