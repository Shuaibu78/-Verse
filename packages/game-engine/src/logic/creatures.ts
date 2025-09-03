export interface Creature {
  x: number;
  z: number;
  size: number;
  speed: number;
  color: string;
}

export function generateCreatures(rng: () => number, count = 10): Creature[] {
  const creatures: Creature[] = [];

  for (let i = 0; i < count; i++) {
    creatures.push({
      x: Math.floor(rng() * 20),
      z: Math.floor(rng() * 20),
      size: 0.5 + rng() * 1.5,
      speed: rng(),
      color: `hsl(${Math.floor(rng() * 360)}, 70%, 50%)`,
    });
  }

  return creatures;
}
