import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { usePlayerStore, useWorldStore } from "@piverse/game-engine";

type HeightmapMessage = {
  type: "heightmap";
  key: string;
  width: number;
  height: number;
  data: Float32Array;
};

interface ChunkKey {
  cx: number;
  cz: number;
  res: number;
}

function makeKey({ cx, cz, res }: ChunkKey) {
  return `${cx}:${cz}:${res}`;
}

export default function TerrainChunks() {
  const { x: playerX, z: playerZ } = usePlayerStore();
  const piSegment = useWorldStore((s) => s.piSegment);
  const { gl } = useThree();

  const workerRef = useRef<Worker | null>(null);
  const [heightmaps, setHeightmaps] = useState<
    Record<string, HeightmapMessage>
  >({});

  const chunkWorldSize = 32; // world units per chunk
  const nearRes = 33; // grid resolution (segments + 1)
  const farRes = 17;
  const radiusChunks = 2; // render (2*R+1)^2 chunks

  // Spin up worker
  useEffect(() => {
    const w = new Worker(
      new URL("../logic/terrainWorker.ts", import.meta.url),
      { type: "module" }
    );
    const onMessage = (e: MessageEvent<HeightmapMessage>) => {
      if (e.data?.type === "heightmap") {
        setHeightmaps((prev) => ({ ...prev, [e.data.key]: e.data }));
      }
    };
    w.addEventListener("message", onMessage);
    workerRef.current = w;
    return () => {
      w.removeEventListener("message", onMessage);
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  // Determine visible chunk keys based on player position
  const visibleChunks: ChunkKey[] = useMemo(() => {
    const baseCx = Math.floor(playerX / chunkWorldSize);
    const baseCz = Math.floor(playerZ / chunkWorldSize);
    const keys: ChunkKey[] = [];
    for (let dz = -radiusChunks; dz <= radiusChunks; dz++) {
      for (let dx = -radiusChunks; dx <= radiusChunks; dx++) {
        const cx = baseCx + dx;
        const cz = baseCz + dz;
        const centerX = (cx + 0.5) * chunkWorldSize;
        const centerZ = (cz + 0.5) * chunkWorldSize;
        const dist = Math.hypot(centerX - playerX, centerZ - playerZ);
        const res = dist > chunkWorldSize * 2 ? farRes : nearRes;
        keys.push({ cx, cz, res });
      }
    }
    return keys;
  }, [playerX, playerZ]);

  // Request heightmaps for visible chunks
  useEffect(() => {
    if (!workerRef.current) return;
    const pending: string[] = [];
    for (const key of visibleChunks) {
      const k = makeKey(key);
      if (!heightmaps[k]) pending.push(k);
    }
    if (pending.length === 0) return;
    for (const { cx, cz, res } of visibleChunks) {
      const key = makeKey({ cx, cz, res });
      if (heightmaps[key]) continue;
      workerRef.current.postMessage({
        type: "request",
        key,
        piSegment,
        cx,
        cz,
        worldSize: chunkWorldSize,
        res,
      });
    }
  }, [visibleChunks, piSegment, heightmaps]);

  // Clean WebGL resources when context lost
  useEffect(() => {
    const onLost = (e: Event) => {
      e.preventDefault();
    };
    const onRestore = () => {};
    gl.domElement.addEventListener("webglcontextlost", onLost as any, false);
    gl.domElement.addEventListener(
      "webglcontextrestored",
      onRestore as any,
      false
    );
    return () => {
      gl.domElement.removeEventListener("webglcontextlost", onLost as any);
      gl.domElement.removeEventListener(
        "webglcontextrestored",
        onRestore as any
      );
    };
  }, [gl]);

  return (
    <group>
      {visibleChunks.map(({ cx, cz, res }) => {
        const key = makeKey({ cx, cz, res });
        const hm = heightmaps[key];
        const x0 = cx * chunkWorldSize;
        const z0 = cz * chunkWorldSize;

        return (
          <ChunkMesh
            key={key}
            x0={x0}
            z0={z0}
            worldSize={chunkWorldSize}
            res={res}
            heightmap={hm?.data}
          />
        );
      })}
    </group>
  );
}

function ChunkMesh({
  x0,
  z0,
  worldSize,
  res,
  heightmap,
}: {
  x0: number;
  z0: number;
  worldSize: number;
  res: number;
  heightmap?: Float32Array;
}) {
  const geometryRef = useRef<THREE.PlaneGeometry | null>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(worldSize, worldSize, res - 1, res - 1);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [worldSize, res]);

  useEffect(() => {
    geometryRef.current = geometry;
    return () => void (geometryRef.current = null);
  }, [geometry]);

  useEffect(() => {
    if (!geometryRef.current || !heightmap) return;
    const pos = geometryRef.current.attributes
      .position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = heightmap[i] * 5; // scale
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    geometryRef.current.computeVertexNormals();
  }, [heightmap]);

  return (
    <mesh
      position={[x0 + worldSize / 2, 0, z0 + worldSize / 2]}
      geometry={geometry}
      receiveShadow
      castShadow
    >
      <meshStandardMaterial color="#88aa77" roughness={0.9} metalness={0.0} />
    </mesh>
  );
}
