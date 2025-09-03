/// <reference lib="webworker" />

import { createRNG } from "./rng";

type RequestMessage = {
  type: "request";
  key: string;
  piSegment: string;
  cx: number;
  cz: number;
  worldSize: number;
  res: number;
};

function generateHeightmap(
  piSegment: string,
  cx: number,
  cz: number,
  res: number
) {
  // Derive deterministic seed from piSegment and chunk coords
  const seed = `${piSegment}:${cx}:${cz}:${res}`;
  const rng = createRNG(seed);
  const count = res * res;
  const data = new Float32Array(count);
  // Simple fractal noise stub (replace with better noise as needed)
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const idx = j * res + i;
      const nx = i / res - 0.5;
      const nz = j / res - 0.5;
      let e = 0;
      let amp = 1;
      let freq = 1;
      for (let o = 0; o < 4; o++) {
        const val =
          Math.sin((nx * 10 * freq + rng()) * 2 * Math.PI) *
          Math.sin((nz * 10 * freq + rng()) * 2 * Math.PI);
        e += val * amp;
        amp *= 0.5;
        freq *= 2;
      }
      data[idx] = Math.max(0, e * 0.5 + 0.5);
    }
  }
  return data;
}

self.onmessage = (e: MessageEvent<RequestMessage>) => {
  const msg = e.data;
  if (msg?.type !== "request") return;
  const { key, piSegment, cx, cz, res } = msg;
  const data = generateHeightmap(piSegment, cx, cz, res);
  const response = {
    type: "heightmap" as const,
    key,
    width: res,
    height: res,
    data,
  };
  (self as any).postMessage(response, [data.buffer]);
};

export {}; // Make this a module
