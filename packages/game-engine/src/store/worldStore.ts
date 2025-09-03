import { create } from "zustand";
import type { Creature } from "../logic/creatures";
import type { Weather } from "../logic/weather";

interface WorldState {
  piSegment: string;
  creatures: Creature[];
  weather: Weather | null;
  setPiSegment: (segment: string) => void;
  setCreatures: (creatures: Creature[]) => void;
  setWeather: (weather: Weather) => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  piSegment: "3141592653",
  creatures: [],
  weather: null,
  setPiSegment: (segment) => set({ piSegment: segment }),
  setCreatures: (creatures) => set({ creatures }),
  setWeather: (weather) => set({ weather }),
}));
