--!strict

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Types = require(Shared:WaitForChild("Types"))
local NetContracts = require(Shared:WaitForChild("NetContracts"))

local HypeService = {}

local isFeverActive = false
local feverRemainingSeconds = 0

function HypeService.IsFeverActive(): boolean
	return isFeverActive
end

function HypeService.BroadcastAnnouncement(player: Player, petDef: Types.PetDefinition, variant: Types.PetVariant)
	local announcementRemote = NetContracts.GetRemoteEvent(NetContracts.Names.GlobalAnnouncement)
	local payload: NetContracts.AnnouncementPayload = {
		PlayerName = player.DisplayName or player.Name,
		PetName = petDef.Name,
		Rarity = petDef.Rarity,
		Variant = variant,
	}
	announcementRemote:FireAllClients(payload)
end

function HypeService.TriggerFeverEvent(durationSeconds: number?)
	local duration = durationSeconds or 180
	if isFeverActive then
		feverRemainingSeconds += duration
		return
	end

	isFeverActive = true
	feverRemainingSeconds = duration

	local feverRemote = NetContracts.GetRemoteEvent(NetContracts.Names.FeverStateChanged)
	feverRemote:FireAllClients({
		IsActive = true,
		RemainingSeconds = feverRemainingSeconds,
	})

	task.spawn(function()
		while feverRemainingSeconds > 0 do
			task.wait(1)
			feverRemainingSeconds -= 1
			if feverRemainingSeconds % 10 == 0 or feverRemainingSeconds <= 5 then
				feverRemote:FireAllClients({
					IsActive = true,
					RemainingSeconds = feverRemainingSeconds,
				})
			end
		end

		isFeverActive = false
		feverRemote:FireAllClients({
			IsActive = false,
			RemainingSeconds = 0,
		})
	end)
end

function HypeService.Init()
	-- Recurring Rainbow Fever Event every 15 minutes (900 seconds)
	task.spawn(function()
		while true do
			task.wait(900)
			HypeService.TriggerFeverEvent(180)
		end
	end)
end

return HypeService
