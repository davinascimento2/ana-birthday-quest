--!strict

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local GameConfig = require(Shared:WaitForChild("GameConfig"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))
local NumbersUtil = require(Shared:WaitForChild("NumbersUtil"))

local InstancePool = require(script.Parent.Parent.Modules.InstancePool)
local CameraShaker = require(script.Parent.Parent.Modules.CameraShaker)
local SoundController = require(script.Parent.SoundController)

local JuiceController = {}

local activeBreakableModels: { [string]: Model } = {}
local breakablesFolder: Folder? = nil

local function getBreakablesFolder(): Folder
	if not breakablesFolder then
		local folder = Workspace:FindFirstChild("ClientBreakables")
		if not folder then
			local newFolder = Instance.new("Folder")
			newFolder.Name = "ClientBreakables"
			newFolder.Parent = Workspace
			breakablesFolder = newFolder
		else
			breakablesFolder = folder :: Folder
		end
	end
	return breakablesFolder :: Folder
end

local function spawnVisualBreakable(state: Types.ActiveBreakableState)
	local def = GameConfig.Breakables[state.DefinitionId]
	if not def then
		return
	end

	-- Check if already exists
	if activeBreakableModels[state.InstanceId] then
		return
	end

	local model = Instance.new("Model")
	model.Name = "Breakable_" .. state.InstanceId
	model:SetAttribute("InstanceId", state.InstanceId)
	model:SetAttribute("DefinitionId", state.DefinitionId)

	local rootPart = Instance.new("Part")
	rootPart.Name = "Primary"
	rootPart.Size = def.Scale
	rootPart.Position = state.Position + Vector3.new(0, def.Scale.Y / 2, 0)
	rootPart.Color = def.PrimaryColor
	rootPart.Material = Enum.Material.SmoothPlastic
	rootPart.Anchored = true
	rootPart.CanCollide = true
	rootPart.Parent = model

	model.PrimaryPart = rootPart

	-- Add accent neon ring/stripe
	local accent = Instance.new("Part")
	accent.Name = "Accent"
	accent.Size = Vector3.new(def.Scale.X * 1.05, def.Scale.Y * 0.25, def.Scale.Z * 1.05)
	accent.Position = rootPart.Position
	accent.Color = def.AccentColor
	accent.Material = Enum.Material.Neon
	accent.Anchored = true
	accent.CanCollide = false
	accent.Parent = model

	-- Highlight for damage flash
	local highlight = Instance.new("Highlight")
	highlight.Name = "HitHighlight"
	highlight.FillColor = Color3.fromRGB(255, 255, 255)
	highlight.FillTransparency = 1
	highlight.OutlineTransparency = 1
	highlight.Adornee = model
	highlight.Parent = model

	-- Particle emitter for hit bursts
	local emitterAttachment = Instance.new("Attachment")
	emitterAttachment.Name = "BurstAttachment"
	emitterAttachment.Position = Vector3.new(0, 0, 0)
	emitterAttachment.Parent = rootPart

	local emitter = Instance.new("ParticleEmitter")
	emitter.Name = "HitParticles"
	emitter.Rate = 0
	emitter.Speed = NumberRange.new(10, 22)
	emitter.Lifetime = NumberRange.new(0.3, 0.6)
	emitter.SpreadAngle = Vector2.new(180, 180)
	emitter.Color = ColorSequence.new(def.PrimaryColor, def.AccentColor)
	emitter.Size = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.8),
		NumberSequenceKeypoint.new(1, 0),
	})
	emitter.Enabled = false
	emitter.Parent = emitterAttachment

	model.Parent = getBreakablesFolder()
	activeBreakableModels[state.InstanceId] = model
end

function JuiceController.HandleDamage(payload: NetContracts.DamagePayload)
	local model = activeBreakableModels[payload.InstanceId]
	if not model or not model.PrimaryPart then
		return
	end

	local primary = model.PrimaryPart

	-- 1. Hit Flash Instantâneo
	local highlight = model:FindFirstChild("HitHighlight") :: Highlight?
	if highlight then
		highlight.FillTransparency = 0.1
		local flashTween = TweenService:Create(
			highlight,
			TweenInfo.new(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{ FillTransparency = 1 }
		)
		flashTween:Play()
	end

	-- 2. Deformação Elástica (Squash & Stretch)
	local originalScale = primary.Size
	local squashSize = Vector3.new(originalScale.X * 1.22, originalScale.Y * 0.72, originalScale.Z * 1.22)
	primary.Size = squashSize

	local restoreTween = TweenService:Create(
		primary,
		TweenInfo.new(0.28, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out),
		{ Size = originalScale }
	)
	restoreTween:Play()

	-- Also squish accent part if present
	local accent = model:FindFirstChild("Accent") :: BasePart?
	if accent then
		accent.Size = Vector3.new(originalScale.X * 1.25, originalScale.Y * 0.2, originalScale.Z * 1.25)
		local accentTween = TweenService:Create(
			accent,
			TweenInfo.new(0.28, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out),
			{ Size = Vector3.new(originalScale.X * 1.05, originalScale.Y * 0.25, originalScale.Z * 1.05) }
		)
		accentTween:Play()
	end

	-- 3. Emitir partículas saturadas
	local burstAttach = primary:FindFirstChild("BurstAttachment") :: Attachment?
	if burstAttach then
		local emitter = burstAttach:FindFirstChild("HitParticles") :: ParticleEmitter?
		if emitter then
			emitter:Emit(if payload.IsCritical then 25 else 12)
		end
	end

	-- 4. Som com pitch escalonado
	SoundController.PlayHit(payload.IsCritical)

	-- 5. Screen shake se crítico
	if payload.IsCritical then
		CameraShaker.AddTrauma(0.25)
	else
		CameraShaker.AddTrauma(0.04)
	end

	-- 6. Floating Damage Number (Do Pool)
	local popup = InstancePool.GetDamagePopup()
	local anchor = popup.Adornee :: BasePart?
	if anchor then
		local startPos = primary.Position + Vector3.new(math.random(-2, 2), originalScale.Y * 0.6, math.random(-2, 2))
		anchor.Position = startPos

		local label = popup:FindFirstChild("Label") :: TextLabel?
		if label then
			if payload.IsCritical then
				label.Text = "CRIT! -" .. NumbersUtil.FormatCompact(payload.Damage)
				label.TextColor3 = Color3.fromRGB(255, 230, 0)
			else
				label.Text = "-" .. NumbersUtil.FormatCompact(payload.Damage)
				label.TextColor3 = Color3.fromRGB(255, 255, 255)
			end
		end

		local endPos = startPos + Vector3.new(0, 4.5, 0)
		local floatTween = TweenService:Create(
			anchor,
			TweenInfo.new(0.55, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{ Position = endPos }
		)
		floatTween:Play()
		floatTween.Completed:Once(function()
			InstancePool.ReturnDamagePopup(popup)
		end)
	end
end

function JuiceController.HandleDestroy(payload: NetContracts.DestroyPayload)
	local model = activeBreakableModels[payload.InstanceId]
	if not model or not model.PrimaryPart then
		return
	end

	activeBreakableModels[payload.InstanceId] = nil

	local primary = model.PrimaryPart
	SoundController.PlayExplosion()
	CameraShaker.AddTrauma(0.35)

	-- Inflar para 1.35x por 0.08s e sumir
	local originalSize = primary.Size
	local inflateTween = TweenService:Create(
		primary,
		TweenInfo.new(0.08, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		{ Size = originalSize * 1.35, Transparency = 0.5 }
	)
	inflateTween:Play()

	inflateTween.Completed:Once(function()
		model:Destroy()
	end)
end

function JuiceController.Init()
	getBreakablesFolder()

	local spawnRemote = NetContracts.GetRemoteEvent(NetContracts.Names.BreakableSpawned)
	spawnRemote.OnClientEvent:Connect(function(state: Types.ActiveBreakableState)
		spawnVisualBreakable(state)
	end)

	local damageRemote = NetContracts.GetRemoteEvent(NetContracts.Names.BreakableDamaged)
	damageRemote.OnClientEvent:Connect(function(payload: NetContracts.DamagePayload)
		JuiceController.HandleDamage(payload)
	end)

	local destroyRemote = NetContracts.GetRemoteEvent(NetContracts.Names.BreakableDestroyed)
	destroyRemote.OnClientEvent:Connect(function(payload: NetContracts.DestroyPayload)
		JuiceController.HandleDestroy(payload)
	end)

	task.spawn(function()
		local getActiveFunc = NetContracts.GetRemoteFunction("GetActiveBreakables")
		local success, list = pcall(function()
			return getActiveFunc:InvokeServer()
		end)
		if success and type(list) == "table" then
			for _, state in ipairs(list) do
				spawnVisualBreakable(state)
			end
		end
	end)
end

return JuiceController
