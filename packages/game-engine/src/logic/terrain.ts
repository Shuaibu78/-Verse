export interface TerrainPoint {
  x: number;
  z: number;
  height: number;
}

export function generateTerrain(rng: () => number, size = 20): TerrainPoint[][] {
  const grid: TerrainPoint[][] = [];
  for (let x = 0; x < size; x++) {
    grid[x] = [];
    for (let z = 0; z < size; z++) {
      const height = Math.floor(rng() * 5); // 0–4
      grid[x][z] = { x, z, height };
    }
  }
  return grid;
}

export function getTerrainHeight(grid: TerrainPoint[][], x: number, z: number): number {
  if (x >= 0 && x < grid.length && z >= 0 && z < grid[0].length) {
    return grid[x][z].height;
  }
  return 0; // Default height for out-of-bounds
}

export function flattenTerrain(grid: TerrainPoint[][]): TerrainPoint[] {
  const flat: TerrainPoint[] = [];
  for (let x = 0; x < grid.length; x++) {
    for (let z = 0; z < grid[x].length; z++) {
      flat.push(grid[x][z]);
    }
  }
  return flat;
}
