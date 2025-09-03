import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWorldStore, usePlayerStore } from "@piverse/game-engine";

export default function InstancedCreatures() {
  const creatures = useWorldStore((s) => s.creatures);
  const { x: playerX, z: playerZ } = usePlayerStore();
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.count = creatures.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [creatures.length]);

  useFrame(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < creatures.length; i++) {
      const c = creatures[i];
      // Wander
      c.x += (Math.random() - 0.5) * 0.02 * c.speed;
      c.z += (Math.random() - 0.5) * 0.02 * c.speed;
      // Flee
      const dx = playerX - c.x;
      const dz = playerZ - c.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 3) {
        c.x -= dx * 0.05;
        c.z -= dz * 0.05;
      }
      dummy.position.set(c.x, c.size / 2, c.z);
      dummy.scale.setScalar(c.size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const colors = useMemo(() => {
    const array = new Float32Array(creatures.length * 3);
    const color = new THREE.Color();
    for (let i = 0; i < creatures.length; i++) {
      color.set(creatures[i].color);
      array[i * 3] = color.r;
      array[i * 3 + 1] = color.g;
      array[i * 3 + 2] = color.b;
    }
    return array;
  }, [creatures]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined as any, undefined as any, creatures.length]}
      castShadow
    >
      <sphereGeometry args={[0.5, 16, 16]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </sphereGeometry>
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  );
}
