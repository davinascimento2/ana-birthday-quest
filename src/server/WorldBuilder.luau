--!strict

local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local TycoonService = require(script.Parent.Services.TycoonService)
local ClawMachineService = require(script.Parent.Services.ClawMachineService)

local WorldBuilder = {}

local function setupLighting()
	Lighting.Technology = Enum.Technology.Future
	Lighting.Ambient = Color3.fromRGB(110, 115, 140)
	Lighting.OutdoorAmbient = Color3.fromRGB(150, 160, 190)
	Lighting.Brightness = 2.5
	Lighting.ClockTime = 14.5

	local colorCorrection = Lighting:FindFirstChild("JuiceColorCorrection") :: ColorCorrectionEffect?
	if not colorCorrection then
		colorCorrection = Instance.new("ColorCorrectionEffect")
		colorCorrection.Name = "JuiceColorCorrection"
		colorCorrection.Parent = Lighting
	end
	colorCorrection.Saturation = 0.35
	colorCorrection.Contrast = 0.15
	colorCorrection.Brightness = 0.05
	colorCorrection.Enabled = true

	local bloom = Lighting:FindFirstChild("JuiceBloom") :: BloomEffect?
	if not bloom then
		bloom = Instance.new("BloomEffect")
		bloom.Name = "JuiceBloom"
		bloom.Parent = Lighting
	end
	bloom.Intensity = 1.2
	bloom.Size = 24.0
	bloom.Threshold = 1.8
	bloom.Enabled = true
end

local function wireClawMachineProximity(zonesFolder: Folder)
	local hub = zonesFolder:FindFirstChild("CentralHubPlaza") :: Model?
	if not hub then
		return
	end

	local clawMachine = hub:FindFirstChild("ClawMachine_Arcade") :: Model?
	if not clawMachine then
		return
	end

	local consoleDesk = clawMachine:FindFirstChild("ConsoleDesk") :: BasePart?
	if consoleDesk and not consoleDesk:FindFirstChildOfClass("ProximityPrompt") then
		local prompt = Instance.new("ProximityPrompt")
		prompt.Name = "ClawPrompt"
		prompt.ActionText = "Jogar Garra (1 Token)"
		prompt.ObjectText = "Máquina de Garra"
		prompt.HoldDuration = 0.4
		prompt.MaxActivationDistance = 14
		prompt.RequiresLineOfSight = false
		prompt.Parent = consoleDesk

		prompt.Triggered:Connect(function(player: Player)
			ClawMachineService.PlayClaw(player)
		end)
	end
end

local function wireHivePads(zonesFolder: Folder)
	for i = 1, 6 do
		local plotModel = zonesFolder:FindFirstChild("HivePlot_" .. tostring(i)) :: Model?
		if plotModel then
			local convertPad = plotModel:FindFirstChild("ConvertPad") :: BasePart?
			if convertPad then
				convertPad.Touched:Connect(function(hitPart: BasePart)
					local character = hitPart.Parent
					if character then
						local player = Players:GetPlayerFromCharacter(character)
						if player then
							TycoonService.ConvertHoney(player)
						end
					end
				end)
			end
		end
	end
end

function WorldBuilder.BuildWorld()
	print("[WorldBuilder] Setting up hyper-vibrant Future lighting & post-processing...")
	setupLighting()

	local zonesFolder = Workspace:WaitForChild("Zones") :: Folder

	print("[WorldBuilder] Wiring Claw Machine ProximityPrompt...")
	wireClawMachineProximity(zonesFolder)

	print("[WorldBuilder] Wiring 6 Tycoon Hive Convert Pads...")
	wireHivePads(zonesFolder)

	print("[WorldBuilder] Full Bee Swarm RPG & Claw Machine World successfully linked!")
end

return WorldBuilder
