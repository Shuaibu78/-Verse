import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  useWorldStore,
  usePlayerStore,
  createRNG,
  generateCreatures,
  generateWeather,
  type Weather,
} from "@piverse/game-engine";

import { Howl } from "howler";
import TerrainChunks from "./TerrainChunks";
import InstancedCreatures from "./InstancedCreatures";
import Collectibles from "./Collectibles";
import SurvivalSystem from "./SurvivalSystem";
import PhotoModeRenderer from "./PhotoModeRenderer";
import { Suspense } from "react";
import { useGameStore } from "@piverse/game-engine";

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

// (Old per-mesh creature removed; now using InstancedCreatures)

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
    const rain = new Howl({ src: ["rain.mp3"], loop: true, volume: 0 });
    const wind = new Howl({ src: ["wind.mp3"], loop: true, volume: 0 });
    let visible = true;

    const handleVisibility = () => {
      visible = !document.hidden;
      const targetRain = visible && weather ? weather.rainLevel : 0;
      const targetWind = visible && weather ? weather.windSpeed / 10 : 0;
      rain.fade(rain.volume(), targetRain, 300);
      wind.fade(wind.volume(), targetWind, 300);
    };

    rain.play();
    wind.play();
    document.addEventListener("visibilitychange", handleVisibility);
    handleVisibility();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      rain.stop();
      wind.stop();
    };
  }, [weather]);
}

// --- Main World Scene ---
function WorldScene() {
  useWASDControls();

  const { piSegment, setCreatures, setWeather, weather } = useWorldStore();
  const { gameMode } = useGameStore();
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

  // Adaptive resolution scaling based on FPS
  const { gl } = useThree();
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef(0);
  const targetFps = 60;
  const minRatio = 0.6;
  const maxRatio = Math.min(1.5, window.devicePixelRatio);

  useFrame(() => {
    frameCountRef.current++;
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt >= 1000) {
      const fps = (frameCountRef.current * 1000) / dt;
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      const current = gl.getPixelRatio();
      if (fps < targetFps - 10) {
        const next = Math.max(minRatio, current * 0.9);
        if (Math.abs(next - current) > 0.01) gl.setPixelRatio(next);
      } else if (fps > targetFps + 10) {
        const next = Math.min(maxRatio, current * 1.05);
        if (Math.abs(next - current) > 0.01) gl.setPixelRatio(next);
      }
    }
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
      <Suspense fallback={null}>
        <TerrainChunks />
      </Suspense>

      {/* Rain particles */}
      {weather && weather.rainLevel > 0.1 && (
        <RainParticles rainLevel={weather.rainLevel} />
      )}

      {/* Creatures */}
      <InstancedCreatures />

      {/* Collectibles */}
      <Suspense fallback={null}>
        <Collectibles />
      </Suspense>

      {/* Survival System */}
      <Suspense fallback={null}>
        <SurvivalSystem />
      </Suspense>

      {/* Photo Mode Renderer */}
      {gameMode === "photo" && <PhotoModeRenderer />}

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
