export interface Weather {
  rainLevel: number;
  cloudDensity: number;
  windSpeed: number;
}

export function generateWeather(rng: () => number): Weather {
  return {
    rainLevel: rng(),
    cloudDensity: rng(),
    windSpeed: rng() * 10,
  };
}
