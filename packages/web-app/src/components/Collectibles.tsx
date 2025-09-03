import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  useGameStore,
  usePlayerStore,
  useWorldStore,
  createRNG,
  type Collectible,
} from "@piverse/game-engine";

export default function Collectibles() {
  const { x: playerX, z: playerZ } = usePlayerStore();
  const piSegment = useWorldStore((s) => s.piSegment);
  const { collectibles, addCollectible, collectItem } = useGameStore();

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate collectibles based on π segment
  useEffect(() => {
    const rng = createRNG(piSegment);
    const newCollectibles: Collectible[] = [];

    for (let i = 0; i < 20; i++) {
      const type = ["crystal", "artifact", "data", "energy"][
        Math.floor(rng() * 4)
      ] as Collectible["type"];
      const rarity = ["common", "rare", "epic", "legendary"][
        Math.floor(rng() * 4)
      ] as Collectible["rarity"];

      newCollectibles.push({
        id: `${piSegment}-${i}`,
        type,
        x: (rng() - 0.5) * 100,
        z: (rng() - 0.5) * 100,
        value: Math.floor(rng() * 100) + 1,
        rarity,
        discovered: false,
        collected: false,
      });
    }

    newCollectibles.forEach(addCollectible);
  }, [piSegment, addCollectible]);

  // Update instance matrices
  useFrame(() => {
    if (!meshRef.current) return;

    let visibleCount = 0;
    collectibles.forEach((item, i) => {
      if (item.collected) return;

      // Check if player is close enough to discover
      const dist = Math.hypot(item.x - playerX, item.z - playerZ);
      if (dist < 5 && !item.discovered) {
        // Mark as discovered (you'd update this in store)
      }

      // Check if player can collect
      if (dist < 2) {
        collectItem(item.id);
        return;
      }

      // Update instance
      dummy.position.set(item.x, 1, item.z);
      dummy.scale.setScalar(getRarityScale(item.rarity));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(visibleCount, dummy.matrix);
      visibleCount++;
    });

    meshRef.current.count = visibleCount;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const colors = useMemo(() => {
    const array = new Float32Array(collectibles.length * 3);
    const color = new THREE.Color();

    collectibles.forEach((item, i) => {
      if (item.collected) return;

      switch (item.rarity) {
        case "common":
          color.setHex(0x888888);
          break;
        case "rare":
          color.setHex(0x0088ff);
          break;
        case "epic":
          color.setHex(0x8800ff);
          break;
        case "legendary":
          color.setHex(0xff8800);
          break;
      }

      array[i * 3] = color.r;
      array[i * 3 + 1] = color.g;
      array[i * 3 + 2] = color.b;
    });

    return array;
  }, [collectibles]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, collectibles.length]}
      castShadow
    >
      <octahedronGeometry args={[0.5, 0]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </octahedronGeometry>
      <meshStandardMaterial
        vertexColors
        emissive="#222222"
        emissiveIntensity={0.3}
      />
    </instancedMesh>
  );
}

function getRarityScale(rarity: Collectible["rarity"]): number {
  switch (rarity) {
    case "common":
      return 0.5;
    case "rare":
      return 0.7;
    case "epic":
      return 1.0;
    case "legendary":
      return 1.3;
  }
}
