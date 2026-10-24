--!strict

local Types = require(script.Parent.Types)

local Rarities: { [Types.RarityTier]: Types.RarityDefinition } = {
	Common = {
		Tier = "Common",
		DisplayName = "Common",
		Color = Color3.fromRGB(190, 200, 215),
		SecondaryColor = Color3.fromRGB(150, 160, 175),
		ChanceWeight = 60000,
		ScreenShakeTrauma = 0.05,
		TriggersServerAnnouncement = false,
		TriggersFullCutscene = false,
	},
	Uncommon = {
		Tier = "Uncommon",
		DisplayName = "Uncommon",
		Color = Color3.fromRGB(65, 255, 115),
		SecondaryColor = Color3.fromRGB(35, 200, 85),
		ChanceWeight = 25000,
		ScreenShakeTrauma = 0.10,
		TriggersServerAnnouncement = false,
		TriggersFullCutscene = false,
	},
	Rare = {
		Tier = "Rare",
		DisplayName = "Rare",
		Color = Color3.fromRGB(0, 195, 255),
		SecondaryColor = Color3.fromRGB(0, 140, 210),
		ChanceWeight = 11000,
		ScreenShakeTrauma = 0.20,
		TriggersServerAnnouncement = false,
		TriggersFullCutscene = false,
	},
	Epic = {
		Tier = "Epic",
		DisplayName = "Epic",
		Color = Color3.fromRGB(185, 65, 255),
		SecondaryColor = Color3.fromRGB(135, 30, 210),
		ChanceWeight = 3500,
		ScreenShakeTrauma = 0.35,
		TriggersServerAnnouncement = false,
		TriggersFullCutscene = false,
	},
	Legendary = {
		Tier = "Legendary",
		DisplayName = "Legendary",
		Color = Color3.fromRGB(255, 195, 0),
		SecondaryColor = Color3.fromRGB(255, 130, 0),
		ChanceWeight = 480,
		ScreenShakeTrauma = 0.55,
		TriggersServerAnnouncement = false,
		TriggersFullCutscene = true,
	},
	Mythic = {
		Tier = "Mythic",
		DisplayName = "Mythic",
		Color = Color3.fromRGB(255, 35, 95),
		SecondaryColor = Color3.fromRGB(200, 10, 60),
		ChanceWeight = 20, -- 1 in 2,500 approx relative to pool
		ScreenShakeTrauma = 0.85,
		TriggersServerAnnouncement = true,
		TriggersFullCutscene = true,
	},
	Secret = {
		Tier = "Secret",
		DisplayName = "SECRET",
		Color = Color3.fromRGB(255, 255, 255),
		SecondaryColor = Color3.fromRGB(255, 75, 200),
		ChanceWeight = 1, -- 1 in 50,000+
		ScreenShakeTrauma = 1.00,
		TriggersServerAnnouncement = true,
		TriggersFullCutscene = true,
	},
}

local TierOrder: { Types.RarityTier } = {
	"Common",
	"Uncommon",
	"Rare",
	"Epic",
	"Legendary",
	"Mythic",
	"Secret",
}

local RaritiesModule = {}

function RaritiesModule.Get(tier: Types.RarityTier): Types.RarityDefinition
	local def = Rarities[tier]
	if not def then
		return Rarities.Common
	end
	return def
end

function RaritiesModule.GetTierIndex(tier: Types.RarityTier): number
	for index, t in ipairs(TierOrder) do
		if t == tier then
			return index
		end
	end
	return 1
end

function RaritiesModule.IsAtLeast(target: Types.RarityTier, required: Types.RarityTier): boolean
	return RaritiesModule.GetTierIndex(target) >= RaritiesModule.GetTierIndex(required)
end

RaritiesModule.TierOrder = TierOrder
RaritiesModule.Definitions = Rarities

return RaritiesModule
