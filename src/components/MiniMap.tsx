import { useWorldStore } from "../store/worldStore";

export default function MiniMap() {
  const { creatures } = useWorldStore();

  return (
    <div className="absolute top-2 right-2 bg-white/80 w-32 h-32 p-1 border border-black">
      <svg viewBox="0 0 20 20" className="w-full h-full">
        {creatures.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.z} r={0.5} fill="red" />
        ))}
      </svg>
    </div>
  );
}
