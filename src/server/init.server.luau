--!strict

local WorldBuilder = require(script.WorldBuilder)
local DataService = require(script.Services.DataService)
local TycoonService = require(script.Services.TycoonService)
local GatheringService = require(script.Services.GatheringService)
local ClawMachineService = require(script.Services.ClawMachineService)
local MobService = require(script.Services.MobService)
local QuestService = require(script.Services.QuestService)

local function bootstrap()
	print("==================================================")
	print("[SERVER] Initializing Bee Swarm Tycoon RPG Engine...")
	print("==================================================")

	WorldBuilder.BuildWorld()
	print("[SERVER] [0/6] WorldBuilder: Massive Multiplayer Map & Claw Arcade Loaded.")

	DataService.Init()
	print("[SERVER] [1/6] DataService Initialized.")

	TycoonService.Init()
	print("[SERVER] [2/6] TycoonService (Multiplayer Plots & Hive Converting) Ready.")

	GatheringService.Init()
	print("[SERVER] [3/6] GatheringService (Flower Fields & Backpack Harvesting) Ready.")

	ClawMachineService.Init()
	print("[SERVER] [4/6] ClawMachineService (Interactive Arcade Crane) Ready.")

	MobService.Init()
	print("[SERVER] [5/6] MobService (Hostile Monsters & Combat Drops) Ready.")

	QuestService.Init()
	print("[SERVER] [6/6] QuestService (RPG NPC Quests & Leveling) Ready.")

	print("==================================================")
	print("[SERVER] Bee Swarm Tycoon RPG Server Fully Active!")
	print("==================================================")
end

bootstrap()
