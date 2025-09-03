import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Collectible {
  id: string;
  type: "crystal" | "artifact" | "data" | "energy";
  x: number;
  z: number;
  value: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  discovered: boolean;
  collected: boolean;
}

export interface Objective {
  id: string;
  type: "collect" | "explore" | "survive" | "discover";
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  reward: {
    experience: number;
    items?: string[];
  };
}

export interface PlayerStats {
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  hunger: number;
  maxHunger: number;
  discoveries: number;
  distanceTraveled: number;
  timeSurvived: number;
}

export interface WorldMetadata {
  seed: string;
  name: string;
  description: string;
  difficulty: "peaceful" | "normal" | "hard" | "extreme";
  features: string[];
  discoveredBy: string;
  createdAt: number;
  playTime: number;
  screenshot?: string;
}

interface GameState {
  // Player progression
  stats: PlayerStats;
  objectives: Objective[];
  collectibles: Collectible[];

  // World management
  currentWorld: WorldMetadata | null;
  savedWorlds: WorldMetadata[];

  // Game mechanics
  gameMode: "exploration" | "survival" | "research" | "photo" | "multiplayer";
  paused: boolean;
  timeScale: number;

  // Research data
  performanceMetrics: {
    fps: number[];
    memoryUsage: number[];
    chunkCount: number[];
    timestamp: number[];
  };

  // Actions
  updateStats: (updates: Partial<PlayerStats>) => void;
  addObjective: (objective: Objective) => void;
  updateObjective: (id: string, progress: number) => void;
  completeObjective: (id: string) => void;
  addCollectible: (collectible: Collectible) => void;
  collectItem: (id: string) => void;
  saveWorld: (metadata: WorldMetadata) => void;
  loadWorld: (seed: string) => void;
  setGameMode: (mode: GameState["gameMode"]) => void;
  togglePause: () => void;
  recordPerformance: (fps: number, memory: number, chunks: number) => void;
}

const initialStats: PlayerStats = {
  level: 1,
  experience: 0,
  health: 100,
  maxHealth: 100,
  energy: 100,
  maxEnergy: 100,
  hunger: 100,
  maxHunger: 100,
  discoveries: 0,
  distanceTraveled: 0,
  timeSurvived: 0,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      stats: initialStats,
      objectives: [],
      collectibles: [],
      currentWorld: null,
      savedWorlds: [],
      gameMode: "exploration",
      paused: false,
      timeScale: 1,
      performanceMetrics: {
        fps: [],
        memoryUsage: [],
        chunkCount: [],
        timestamp: [],
      },

      updateStats: (updates) =>
        set((state) => ({
          stats: { ...state.stats, ...updates },
        })),

      addObjective: (objective) =>
        set((state) => ({
          objectives: [...state.objectives, objective],
        })),

      updateObjective: (id, progress) =>
        set((state) => ({
          objectives: state.objectives.map((obj) =>
            obj.id === id ? { ...obj, current: progress } : obj
          ),
        })),

      completeObjective: (id) =>
        set((state) => {
          const objective = state.objectives.find((obj) => obj.id === id);
          if (!objective) return state;

          return {
            objectives: state.objectives.map((obj) =>
              obj.id === id
                ? { ...obj, completed: true, current: obj.target }
                : obj
            ),
            stats: {
              ...state.stats,
              experience: state.stats.experience + objective.reward.experience,
            },
          };
        }),

      addCollectible: (collectible) =>
        set((state) => ({
          collectibles: [...state.collectibles, collectible],
        })),

      collectItem: (id) =>
        set((state) => ({
          collectibles: state.collectibles.map((item) =>
            item.id === id ? { ...item, collected: true } : item
          ),
          stats: {
            ...state.stats,
            discoveries: state.stats.discoveries + 1,
          },
        })),

      saveWorld: (metadata) =>
        set((state) => ({
          savedWorlds: [
            ...state.savedWorlds.filter((w) => w.seed !== metadata.seed),
            metadata,
          ],
        })),

      loadWorld: (seed) =>
        set((state) => {
          const world = state.savedWorlds.find((w) => w.seed === seed);
          return { currentWorld: world || null };
        }),

      setGameMode: (mode) => set({ gameMode: mode }),
      togglePause: () => set((state) => ({ paused: !state.paused })),

      recordPerformance: (fps, memory, chunks) =>
        set((state) => {
          const now = Date.now();
          const metrics = state.performanceMetrics;
          const maxSamples = 1000; // Keep last 1000 samples

          return {
            performanceMetrics: {
              fps: [...metrics.fps.slice(-maxSamples + 1), fps],
              memoryUsage: [
                ...metrics.memoryUsage.slice(-maxSamples + 1),
                memory,
              ],
              chunkCount: [
                ...metrics.chunkCount.slice(-maxSamples + 1),
                chunks,
              ],
              timestamp: [...metrics.timestamp.slice(-maxSamples + 1), now],
            },
          };
        }),
    }),
    {
      name: "piverse-game-storage",
      partialize: (state) => ({
        stats: state.stats,
        objectives: state.objectives,
        collectibles: state.collectibles,
        savedWorlds: state.savedWorlds,
        currentWorld: state.currentWorld,
      }),
    }
  )
);
