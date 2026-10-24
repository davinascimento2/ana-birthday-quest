--!strict

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local InstancePool = require(script.Parent.Parent.Modules.InstancePool)
local SoundController = require(script.Parent.SoundController)

type FlyingOrb = {
	Part: BasePart,
	OrbType: "Coin" | "Gem",
	P0: Vector3,
	P1: Vector3,
	Duration: number,
	Elapsed: number,
}

local DropMagnetController = {}
local activeOrbs: { FlyingOrb } = {}

local function spawnOrb(origin: Vector3, orbType: "Coin" | "Gem")
	local part: BasePart = if orbType == "Coin" then InstancePool.GetCoin() else InstancePool.GetGem()
	part.Position = origin

	local p1 = origin + Vector3.new(math.random(-12, 12), math.random(15, 28), math.random(-12, 12))

	local duration = math.random(45, 70) / 100 -- 0.45s to 0.70s

	table.insert(activeOrbs, {
		Part = part,
		OrbType = orbType,
		P0 = origin,
		P1 = p1,
		Duration = duration,
		Elapsed = 0,
	})
end

function DropMagnetController.SpawnDropCluster(origin: Vector3, count: number, hasGems: boolean)
	local coinCount = math.clamp(count, 5, 45)
	for _ = 1, coinCount do
		spawnOrb(origin, "Coin")
	end

	if hasGems then
		for _ = 1, math.random(2, 6) do
			spawnOrb(origin, "Gem")
		end
	end
end

function DropMagnetController.Init()
	local destroyRemote = NetContracts.GetRemoteEvent(NetContracts.Names.BreakableDestroyed)
	destroyRemote.OnClientEvent:Connect(function(payload: NetContracts.DestroyPayload)
		DropMagnetController.SpawnDropCluster(payload.OriginPosition, payload.VisualBurstCount, payload.Gems > 0)
	end)

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

		local p2 = root.Position

		local i = 1
		while i <= #activeOrbs do
			local orb = activeOrbs[i]
			orb.Elapsed += dt

			local rawT = math.clamp(orb.Elapsed / orb.Duration, 0, 1)
			-- Quadratic acceleration curve
			local t = rawT * rawT

			-- Quadratic Bézier: B(t) = (1 - t)^2 * P0 + 2 * (1 - t) * t * P1 + t^2 * P2
			local oneMinusT = 1 - t
			local pos = (oneMinusT * oneMinusT * orb.P0) + (2 * oneMinusT * t * orb.P1) + (t * t * p2)

			orb.Part.Position = pos

			if rawT >= 1.0 then
				-- Reached target player
				SoundController.PlayCoinChime()

				if orb.OrbType == "Coin" then
					InstancePool.ReturnCoin(orb.Part)
				else
					InstancePool.ReturnGem(orb.Part)
				end

				table.remove(activeOrbs, i)
			else
				i += 1
			end
		end
	end)
end

return DropMagnetController
