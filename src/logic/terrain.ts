export function generateTerrain(rng: () => number, size = 20) {
  const grid = [];
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      const height = Math.floor(rng() * 5); // 0–4
      grid.push({ x, z, height });
    }
  }
  return grid;
}
