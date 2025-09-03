import { createRNG } from "./rng";

export interface Shelter {
  id: string;
  x: number;
  z: number;
  type: "cave" | "ruins" | "tree" | "rock";
  protection: number; // 0-1, reduces weather effects
  capacity: number; // how many players can fit
  durability: number; // 0-100, degrades over time
}

export interface FoodSource {
  id: string;
  x: number;
  z: number;
  type: "berry" | "mushroom" | "fish" | "game";
  nutrition: number; // 0-100, how much hunger it restores
  availability: number; // 0-1, affected by weather/season
  respawnTime: number; // seconds until it respawns
  lastHarvested: number; // timestamp
}

export interface WeatherEffects {
  temperature: number; // -50 to 50°C
  humidity: number; // 0-100%
  windSpeed: number; // 0-50 m/s
  precipitation: number; // 0-100%
  visibility: number; // 0-100%
}

export function generateShelters(piSegment: string, count = 10): Shelter[] {
  const rng = createRNG(`${piSegment}-shelters`);
  const shelters: Shelter[] = [];

  for (let i = 0; i < count; i++) {
    const type = ["cave", "ruins", "tree", "rock"][
      Math.floor(rng() * 4)
    ] as Shelter["type"];
    shelters.push({
      id: `shelter-${i}`,
      x: (rng() - 0.5) * 200,
      z: (rng() - 0.5) * 200,
      type,
      protection: getProtectionByType(type) + (rng() - 0.5) * 0.3,
      capacity: Math.floor(rng() * 5) + 1,
      durability: 80 + rng() * 20,
    });
  }

  return shelters;
}

export function generateFoodSources(
  piSegment: string,
  count = 20
): FoodSource[] {
  const rng = createRNG(`${piSegment}-food`);
  const foodSources: FoodSource[] = [];

  for (let i = 0; i < count; i++) {
    const type = ["berry", "mushroom", "fish", "game"][
      Math.floor(rng() * 4)
    ] as FoodSource["type"];
    foodSources.push({
      id: `food-${i}`,
      x: (rng() - 0.5) * 200,
      z: (rng() - 0.5) * 200,
      type,
      nutrition: getNutritionByType(type) + (rng() - 0.5) * 20,
      availability: 0.5 + rng() * 0.5,
      respawnTime: getRespawnTimeByType(type),
      lastHarvested: 0,
    });
  }

  return foodSources;
}

export function calculateWeatherEffects(
  piSegment: string,
  timeOfDay: number,
  season: number
): WeatherEffects {
  const rng = createRNG(
    `${piSegment}-weather-${Math.floor(timeOfDay / 3600)}-${season}`
  );

  // Base weather from π digits
  const baseTemp = (parseInt(piSegment.charAt(0)) - 5) * 10; // -40 to 40°C
  const baseHumidity = parseInt(piSegment.charAt(1)) * 10; // 0-90%
  const baseWind = parseInt(piSegment.charAt(2)) * 5; // 0-45 m/s
  const basePrecip = parseInt(piSegment.charAt(3)) * 10; // 0-90%

  // Time of day effects
  const dayNightTemp = Math.sin((timeOfDay / 86400) * Math.PI * 2) * 15; // ±15°C variation
  const dayNightHumidity =
    Math.sin((timeOfDay / 86400) * Math.PI * 2 + Math.PI) * 20 + 20; // 0-40% variation

  // Seasonal effects
  const seasonalTemp = Math.sin((season / 4) * Math.PI * 2) * 20; // ±20°C seasonal variation
  const seasonalPrecip =
    Math.sin((season / 4) * Math.PI * 2 + Math.PI / 2) * 30 + 30; // 0-60% seasonal variation

  return {
    temperature: Math.max(
      -50,
      Math.min(50, baseTemp + dayNightTemp + seasonalTemp + (rng() - 0.5) * 10)
    ),
    humidity: Math.max(
      0,
      Math.min(100, baseHumidity + dayNightHumidity + (rng() - 0.5) * 20)
    ),
    windSpeed: Math.max(0, Math.min(50, baseWind + (rng() - 0.5) * 10)),
    precipitation: Math.max(
      0,
      Math.min(100, basePrecip + seasonalPrecip + (rng() - 0.5) * 20)
    ),
    visibility: Math.max(
      10,
      Math.min(100, 100 - basePrecip - (rng() - 0.5) * 20)
    ),
  };
}

export function calculateSurvivalImpact(
  weather: WeatherEffects,
  inShelter: boolean,
  shelterProtection: number
): {
  healthDrain: number;
  energyDrain: number;
  hungerDrain: number;
} {
  let healthDrain = 0;
  let energyDrain = 0;
  let hungerDrain = 0;

  // Temperature effects
  if (weather.temperature < 0) {
    healthDrain += Math.abs(weather.temperature) * 0.1;
    energyDrain += Math.abs(weather.temperature) * 0.2;
  } else if (weather.temperature > 35) {
    healthDrain += (weather.temperature - 35) * 0.05;
    energyDrain += (weather.temperature - 35) * 0.3;
    hungerDrain += (weather.temperature - 35) * 0.1;
  }

  // Wind effects
  if (weather.windSpeed > 20) {
    energyDrain += (weather.windSpeed - 20) * 0.1;
    if (!inShelter) {
      healthDrain += (weather.windSpeed - 20) * 0.05;
    }
  }

  // Precipitation effects
  if (weather.precipitation > 30) {
    energyDrain += weather.precipitation * 0.05;
    if (!inShelter) {
      healthDrain += weather.precipitation * 0.02;
    }
  }

  // Shelter protection
  if (inShelter) {
    const protection = shelterProtection;
    healthDrain *= 1 - protection;
    energyDrain *= 1 - protection * 0.5;
  }

  return {
    healthDrain: Math.max(0, healthDrain),
    energyDrain: Math.max(0, energyDrain),
    hungerDrain: Math.max(0, hungerDrain),
  };
}

function getProtectionByType(type: Shelter["type"]): number {
  switch (type) {
    case "cave":
      return 0.9;
    case "ruins":
      return 0.7;
    case "tree":
      return 0.4;
    case "rock":
      return 0.6;
    default:
      return 0.5;
  }
}

function getNutritionByType(type: FoodSource["type"]): number {
  switch (type) {
    case "berry":
      return 15;
    case "mushroom":
      return 25;
    case "fish":
      return 40;
    case "game":
      return 60;
    default:
      return 20;
  }
}

function getRespawnTimeByType(type: FoodSource["type"]): number {
  switch (type) {
    case "berry":
      return 300; // 5 minutes
    case "mushroom":
      return 600; // 10 minutes
    case "fish":
      return 900; // 15 minutes
    case "game":
      return 1800; // 30 minutes
    default:
      return 600;
  }
}
