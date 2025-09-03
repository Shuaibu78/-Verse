import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@piverse/game-engine";

export default function PhotoModeRenderer() {
  const { gl, scene, camera } = useThree();
  const { gameMode } = useGameStore();
  const originalSizeRef = useRef<THREE.Vector2 | null>(null);

  // Store original renderer size when entering photo mode
  useEffect(() => {
    if (gameMode === "photo" && !originalSizeRef.current) {
      originalSizeRef.current = gl.getSize(new THREE.Vector2());
      // Increase resolution for photo mode
      const scale = 2;
      gl.setSize(
        originalSizeRef.current.x * scale,
        originalSizeRef.current.y * scale,
        false
      );
    } else if (gameMode !== "photo" && originalSizeRef.current) {
      // Restore original size when exiting photo mode
      gl.setSize(originalSizeRef.current.x, originalSizeRef.current.y, false);
      originalSizeRef.current = null;
    }
  }, [gameMode, gl]);

  // Force re-render when in photo mode
  useFrame(() => {
    if (gameMode === "photo") {
      gl.render(scene, camera);
    }
  });

  return null; // This component doesn't render anything visible
}
