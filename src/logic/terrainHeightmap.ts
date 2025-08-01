// Create height values from π digits
export function generateHeightMapFromPi(
  piSegment: string,
  size = 64
): number[][] {
  const digits = piSegment.split("").map(Number);
  const map: number[][] = [];

  let index = 0;
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      const digit = digits[index % digits.length];
      row.push(digit / 10); // scale 0.0 – 0.9
      index++;
    }
    map.push(row);
  }

  return map;
}
