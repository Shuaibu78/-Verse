import { create } from "zustand";

interface PlayerState {
  x: number;
  z: number;
  move: (dx: number, dz: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  x: 10,
  z: 10,
  move: (dx, dz) => set((state) => ({ x: state.x + dx, z: state.z + dz })),
}));
