import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  useGameStore,
  usePlayerStore,
  useWorldStore,
  generateShelters,
  generateFoodSources,
  calculateWeatherEffects,
  calculateSurvivalImpact,
  type Shelter,
  type FoodSource,
  type WeatherEffects,
} from "@piverse/game-engine";

export default function SurvivalSystem() {
  const { x: playerX, z: playerZ } = usePlayerStore();
  const { piSegment } = useWorldStore();
  const { stats, updateStats, gameMode } = useGameStore();

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [foodSources, setFoodSources] = useState<FoodSource[]>([]);
  const [weather, setWeather] = useState<WeatherEffects | null>(null);
  const [inShelter, setInShelter] = useState(false);
  const [currentShelter, setCurrentShelter] = useState<Shelter | null>(null);

  const timeRef = useRef(0);
  const lastUpdateRef = useRef(0);

  // Initialize survival elements
  useEffect(() => {
    if (gameMode !== "survival") return;

    const newShelters = generateShelters(piSegment, 15);
    const newFoodSources = generateFoodSources(piSegment, 25);

    setShelters(newShelters);
    setFoodSources(newFoodSources);
  }, [piSegment, gameMode]);

  // Update weather and survival effects
  useFrame(({ clock }) => {
    if (gameMode !== "survival") return;

    const now = clock.getElapsedTime();
    timeRef.current = now;

    // Update weather every 30 seconds
    if (now - lastUpdateRef.current > 30) {
      const newWeather = calculateWeatherEffects(
        piSegment,
        now,
        Math.floor(now / 3600) % 4
      );
      setWeather(newWeather);
      lastUpdateRef.current = now;
    }

    // Check if player is in shelter
    const nearbyShelter = shelters.find((shelter) => {
      const distance = Math.hypot(shelter.x - playerX, shelter.z - playerZ);
      return distance < 5; // Shelter radius
    });

    setInShelter(!!nearbyShelter);
    setCurrentShelter(nearbyShelter || null);

    // Apply survival effects every 5 seconds
    if (weather && Math.floor(now) % 5 === 0) {
      const impact = calculateSurvivalImpact(
        weather,
        inShelter,
        currentShelter?.protection || 0
      );

      updateStats({
        health: Math.max(0, stats.health - impact.healthDrain),
        energy: Math.max(0, stats.energy - impact.energyDrain),
        hunger: Math.max(0, stats.hunger - impact.hungerDrain),
      });
    }
  });

  // Handle food collection
  const collectFood = (foodId: string) => {
    const food = foodSources.find((f) => f.id === foodId);
    if (!food) return;

    const distance = Math.hypot(food.x - playerX, food.z - playerZ);
    if (distance < 3) {
      // Collection radius
      updateStats({
        hunger: Math.min(stats.maxHunger, stats.hunger + food.nutrition),
        energy: Math.min(stats.maxEnergy, stats.energy + food.nutrition * 0.5),
      });

      // Mark as harvested
      setFoodSources((prev) =>
        prev.map((f) =>
          f.id === foodId ? { ...f, lastHarvested: Date.now() } : f
        )
      );
    }
  };

  if (gameMode !== "survival") return null;

  return (
    <group>
      {/* Render shelters */}
      {shelters.map((shelter) => (
        <ShelterMesh
          key={shelter.id}
          shelter={shelter}
          isActive={currentShelter?.id === shelter.id}
        />
      ))}

      {/* Render food sources */}
      {foodSources.map((food) => (
        <FoodMesh
          key={food.id}
          food={food}
          onCollect={() => collectFood(food.id)}
        />
      ))}

      {/* Weather effects */}
      {weather && <WeatherEffects weather={weather} />}
    </group>
  );
}

function ShelterMesh({
  shelter,
  isActive,
}: {
  shelter: Shelter;
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const getShelterGeometry = () => {
    switch (shelter.type) {
      case "cave":
        return (
          <sphereGeometry args={[3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        );
      case "ruins":
        return <boxGeometry args={[4, 2, 4]} />;
      case "tree":
        return <cylinderGeometry args={[1, 2, 6, 8]} />;
      case "rock":
        return <dodecahedronGeometry args={[2]} />;
      default:
        return <boxGeometry args={[3, 2, 3]} />;
    }
  };

  const getShelterColor = () => {
    if (isActive) return "#4ade80"; // Green when active
    switch (shelter.type) {
      case "cave":
        return "#6b7280";
      case "ruins":
        return "#92400e";
      case "tree":
        return "#16a34a";
      case "rock":
        return "#374151";
      default:
        return "#6b7280";
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={[shelter.x, shelter.type === "tree" ? 3 : 1, shelter.z]}
    >
      {getShelterGeometry()}
      <meshStandardMaterial
        color={getShelterColor()}
        emissive={isActive ? "#22c55e" : "#000000"}
        emissiveIntensity={isActive ? 0.3 : 0}
      />
    </mesh>
  );
}

function FoodMesh({
  food,
  onCollect,
}: {
  food: FoodSource;
  onCollect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [collected, setCollected] = useState(false);

  useFrame(() => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = 1 + Math.sin(Date.now() * 0.003) * 0.2;
    }
  });

  const getFoodGeometry = () => {
    switch (food.type) {
      case "berry":
        return <sphereGeometry args={[0.3, 8, 6]} />;
      case "mushroom":
        return <cylinderGeometry args={[0.2, 0.4, 0.8, 8]} />;
      case "fish":
        return <octahedronGeometry args={[0.4]} />;
      case "game":
        return <boxGeometry args={[0.6, 0.4, 0.8]} />;
      default:
        return <sphereGeometry args={[0.3]} />;
    }
  };

  const getFoodColor = () => {
    switch (food.type) {
      case "berry":
        return "#dc2626";
      case "mushroom":
        return "#fbbf24";
      case "fish":
        return "#3b82f6";
      case "game":
        return "#16a34a";
      default:
        return "#6b7280";
    }
  };

  const handleClick = () => {
    if (!collected) {
      setCollected(true);
      onCollect();
    }
  };

  if (collected) return null;

  return (
    <mesh ref={meshRef} position={[food.x, 1, food.z]} onClick={handleClick}>
      {getFoodGeometry()}
      <meshStandardMaterial
        color={getFoodColor()}
        emissive={getFoodColor()}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function WeatherEffects({ weather }: { weather: WeatherEffects }) {
  // Enhanced weather particles based on precipitation
  if (weather.precipitation > 30) {
    return (
      <group>
        {/* Rain particles */}
        <RainParticles intensity={weather.precipitation / 100} />

        {/* Fog effect */}
        {weather.visibility < 50 && (
          <fog attach="fog" args={["#a0a0a0", 5, 30]} />
        )}
      </group>
    );
  }

  return null;
}

function RainParticles({ intensity }: { intensity: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = Math.floor(intensity * 1000);

  useFrame(() => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= 0.5 * intensity; // Fall speed
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 20;
        positions[i * 3] = Math.random() * 40 - 20;
        positions[i * 3 + 2] = Math.random() * 40 - 20;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = Math.random() * 40 - 20;
    positions[i * 3 + 1] = Math.random() * 20 + 5;
    positions[i * 3 + 2] = Math.random() * 40 - 20;
  }

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#87ceeb" size={0.1} />
    </points>
  );
}
