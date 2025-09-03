import { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { generateHeightMapFromPi, useWorldStore } from "@piverse/game-engine";

export default function Landscape() {
  const piSegment = useWorldStore((s) => s.piSegment);
  const size = 64;

  // 🖼️ Load textures
  const [grassMap, rockMap, grassNormal, rockNormal] = useLoader(
    THREE.TextureLoader,
    [
      "/textures/grass_diffuse.jpg",
      "/textures/rock_diffuse.jpg",
      // grass_normal may be missing; keep path but it might 404. We'll guard below.
      "/textures/grass_normal.jpg",
      "/textures/rock_normal.jpg",
    ]
  );

  // Terrain geometry and heightmap
  const geometry = useMemo(() => {
    const heightMap = generateHeightMapFromPi(piSegment, size);
    const geo = new THREE.PlaneGeometry(50, 50, size - 1, size - 1);

    for (let i = 0; i < geo.attributes.position.count; i++) {
      const x = i % size;
      const y = Math.floor(i / size);
      const height = heightMap[y][x];
      geo.attributes.position.setY(i, height * 5);
    }

    geo.computeVertexNormals();
    return geo;
  }, [piSegment]);

  // Material logic: blend textures based on elevation (simple cutoff for now)
  const isMountain = piSegment.charAt(0) >= "7"; // crude terrain theme

  // If grassNormal failed to load, it will be a texture with image=null
  const hasGrassNormal = !!(grassNormal as unknown as { image?: unknown })
    ?.image;

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial
        map={isMountain ? rockMap : grassMap}
        normalMap={
          isMountain ? rockNormal : hasGrassNormal ? grassNormal : undefined
        }
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
}
