import { useMemo } from "react";
import * as THREE from "three";
import { useWorldStore } from "../store/worldStore";
import { generateHeightMapFromPi } from "../logic/terrainHeightmap";

export default function Landscape() {
  const piSegment = useWorldStore((s) => s.piSegment);
  const size = 64;

  const { geometry, colors } = useMemo(() => {
    const heightMap = generateHeightMapFromPi(piSegment, size);
    const geo = new THREE.PlaneGeometry(50, 50, size - 1, size - 1);
    const colorArray = [];

    for (let i = 0; i < geo.attributes.position.count; i++) {
      const x = i % size;
      const y = Math.floor(i / size);
      const height = heightMap[y][x];
      geo.attributes.position.setY(i, height * 5); // scale height

      // Color based on height
      const color = new THREE.Color();
      if (height < 0.3) color.set("#1e90ff"); // water
      else if (height < 0.5) color.set("#228B22"); // grass
      else if (height < 0.7) color.set("#cccc66"); // sand
      else color.set("#dddddd"); // mountain/snow
      colorArray.push(color.r, color.g, color.b);
    }

    geo.computeVertexNormals();
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colorArray, 3));

    return { geometry: geo, colors: colorArray };
  }, [piSegment]);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    >
      <meshStandardMaterial vertexColors flatShading />
    </mesh>
  );
}
