--!strict

export type RarityTier = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic" | "Secret"
export type PetVariant = "Normal" | "Golden" | "Rainbow" | "DarkMatter"

export type ToolDefinition = {
	Id: string,
	Name: string,
	CostHoney: number,
	CollectPower: number,
	CollectRadius: number,
	SwingCooldown: number,
	RequiredLevel: number,
	ModelAssetId: string,
}

export type BackpackDefinition = {
	Id: string,
	Name: string,
	CostHoney: number,
	Capacity: number,
	RequiredLevel: number,
}

export type BeeInstance = {
	UUID: string,
	BeeId: string,
	SlotIndex: number,
	Level: number,
	Bond: number,
	Variant: PetVariant,
	Energy: number,
	MaxEnergy: number,
}

export type QuestProgress = {
	QuestId: string,
	CurrentAmount: number,
	TargetAmount: number,
	IsCompleted: boolean,
	IsClaimed: boolean,
}

export type PlayerDataSchema = {
	Honey: number,
	Coins: number,
	Gems: number,
	ClawTokens: number,
	Level: number,
	XP: number,
	Rebirths: number,

	-- Backpack / Gathering
	CurrentPollen: number,
	MaxPollenCapacity: number,
	EquippedToolId: string,
	EquippedBackpackId: string,

	-- Tycoon Plot
	ClaimedPlotIndex: number?,
	HiveSlotsUnlocked: number,
	HiveBees: { [string]: BeeInstance }, -- Keyed by UUID

	-- RPG Stats
	Stats: {
		AttackPower: number,
		GatherMultiplier: number,
		MoveSpeedMultiplier: number,
		CritChance: number,
		LuckMultiplier: number,
	},

	-- Quests & Unlocks
	ActiveQuests: { [string]: QuestProgress },
	CompletedQuestIds: { [string]: boolean },
	UnlockedZones: { [string]: boolean },
	UnlockedGates: { [string]: boolean },
	DiscoveredBees: { [string]: boolean },

	-- Settings
	Settings: {
		AutoConvertHoney: boolean,
		ShowOtherPlayersEffects: boolean,
		MuteAudio: boolean,
	},
}

export type PollenFieldDefinition = {
	Id: string,
	DisplayName: string,
	CenterPosition: Vector3,
	Bounds: Vector3,
	PollenPerFlower: number,
	RequiredLevel: number,
	FlowerColorPalette: { Color3 },
}

export type MobDefinition = {
	Id: string,
	Name: string,
	MaxHealth: number,
	Damage: number,
	AttackCooldown: number,
	RespawnTime: number,
	HoneyReward: number,
	TokenRewardChance: number,
	SpawnPosition: Vector3,
	RoamRadius: number,
}

export type ActiveMobState = {
	InstanceId: string,
	MobId: string,
	Position: Vector3,
	CurrentHealth: number,
	MaxHealth: number,
	TargetPlayerId: number?,
}

export type ClawReward = {
	RewardType: "Honey" | "Gems" | "MythicEgg" | "SecretKey" | "LegendaryTool" | "MegaToken",
	DisplayName: string,
	Amount: number,
	Color: Color3,
	Weight: number,
	Rarity: RarityTier,
}

export type ClawResult = {
	Success: boolean,
	ErrorReason: string?,
	WonReward: ClawReward?,
	RemainingTokens: number,
}

return nil
