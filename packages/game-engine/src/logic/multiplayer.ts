import { createRNG } from "./rng";

export interface Player {
  id: string;
  name: string;
  x: number;
  z: number;
  color: string;
  lastSeen: number;
  isOnline: boolean;
}

export interface CollaborationSession {
  id: string;
  worldSeed: string;
  hostId: string;
  players: Player[];
  sharedObjectives: string[];
  sharedDiscoveries: string[];
  createdAt: number;
  lastActivity: number;
}

export interface SharedDiscovery {
  id: string;
  type: "collectible" | "shelter" | "food" | "landmark";
  x: number;
  z: number;
  discoveredBy: string;
  sharedAt: number;
  description: string;
  value: number;
}

export interface WorldSeed {
  seed: string;
  name: string;
  description: string;
  difficulty: "peaceful" | "normal" | "hard" | "extreme";
  features: string[];
  discoveredBy: string;
  sharedBy: string;
  createdAt: number;
  playCount: number;
  rating: number;
  tags: string[];
  screenshot?: string;
}

// Simulated multiplayer functions (in real implementation, these would connect to a server)
export class MultiplayerManager {
  private sessions: Map<string, CollaborationSession> = new Map();
  private sharedWorlds: WorldSeed[] = [];
  private discoveries: SharedDiscovery[] = [];

  constructor() {
    this.loadSharedWorlds();
    this.loadDiscoveries();
  }

  // World sharing
  shareWorld(world: WorldSeed): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        this.sharedWorlds.push(world);
        this.saveSharedWorlds();
        resolve(true);
      }, 500);
    });
  }

  getSharedWorlds(): Promise<WorldSeed[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.sharedWorlds]);
      }, 200);
    });
  }

  searchWorlds(
    query: string,
    filters: {
      difficulty?: string;
      tags?: string[];
      minRating?: number;
    } = {}
  ): Promise<WorldSeed[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = this.sharedWorlds.filter((world) => {
          const matchesQuery =
            !query ||
            world.name.toLowerCase().includes(query.toLowerCase()) ||
            world.description.toLowerCase().includes(query.toLowerCase());

          const matchesDifficulty =
            !filters.difficulty || world.difficulty === filters.difficulty;
          const matchesTags =
            !filters.tags?.length ||
            filters.tags.some((tag) => world.tags.includes(tag));
          const matchesRating =
            !filters.minRating || world.rating >= filters.minRating;

          return (
            matchesQuery && matchesDifficulty && matchesTags && matchesRating
          );
        });

        // Sort by rating and play count
        results.sort((a, b) => b.rating * b.playCount - a.rating * a.playCount);
        resolve(results);
      }, 300);
    });
  }

  rateWorld(seed: string, rating: number): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const world = this.sharedWorlds.find((w) => w.seed === seed);
        if (world) {
          // Simple rating update (in real app, this would be more sophisticated)
          world.rating = (world.rating + rating) / 2;
          this.saveSharedWorlds();
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  }

  // Collaboration sessions
  createSession(
    worldSeed: string,
    hostId: string
  ): Promise<CollaborationSession> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const session: CollaborationSession = {
          id: this.generateSessionId(),
          worldSeed,
          hostId,
          players: [
            {
              id: hostId,
              name: "Host",
              x: 0,
              z: 0,
              color: this.generatePlayerColor(),
              lastSeen: Date.now(),
              isOnline: true,
            },
          ],
          sharedObjectives: [],
          sharedDiscoveries: [],
          createdAt: Date.now(),
          lastActivity: Date.now(),
        };

        this.sessions.set(session.id, session);
        resolve(session);
      }, 300);
    });
  }

  joinSession(
    sessionId: string,
    playerId: string,
    playerName: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const session = this.sessions.get(sessionId);
        if (session && session.players.length < 8) {
          // Max 8 players
          session.players.push({
            id: playerId,
            name: playerName,
            x: 0,
            z: 0,
            color: this.generatePlayerColor(),
            lastSeen: Date.now(),
            isOnline: true,
          });
          session.lastActivity = Date.now();
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  }

  updatePlayerPosition(
    sessionId: string,
    playerId: string,
    x: number,
    z: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const session = this.sessions.get(sessionId);
        if (session) {
          const player = session.players.find((p) => p.id === playerId);
          if (player) {
            player.x = x;
            player.z = z;
            player.lastSeen = Date.now();
            session.lastActivity = Date.now();
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      }, 100);
    });
  }

  getSessionPlayers(sessionId: string): Promise<Player[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const session = this.sessions.get(sessionId);
        resolve(session ? [...session.players] : []);
      }, 100);
    });
  }

  // Shared discoveries
  shareDiscovery(
    discovery: Omit<SharedDiscovery, "id" | "sharedAt">
  ): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sharedDiscovery: SharedDiscovery = {
          ...discovery,
          id: this.generateDiscoveryId(),
          sharedAt: Date.now(),
        };

        this.discoveries.push(sharedDiscovery);
        this.saveDiscoveries();
        resolve(true);
      }, 200);
    });
  }

  getNearbyDiscoveries(
    x: number,
    z: number,
    radius: number = 50
  ): Promise<SharedDiscovery[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const nearby = this.discoveries.filter((discovery) => {
          const distance = Math.hypot(discovery.x - x, discovery.z - z);
          return distance <= radius;
        });

        // Sort by distance
        nearby.sort((a, b) => {
          const distA = Math.hypot(a.x - x, a.z - z);
          const distB = Math.hypot(b.x - x, b.z - z);
          return distA - distB;
        });

        resolve(nearby);
      }, 100);
    });
  }

  // Utility functions
  private generateSessionId(): string {
    return "session_" + Math.random().toString(36).substr(2, 9);
  }

  private generateDiscoveryId(): string {
    return "discovery_" + Math.random().toString(36).substr(2, 9);
  }

  private generatePlayerColor(): string {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private loadSharedWorlds(): void {
    const saved = localStorage.getItem("piverse-shared-worlds");
    if (saved) {
      try {
        this.sharedWorlds = JSON.parse(saved);
      } catch (error) {
        console.error("Failed to load shared worlds:", error);
        this.sharedWorlds = [];
      }
    }
  }

  private saveSharedWorlds(): void {
    localStorage.setItem(
      "piverse-shared-worlds",
      JSON.stringify(this.sharedWorlds)
    );
  }

  private loadDiscoveries(): void {
    const saved = localStorage.getItem("piverse-shared-discoveries");
    if (saved) {
      try {
        this.discoveries = JSON.parse(saved);
      } catch (error) {
        console.error("Failed to load discoveries:", error);
        this.discoveries = [];
      }
    }
  }

  private saveDiscoveries(): void {
    localStorage.setItem(
      "piverse-shared-discoveries",
      JSON.stringify(this.discoveries)
    );
  }
}

// Global multiplayer manager instance
export const multiplayerManager = new MultiplayerManager();
