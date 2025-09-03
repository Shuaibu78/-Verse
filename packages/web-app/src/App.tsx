import { useEffect, useState } from "react";
import { loadPiDigits } from "@piverse/game-engine";
import ControlsPanel from "./components/ControlsPanel";
import WorldCanvas from "./components/WorldCanvas";
import MiniMap from "./components/MiniMap";
import HUDFrame from "./components/HUDFrame";
import PauseMenu from "./components/PauseMenu";
import GameHUD from "./components/GameHUD";
import PhotoMode from "./components/PhotoMode";
import ResearchPanel from "./components/ResearchPanel";
import WorldSharing from "./components/WorldSharing";
import MultiplayerSystem from "./components/MultiplayerSystem";
import AIBehaviorPanel from "./components/AIBehaviorPanel";

function App() {
  const [piDigits, setPiDigits] = useState<string>("");

  useEffect(() => {
    loadPiDigits().then(setPiDigits);
  }, []);

  if (!piDigits) return <p className="p-4">Loading π...</p>;

  return (
    <div className="h-screen w-screen relative">
      <HUDFrame>
        <ControlsPanel allDigits={piDigits} />
        <MiniMap />
        <GameHUD />
        <PhotoMode />
        <ResearchPanel />
        <WorldSharing />
        <MultiplayerSystem />
        <AIBehaviorPanel />
      </HUDFrame>
      <PauseMenu />
      <WorldCanvas />
    </div>
  );
}

export default App;
