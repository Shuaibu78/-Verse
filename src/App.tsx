import { useEffect, useState } from "react";
import { loadPiDigits } from "./logic/piLoader";
import ControlsPanel from "./components/ControlsPanel";
import WorldCanvas from "./components/WorldCanvas";
import MiniMap from "./components/MiniMap";

function App() {
  const [piDigits, setPiDigits] = useState<string>("");

  useEffect(() => {
    loadPiDigits().then(setPiDigits);
  }, []);

  if (!piDigits) return <p className="p-4">Loading π...</p>;

  return (
    <div className="h-screen w-screen relative">
      <ControlsPanel allDigits={piDigits} />
      <MiniMap />
      <WorldCanvas />
    </div>
  );
}

export default App;
