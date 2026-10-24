--!strict

local Types = require(script.Parent.Types)

export type HivePlotConfig = {
	Index: number,
	Position: Vector3,
	HiveWallPosition: Vector3,
	BaseplateColor: Color3,
}

local GameConfig = {
	Version = "1.0.0-RPG-TYCOON",

	DefaultPlayerData = {
		Honey = 0,
		Coins = 100,
		Gems = 10,
		ClawTokens = 3, -- Starts with 3 claw tokens for dopamine!
		Level = 1,
		XP = 0,
		Rebirths = 0,

		CurrentPollen = 0,
		MaxPollenCapacity = 200,
		EquippedToolId = "tool_scoop",
		EquippedBackpackId = "pack_pouch",

		ClaimedPlotIndex = nil,
		HiveSlotsUnlocked = 4,
		HiveBees = {},

		Stats = {
			AttackPower = 5,
			GatherMultiplier = 1.0,
			MoveSpeedMultiplier = 1.0,
			CritChance = 0.1,
			LuckMultiplier = 1.0,
		},

		ActiveQuests = {
			quest_starter_1 = {
				QuestId = "quest_starter_1",
				CurrentAmount = 0,
				TargetAmount = 150,
				IsCompleted = false,
				IsClaimed = false,
			},
		},
		CompletedQuestIds = {},
		UnlockedZones = {
			SunflowerField = true,
			CloverPatch = true,
		},
		UnlockedGates = {},
		DiscoveredBees = {
			bee_basic = true,
		},

		Settings = {
			AutoConvertHoney = true,
			ShowOtherPlayersEffects = true,
			MuteAudio = false,
		},
	} :: Types.PlayerDataSchema,

	-- 6 Tycoon Plot Stations for Multiplayer Server
	HivePlots = {
		{
			Index = 1,
			Position = Vector3.new(-160, 0, 100),
			HiveWallPosition = Vector3.new(-160, 12, 125),
			BaseplateColor = Color3.fromRGB(245, 215, 65),
		},
		{
			Index = 2,
			Position = Vector3.new(-95, 0, 100),
			HiveWallPosition = Vector3.new(-95, 12, 125),
			BaseplateColor = Color3.fromRGB(80, 220, 150),
		},
		{
			Index = 3,
			Position = Vector3.new(-30, 0, 100),
			HiveWallPosition = Vector3.new(-30, 12, 125),
			BaseplateColor = Color3.fromRGB(0, 200, 255),
		},
		{
			Index = 4,
			Position = Vector3.new(35, 0, 100),
			HiveWallPosition = Vector3.new(35, 12, 125),
			BaseplateColor = Color3.fromRGB(255, 110, 180),
		},
		{
			Index = 5,
			Position = Vector3.new(100, 0, 100),
			HiveWallPosition = Vector3.new(100, 12, 125),
			BaseplateColor = Color3.fromRGB(180, 75, 230),
		},
		{
			Index = 6,
			Position = Vector3.new(165, 0, 100),
			HiveWallPosition = Vector3.new(165, 12, 125),
			BaseplateColor = Color3.fromRGB(255, 140, 50),
		},
	} :: { HivePlotConfig },

	-- 6 Pollen Harvesting Fields with Level Requisites
	Fields = {
		SunflowerField = {
			Id = "SunflowerField",
			DisplayName = "🌻 Sunflower Field",
			CenterPosition = Vector3.new(-75, 1, -40),
			Bounds = Vector3.new(90, 4, 90),
			PollenPerFlower = 5,
			RequiredLevel = 1,
			FlowerColorPalette = {
				Color3.fromRGB(255, 220, 20),
				Color3.fromRGB(255, 180, 0),
				Color3.fromRGB(255, 255, 100),
			},
		},
		CloverPatch = {
			Id = "CloverPatch",
			DisplayName = "🍀 Clover Patch",
			CenterPosition = Vector3.new(75, 1, -40),
			Bounds = Vector3.new(90, 4, 90),
			PollenPerFlower = 12,
			RequiredLevel = 2,
			FlowerColorPalette = {
				Color3.fromRGB(50, 220, 90),
				Color3.fromRGB(100, 255, 140),
				Color3.fromRGB(30, 180, 60),
			},
		},
		MushroomGlade = {
			Id = "MushroomGlade",
			DisplayName = "🍄 Mushroom Glade",
			CenterPosition = Vector3.new(-120, 1, -160),
			Bounds = Vector3.new(85, 4, 85),
			PollenPerFlower = 25,
			RequiredLevel = 4,
			FlowerColorPalette = {
				Color3.fromRGB(255, 60, 60),
				Color3.fromRGB(255, 120, 120),
				Color3.fromRGB(180, 30, 50),
			},
		},
		SpiderMeadow = {
			Id = "SpiderMeadow",
			DisplayName = "🕸️ Spider Meadow",
			CenterPosition = Vector3.new(120, 1, -160),
			Bounds = Vector3.new(85, 4, 85),
			PollenPerFlower = 55,
			RequiredLevel = 6,
			FlowerColorPalette = {
				Color3.fromRGB(230, 240, 255),
				Color3.fromRGB(160, 190, 230),
				Color3.fromRGB(110, 130, 180),
			},
		},
		PineappleMountain = {
			Id = "PineappleMountain",
			DisplayName = "🍍 Pineapple Mountain",
			CenterPosition = Vector3.new(-75, 20, -280),
			Bounds = Vector3.new(90, 6, 90),
			PollenPerFlower = 140,
			RequiredLevel = 10,
			FlowerColorPalette = {
				Color3.fromRGB(255, 200, 40),
				Color3.fromRGB(255, 140, 20),
				Color3.fromRGB(180, 220, 40),
			},
		},
		CoconutOasis = {
			Id = "CoconutOasis",
			DisplayName = "🥥 Coconut Oasis (Endgame)",
			CenterPosition = Vector3.new(75, 35, -280),
			Bounds = Vector3.new(90, 6, 90),
			PollenPerFlower = 400,
			RequiredLevel = 15,
			FlowerColorPalette = {
				Color3.fromRGB(0, 240, 255),
				Color3.fromRGB(255, 240, 200),
				Color3.fromRGB(50, 200, 150),
			},
		},
	} :: { [string]: Types.PollenFieldDefinition },

	-- Tools Catalog
	Tools = {
		tool_scoop = {
			Id = "tool_scoop",
			Name = "Starter Scoop",
			CostHoney = 0,
			CollectPower = 1.0,
			CollectRadius = 5.0,
			SwingCooldown = 0.45,
			RequiredLevel = 1,
			ModelAssetId = "rbxassetid://0",
		},
		tool_rake = {
			Id = "tool_rake",
			Name = "Wooden Rake",
			CostHoney = 800,
			CollectPower = 2.8,
			CollectRadius = 7.5,
			SwingCooldown = 0.40,
			RequiredLevel = 2,
			ModelAssetId = "rbxassetid://0",
		},
		tool_scythe = {
			Id = "tool_scythe",
			Name = "Crimson Scythe",
			CostHoney = 5000,
			CollectPower = 7.5,
			CollectRadius = 10.0,
			SwingCooldown = 0.35,
			RequiredLevel = 5,
			ModelAssetId = "rbxassetid://0",
		},
		tool_honey_dipper = {
			Id = "tool_honey_dipper",
			Name = "Golden Honey Dipper",
			CostHoney = 45000,
			CollectPower = 22.0,
			CollectRadius = 14.0,
			SwingCooldown = 0.30,
			RequiredLevel = 8,
			ModelAssetId = "rbxassetid://0",
		},
		tool_spark_staff = {
			Id = "tool_spark_staff",
			Name = "⚡ Spark Staff of Thunder",
			CostHoney = 500000,
			CollectPower = 80.0,
			CollectRadius = 20.0,
			SwingCooldown = 0.22,
			RequiredLevel = 12,
			ModelAssetId = "rbxassetid://0",
		},
	} :: { [string]: Types.ToolDefinition },

	-- Backpacks Catalog
	Backpacks = {
		pack_pouch = {
			Id = "pack_pouch",
			Name = "Beginner Pouch",
			CostHoney = 0,
			Capacity = 200,
			RequiredLevel = 1,
		},
		pack_jar = {
			Id = "pack_jar",
			Name = "Honey Jar Pack",
			CostHoney = 1200,
			Capacity = 1000,
			RequiredLevel = 2,
		},
		pack_canister = {
			Id = "pack_canister",
			Name = "Steel Canister",
			CostHoney = 12000,
			Capacity = 6000,
			RequiredLevel = 5,
		},
		pack_super = {
			Id = "pack_super",
			Name = "Mega Vacuum Tank",
			CostHoney = 150000,
			Capacity = 35000,
			RequiredLevel = 9,
		},
		pack_void = {
			Id = "pack_void",
			Name = "🌌 Void Singularity Pack",
			CostHoney = 2000000,
			Capacity = 250000,
			RequiredLevel = 14,
		},
	} :: { [string]: Types.BackpackDefinition },

	-- Bees / Pets Catalog
	Bees = {
		bee_basic = {
			Id = "bee_basic",
			Name = "Basic Bee",
			Rarity = "Common" :: Types.RarityTier,
			BaseGather = 4,
			BaseAttack = 2,
			Speed = 16,
			Color = Color3.fromRGB(255, 215, 0),
		},
		bee_bomber = {
			Id = "bee_bomber",
			Name = "Bomber Bee",
			Rarity = "Rare" :: Types.RarityTier,
			BaseGather = 10,
			BaseAttack = 8,
			Speed = 18,
			Color = Color3.fromRGB(140, 140, 160),
		},
		bee_rad = {
			Id = "bee_rad",
			Name = "Rad Bee",
			Rarity = "Epic" :: Types.RarityTier,
			BaseGather = 25,
			BaseAttack = 18,
			Speed = 22,
			Color = Color3.fromRGB(255, 50, 70),
		},
		bee_vicious = {
			Id = "bee_vicious",
			Name = "Vicious Bee",
			Rarity = "Legendary" :: Types.RarityTier,
			BaseGather = 60,
			BaseAttack = 65,
			Speed = 26,
			Color = Color3.fromRGB(110, 40, 220),
		},
		bee_photon = {
			Id = "bee_photon",
			Name = "Photon Bee",
			Rarity = "Mythic" :: Types.RarityTier,
			BaseGather = 180,
			BaseAttack = 120,
			Speed = 32,
			Color = Color3.fromRGB(255, 255, 120),
		},
		bee_gummy = {
			Id = "bee_gummy",
			Name = "Gummy Bear Overlord",
			Rarity = "Secret" :: Types.RarityTier,
			BaseGather = 600,
			BaseAttack = 400,
			Speed = 36,
			Color = Color3.fromRGB(255, 80, 220),
		},
	},

	-- Mobs Catalog with Respawn
	Mobs = {
		mob_ladybug = {
			Id = "mob_ladybug",
			Name = "Cute Ladybug",
			MaxHealth = 30,
			Damage = 3,
			AttackCooldown = 1.2,
			RespawnTime = 10,
			HoneyReward = 150,
			TokenRewardChance = 0.25,
			SpawnPosition = Vector3.new(-75, 2, -40),
			RoamRadius = 25,
		},
		mob_beetle = {
			Id = "mob_beetle",
			Name = "Armored Rhino Beetle",
			MaxHealth = 120,
			Damage = 10,
			AttackCooldown = 1.0,
			RespawnTime = 20,
			HoneyReward = 800,
			TokenRewardChance = 0.40,
			SpawnPosition = Vector3.new(75, 2, -40),
			RoamRadius = 30,
		},
		mob_spider_boss = {
			Id = "mob_spider_boss",
			Name = "🕷️ Giant Cave Spider (BOSS)",
			MaxHealth = 850,
			Damage = 28,
			AttackCooldown = 0.8,
			RespawnTime = 45,
			HoneyReward = 6500,
			TokenRewardChance = 0.90,
			SpawnPosition = Vector3.new(120, 2, -160),
			RoamRadius = 20,
		},
	} :: { [string]: Types.MobDefinition },

	-- Claw Machine Rewards Matrix (Arcade Crane)
	ClawRewards = {
		{
			RewardType = "Honey" :: "Honey",
			DisplayName = "10,000 Pure Honey",
			Amount = 10000,
			Color = Color3.fromRGB(255, 200, 30),
			Weight = 40,
			Rarity = "Common" :: Types.RarityTier,
		},
		{
			RewardType = "Gems" :: "Gems",
			DisplayName = "50 Shiny Gems",
			Amount = 50,
			Color = Color3.fromRGB(0, 230, 255),
			Weight = 25,
			Rarity = "Rare" :: Types.RarityTier,
		},
		{
			RewardType = "MythicEgg" :: "MythicEgg",
			DisplayName = "🌟 Golden Mythic Bee Egg",
			Amount = 1,
			Color = Color3.fromRGB(255, 50, 120),
			Weight = 10,
			Rarity = "Mythic" :: Types.RarityTier,
		},
		{
			RewardType = "SecretKey" :: "SecretKey",
			DisplayName = "🗝️ Coconut Oasis Gate Key",
			Amount = 1,
			Color = Color3.fromRGB(255, 215, 0),
			Weight = 5,
			Rarity = "Legendary" :: Types.RarityTier,
		},
		{
			RewardType = "LegendaryTool" :: "LegendaryTool",
			DisplayName = "⚡ Cosmic Spark Dipper",
			Amount = 1,
			Color = Color3.fromRGB(180, 50, 255),
			Weight = 2,
			Rarity = "Secret" :: Types.RarityTier,
		},
	} :: { Types.ClawReward },

	ClawMachine = {
		WorldPosition = Vector3.new(0, 0, 15),
		CostClawTokens = 1,
		DurationSeconds = 4.5,
	},
}

return GameConfig
