import { createRNG } from "./rng";

export interface CreatureBehavior {
  id: string;
  type: "herbivore" | "carnivore" | "omnivore" | "scavenger";
  personality: "aggressive" | "passive" | "curious" | "territorial";
  socialLevel: number; // 0-1, how much it interacts with others
  intelligence: number; // 0-1, affects learning and adaptation
  memory: number; // 0-1, how long it remembers events
  energy: number; // 0-100
  hunger: number; // 0-100
  fear: number; // 0-100, affects fleeing behavior
  aggression: number; // 0-100, affects attack behavior
}

export interface BehaviorEvent {
  id: string;
  creatureId: string;
  type: "interaction" | "hunting" | "fleeing" | "exploring" | "resting";
  targetId?: string;
  location: { x: number; z: number };
  timestamp: number;
  outcome: "success" | "failure" | "partial";
  data: Record<string, any>;
}

export interface EmergentPattern {
  id: string;
  type:
    | "flocking"
    | "territorial"
    | "hunting_pack"
    | "migration"
    | "competition";
  participants: string[];
  strength: number; // 0-1, how strong the pattern is
  duration: number; // how long it's been active
  startTime: number;
  data: Record<string, any>;
}

export class AIBehaviorSystem {
  private behaviors: Map<string, CreatureBehavior> = new Map();
  private events: BehaviorEvent[] = [];
  private patterns: EmergentPattern[] = [];
  private rng: () => number;

  constructor(piSegment: string) {
    this.rng = createRNG(`${piSegment}-ai`);
    this.initializeBehaviors();
  }

  private initializeBehaviors(): void {
    // Initialize with some default behaviors for testing
    const creatureTypes = ["herbivore", "carnivore", "omnivore", "scavenger"];
    const personalities = ["aggressive", "passive", "curious", "territorial"];

    for (let i = 0; i < 20; i++) {
      const behavior: CreatureBehavior = {
        id: `creature-${i}`,
        type: creatureTypes[
          Math.floor(this.rng() * creatureTypes.length)
        ] as CreatureBehavior["type"],
        personality: personalities[
          Math.floor(this.rng() * personalities.length)
        ] as CreatureBehavior["personality"],
        socialLevel: this.rng(),
        intelligence: this.rng(),
        memory: this.rng(),
        energy: 50 + this.rng() * 50,
        hunger: this.rng() * 100,
        fear: this.rng() * 100,
        aggression: this.rng() * 100,
      };

      this.behaviors.set(behavior.id, behavior);
    }
  }

  updateBehaviors(
    creatures: Array<{ id: string; x: number; z: number; size: number }>
  ): void {
    // Update creature states based on environment and interactions
    creatures.forEach((creature) => {
      const behavior = this.behaviors.get(creature.id);
      if (!behavior) return;

      // Natural state changes
      behavior.energy = Math.max(0, behavior.energy - this.rng() * 2);
      behavior.hunger = Math.min(100, behavior.hunger + this.rng() * 3);

      // Check for nearby creatures and interactions
      const nearby = creatures.filter((other) => {
        if (other.id === creature.id) return false;
        const distance = Math.hypot(other.x - creature.x, other.z - creature.z);
        return distance < 10; // Interaction radius
      });

      // Process interactions
      nearby.forEach((other) => {
        this.processInteraction(behavior, other, creature);
      });

      // Update emergent patterns
      this.updateEmergentPatterns(creature, nearby);
    });

    // Clean up old events and patterns
    this.cleanupOldData();
  }

  private processInteraction(
    behavior: CreatureBehavior,
    other: { id: string; x: number; z: number; size: number },
    self: { id: string; x: number; z: number; size: number }
  ): void {
    const otherBehavior = this.behaviors.get(other.id);
    if (!otherBehavior) return;

    const distance = Math.hypot(other.x - self.x, other.z - self.z);
    const interactionType = this.determineInteractionType(
      behavior,
      otherBehavior,
      distance
    );

    // Record the interaction
    const event: BehaviorEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      creatureId: behavior.id,
      type: interactionType,
      targetId: other.id,
      location: { x: self.x, z: self.z },
      timestamp: Date.now(),
      outcome: this.calculateOutcome(behavior, otherBehavior, interactionType),
      data: {
        distance,
        selfSize: self.size,
        otherSize: other.size,
        selfEnergy: behavior.energy,
        otherEnergy: otherBehavior.energy,
      },
    };

    this.events.push(event);

    // Update behaviors based on interaction outcome
    this.updateBehaviorFromEvent(behavior, event);
  }

  private determineInteractionType(
    self: CreatureBehavior,
    other: CreatureBehavior,
    distance: number
  ): BehaviorEvent["type"] {
    // Aggressive creatures might hunt or attack
    if (self.aggression > 70 && self.energy > 30) {
      if (self.type === "carnivore" && other.type !== "carnivore") {
        return "hunting";
      }
      return "interaction";
    }

    // Fearful creatures flee
    if (
      self.aggression < 30 ||
      (other.aggression > 50 && self.aggression < other.aggression)
    ) {
      return "fleeing";
    }

    // Curious creatures explore
    if (self.personality === "curious" && distance < 5) {
      return "exploring";
    }

    // Low energy creatures rest
    if (self.energy < 20) {
      return "resting";
    }

    return "interaction";
  }

  private calculateOutcome(
    self: CreatureBehavior,
    other: CreatureBehavior,
    type: BehaviorEvent["type"]
  ): BehaviorEvent["outcome"] {
    const selfAdvantage = (self.energy + self.aggression) / 200;
    const otherAdvantage = (other.energy + other.aggression) / 200;
    const advantage = selfAdvantage - otherAdvantage;

    switch (type) {
      case "hunting":
        return advantage > 0.3
          ? "success"
          : advantage > -0.3
          ? "partial"
          : "failure";
      case "fleeing":
        return advantage < -0.2 ? "success" : "failure";
      case "interaction":
        return Math.abs(advantage) < 0.2 ? "success" : "partial";
      default:
        return "success";
    }
  }

  private updateBehaviorFromEvent(
    behavior: CreatureBehavior,
    event: BehaviorEvent
  ): void {
    // Learning from experiences
    const learningRate = behavior.intelligence * 0.1;

    switch (event.outcome) {
      case "success":
        behavior.energy = Math.min(100, behavior.energy + 10);
        behavior.fear = Math.max(0, behavior.fear - 5);
        break;
      case "failure":
        behavior.energy = Math.max(0, behavior.energy - 15);
        behavior.fear = Math.min(100, behavior.fear + 10);
        break;
      case "partial":
        behavior.energy = Math.max(0, behavior.energy - 5);
        break;
    }

    // Personality-based adjustments
    if (behavior.personality === "aggressive" && event.outcome === "success") {
      behavior.aggression = Math.min(
        100,
        behavior.aggression + learningRate * 5
      );
    } else if (
      behavior.personality === "passive" &&
      event.outcome === "failure"
    ) {
      behavior.aggression = Math.max(0, behavior.aggression - learningRate * 3);
    }
  }

  private updateEmergentPatterns(
    creature: { id: string; x: number; z: number; size: number },
    nearby: Array<{ id: string; x: number; z: number; size: number }>
  ): void {
    const behavior = this.behaviors.get(creature.id);
    if (!behavior) return;

    // Check for flocking behavior
    if (behavior.socialLevel > 0.7 && nearby.length >= 3) {
      this.updateOrCreatePattern(
        "flocking",
        creature.id,
        nearby.map((n) => n.id)
      );
    }

    // Check for territorial behavior
    if (behavior.personality === "territorial" && behavior.aggression > 50) {
      this.updateOrCreatePattern("territorial", creature.id, [creature.id]);
    }

    // Check for hunting packs
    if (
      behavior.type === "carnivore" &&
      behavior.socialLevel > 0.5 &&
      nearby.length >= 2
    ) {
      const carnivores = nearby.filter((n) => {
        const b = this.behaviors.get(n.id);
        return b?.type === "carnivore";
      });
      if (carnivores.length >= 2) {
        this.updateOrCreatePattern(
          "hunting_pack",
          creature.id,
          carnivores.map((c) => c.id)
        );
      }
    }
  }

  private updateOrCreatePattern(
    type: EmergentPattern["type"],
    creatureId: string,
    participants: string[]
  ): void {
    const existing = this.patterns.find(
      (p) => p.type === type && p.participants.includes(creatureId)
    );

    if (existing) {
      existing.participants = [
        ...new Set([...existing.participants, ...participants]),
      ];
      existing.strength = Math.min(1, existing.strength + 0.1);
      existing.duration = Date.now() - existing.startTime;
    } else {
      const pattern: EmergentPattern = {
        id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        participants: [...new Set(participants)],
        strength: 0.3,
        duration: 0,
        startTime: Date.now(),
        data: {
          centerX: 0,
          centerZ: 0,
          radius: 10,
        },
      };

      this.patterns.push(pattern);
    }
  }

  private cleanupOldData(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes

    // Remove old events
    this.events = this.events.filter((event) => now - event.timestamp < maxAge);

    // Remove weak or old patterns
    this.patterns = this.patterns.filter((pattern) => {
      const age = now - pattern.startTime;
      return pattern.strength > 0.1 && age < maxAge * 2;
    });
  }

  // Public API for accessing behavior data
  getBehavior(creatureId: string): CreatureBehavior | undefined {
    return this.behaviors.get(creatureId);
  }

  getRecentEvents(creatureId?: string, limit = 50): BehaviorEvent[] {
    let events = this.events;
    if (creatureId) {
      events = events.filter((e) => e.creatureId === creatureId);
    }
    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  getActivePatterns(): EmergentPattern[] {
    return this.patterns.filter((p) => p.strength > 0.2);
  }

  getBehaviorStatistics(): {
    totalCreatures: number;
    averageIntelligence: number;
    averageSocialLevel: number;
    activePatterns: number;
    recentInteractions: number;
  } {
    const behaviors = Array.from(this.behaviors.values());

    return {
      totalCreatures: behaviors.length,
      averageIntelligence:
        behaviors.reduce((sum, b) => sum + b.intelligence, 0) /
        behaviors.length,
      averageSocialLevel:
        behaviors.reduce((sum, b) => sum + b.socialLevel, 0) / behaviors.length,
      activePatterns: this.patterns.filter((p) => p.strength > 0.2).length,
      recentInteractions: this.events.filter(
        (e) => Date.now() - e.timestamp < 60000
      ).length, // Last minute
    };
  }
}
