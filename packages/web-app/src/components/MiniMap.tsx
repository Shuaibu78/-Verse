import { useWorldStore, usePlayerStore } from "@piverse/game-engine";
import { motion } from "framer-motion";

export default function MiniMap() {
  const { creatures } = useWorldStore();
  const { x: px, z: pz } = usePlayerStore();

  const scale = 0.8; // world->map scale

  const toMap = (wx: number, wz: number) => {
    const dx = wx - px;
    const dz = wz - pz;
    const mx = 10 + dx * scale;
    const mz = 10 + dz * scale;
    return { mx, mz };
  };

  return (
    <motion.div
      className="absolute top-2 right-2 bg-white/80 w-32 h-32 p-1 border border-black"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <svg viewBox={`0 0 20 20`} className="w-full h-full">
        <rect x={0} y={0} width={20} height={20} fill="white" stroke="black" />
        {/* Player */}
        <circle cx={10} cy={10} r={1} fill="blue" />
        {/* Creatures */}
        {creatures.map((c, i) => {
          const { mx, mz } = toMap(c.x, c.z);
          if (mx < 0 || mx > 20 || mz < 0 || mz > 20) return null;
          return <circle key={i} cx={mx} cy={mz} r={0.5} fill="red" />;
        })}
      </svg>
    </motion.div>
  );
}
