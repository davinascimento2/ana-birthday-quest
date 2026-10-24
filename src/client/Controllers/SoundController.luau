--!strict

local SoundService = game:GetService("SoundService")

local SoundController = {}

local currentComboPitch = 0.95
local lastHitTime = 0
local PITCH_RESET_TIMEOUT = 0.6

-- Production sound asset IDs (Roblox open library sound IDs)
local SOUND_IDS = {
	Hit = "rbxassetid://9114223170",
	CritHit = "rbxassetid://9114223846",
	Coin = "rbxassetid://9114224539",
	Explosion = "rbxassetid://9114225381",
	Equip = "rbxassetid://9114226154",
	RollTick = "rbxassetid://9114227003",
	FanfareRare = "rbxassetid://9114227786",
	FanfareSecret = "rbxassetid://9114228514",
}

local soundGroup: SoundGroup? = nil

local function getSoundGroup(): SoundGroup
	if not soundGroup then
		local group = Instance.new("SoundGroup")
		group.Name = "JuiceSFX"
		group.Volume = 0.85
		group.Parent = SoundService
		soundGroup = group
	end
	return soundGroup
end

local function playSound(soundId: string, volume: number, pitch: number)
	local sound = Instance.new("Sound")
	sound.SoundId = soundId
	sound.Volume = volume
	sound.PlaybackSpeed = pitch
	sound.SoundGroup = getSoundGroup()
	sound.Parent = SoundService
	sound:Play()

	sound.Ended:Once(function()
		sound:Destroy()
	end)
end

function SoundController.PlayHit(isCritical: boolean)
	local now = os.clock()
	if now - lastHitTime > PITCH_RESET_TIMEOUT then
		currentComboPitch = 0.95
	else
		currentComboPitch = math.min(1.6, currentComboPitch + 0.03)
	end
	lastHitTime = now

	local pitch = if isCritical then currentComboPitch * 1.25 else currentComboPitch
	local soundId = if isCritical then SOUND_IDS.CritHit else SOUND_IDS.Hit
	playSound(soundId, if isCritical then 1.0 else 0.7, pitch)
end

function SoundController.PlayCoinChime()
	local now = os.clock()
	if now - lastHitTime > PITCH_RESET_TIMEOUT then
		currentComboPitch = 0.95
	else
		currentComboPitch = math.min(1.65, currentComboPitch + 0.025)
	end
	lastHitTime = now

	playSound(SOUND_IDS.Coin, 0.65, currentComboPitch)
end

function SoundController.PlayExplosion()
	playSound(SOUND_IDS.Explosion, 1.0, math.random(90, 110) / 100)
end

function SoundController.PlayPowerUp()
	playSound(SOUND_IDS.Equip, 0.9, 1.1)
end

function SoundController.PlayRollTick()
	playSound(SOUND_IDS.RollTick, 0.5, math.random(95, 105) / 100)
end

function SoundController.PlayFanfare(tier: string)
	if tier == "Secret" or tier == "Mythic" then
		playSound(SOUND_IDS.FanfareSecret, 1.0, 1.0)
	else
		playSound(SOUND_IDS.FanfareRare, 0.85, 1.05)
	end
end

function SoundController.Init()
	getSoundGroup()
end

return SoundController
