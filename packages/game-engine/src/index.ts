// Core game logic exports
export * from "./logic/rng";
export * from "./logic/creatures";
export * from "./logic/weather";
export * from "./logic/terrain";
export * from "./logic/terrainHeightmap";
export * from "./logic/piLoader";
export * from "./logic/survival";
export * from "./logic/multiplayer";
export * from "./logic/aiBehavior";

// Store exports
export * from "./store/worldStore";
export * from "./store/playerStore";
export * from "./store/gameStore";

// Types
export type { Creature } from "./logic/creatures";
export type { Weather } from "./logic/weather";
export type {
  Collectible,
  Objective,
  PlayerStats,
  WorldMetadata,
} from "./store/gameStore";
export type { Shelter, FoodSource, WeatherEffects } from "./logic/survival";
export type {
  Player,
  CollaborationSession,
  SharedDiscovery,
  WorldSeed,
} from "./logic/multiplayer";
export type {
  CreatureBehavior,
  BehaviorEvent,
  EmergentPattern,
} from "./logic/aiBehavior";
