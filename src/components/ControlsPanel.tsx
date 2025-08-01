import { useState } from "react";
import { useWorldStore } from "../store/worldStore";
import { getPiSegment } from "../logic/piLoader";

export default function ControlsPanel({ allDigits }: { allDigits: string }) {
  const [index, setIndex] = useState(0);
  const setPiSegment = useWorldStore((state) => state.setPiSegment);

  const handleGenerate = () => {
    const segment = getPiSegment(allDigits, index, 100);
    setPiSegment(segment);
  };

  return (
    <div className="p-4 space-x-2">
      <input
        type="number"
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        className="border rounded p-2 w-40"
      />
      <button
        onClick={handleGenerate}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Generate World
      </button>
    </div>
  );
}
