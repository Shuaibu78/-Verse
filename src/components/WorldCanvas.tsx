import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useWorldStore } from "../store/worldStore";
import { usePlayerStore } from "../store/playerStore";

import { createRNG } from "../logic/rng";
import { generateCreatures, type Creature } from "../logic/creatures";
import { generateWeather, type Weather } from "../logic/weather";

import { Howl } from "howler";
import Landscape from "./Landscape";
import { Sky } from "@react-three/drei";

// --- Particle Rain ---
function RainParticles({ rainLevel }: { rainLevel: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = Math.floor(rainLevel * 1000);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = Math.random() * 20;
      pos[i * 3 + 1] = Math.random() * 20 + 5;
      pos[i * 3 + 2] = Math.random() * 20;
    }
    return pos;
  }, [count]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const positions = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= 0.3; // fall speed
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 20;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

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
      <pointsMaterial color="#aaaaaa" size={0.1} />
    </points>
  );
}

// --- Creature with AI Behavior ---
function CreatureBehavior({ creature }: { creature: Creature }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { x: playerX, z: playerZ } = usePlayerStore();

  useFrame(() => {
    if (!meshRef.current) return;

    // Simple random wander
    meshRef.current.position.x += (Math.random() - 0.5) * 0.02 * creature.speed;
    meshRef.current.position.z += (Math.random() - 0.5) * 0.02 * creature.speed;

    // Flee player if too close
    const dx = playerX - meshRef.current.position.x;
    const dz = playerZ - meshRef.current.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 3) {
      meshRef.current.position.x -= dx * 0.05;
      meshRef.current.position.z -= dz * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[creature.x, creature.size / 2, creature.z]}>
      <sphereGeometry args={[creature.size / 2, 16, 16]} />
      <meshStandardMaterial color={creature.color} />
    </mesh>
  );
}

// --- Camera Follow with OrbitControls ---
function FollowCamera() {
  const { camera } = useThree();
  const { x, z } = usePlayerStore();

  useFrame(() => {
    camera.position.x = x + 10;
    camera.position.z = z + 10;
    camera.lookAt(x, 0, z);
  });

  return <OrbitControls enableZoom enablePan />;
}

// --- WASD Movement Hook ---
function useWASDControls() {
  const move = usePlayerStore((s) => s.move);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "w") move(0, -1);
      if (e.key === "s") move(0, 1);
      if (e.key === "a") move(-1, 0);
      if (e.key === "d") move(1, 0);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move]);
}

// --- Audio Ambient Sounds ---
function useAmbientSounds(weather: Weather | null) {
  useEffect(() => {
    if (!weather) return;

    const rainSound = new Howl({
      src: ["rain.mp3"],
      volume: weather.rainLevel,
      loop: true,
      autoplay: true,
    });

    const windSound = new Howl({
      src: ["wind.mp3"],
      volume: weather.windSpeed / 10,
      loop: true,
      autoplay: true,
    });

    rainSound.play();
    windSound.play();

    return () => {
      rainSound.stop();
      windSound.stop();
    };
  }, [weather]);
}

// --- Main World Scene ---
function WorldScene() {
  useWASDControls();

  const { piSegment, setCreatures, setWeather, creatures, weather } =
    useWorldStore();
  const rng = useMemo(() => createRNG(piSegment), [piSegment]);

  const newCreatures = useMemo(() => generateCreatures(rng), [rng]);
  const newWeather = useMemo(() => generateWeather(rng), [rng]);

  const sunPos = useRef(new THREE.Vector3(100, 100, 0));

  // Update global store if new data
  useEffect(() => {
    setCreatures(newCreatures);
    setWeather(newWeather);
  }, [newCreatures, newWeather, setCreatures, setWeather]);

  useAmbientSounds(weather);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.05; // slower cycle
    const radius = 100;
    sunPos.current.set(Math.sin(t) * radius, Math.cos(t) * radius, 0);
  });

  return (
    <>
      {/* ☁️ Dynamic Sky */}
      <Sky
        distance={450000}
        sunPosition={sunPos.current.toArray()}
        inclination={0.5}
        azimuth={0.25}
      />
      <directionalLight
        position={sunPos.current.toArray()}
        intensity={1.5}
        castShadow
      />

      {/* Weather */}
      <fog attach="fog" args={["#aaccee", 10, 80]} />
      <ambientLight intensity={0.5} />

      {/* Terrain */}
      <Landscape />

      {/* Rain particles */}
      {weather && weather.rainLevel > 0.1 && (
        <RainParticles rainLevel={weather.rainLevel} />
      )}

      {/* Creatures */}
      {creatures.map((creature, i) => (
        <CreatureBehavior key={i} creature={creature} />
      ))}

      {/* Camera controls */}
      <FollowCamera />
    </>
  );
}

// --- Main Canvas Component ---
export default function WorldCanvas() {
  return (
    <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
      <WorldScene />
    </Canvas>
  );
}
