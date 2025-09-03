import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGameStore,
  useWorldStore,
  type WorldMetadata,
} from "@piverse/game-engine";

export default function WorldSharing() {
  const [active, setActive] = useState(false);
  const [worldName, setWorldName] = useState("");
  const [worldDescription, setWorldDescription] = useState("");
  const [difficulty, setDifficulty] =
    useState<WorldMetadata["difficulty"]>("normal");
  const [savedWorlds, setSavedWorlds] = useState<WorldMetadata[]>([]);

  const { piSegment } = useWorldStore();
  const { saveWorld, loadWorld, currentWorld } = useGameStore();

  useEffect(() => {
    // Load saved worlds from localStorage
    const saved = localStorage.getItem("piverse-saved-worlds");
    if (saved) {
      setSavedWorlds(JSON.parse(saved));
    }
  }, []);

  const saveCurrentWorld = () => {
    if (!worldName.trim()) return;

    const metadata: WorldMetadata = {
      seed: piSegment,
      name: worldName,
      description: worldDescription,
      difficulty,
      features: ["procedural", "infinite", "π-based"],
      discoveredBy: "Player",
      createdAt: Date.now(),
      playTime: 0,
    };

    saveWorld(metadata);
    setSavedWorlds((prev) => [
      ...prev.filter((w) => w.seed !== metadata.seed),
      metadata,
    ]);
    localStorage.setItem(
      "piverse-saved-worlds",
      JSON.stringify([
        ...savedWorlds.filter((w) => w.seed !== metadata.seed),
        metadata,
      ])
    );

    setWorldName("");
    setWorldDescription("");
  };

  const loadSavedWorld = (seed: string) => {
    loadWorld(seed);
    useWorldStore.getState().setPiSegment(seed);
  };

  const shareWorld = (world: WorldMetadata) => {
    const shareData = {
      seed: world.seed,
      name: world.name,
      description: world.description,
      difficulty: world.difficulty,
      features: world.features,
    };

    const shareUrl = `${window.location.origin}${
      window.location.pathname
    }?seed=${world.seed}&name=${encodeURIComponent(world.name)}`;

    if (navigator.share) {
      navigator.share({
        title: `πVerse World: ${world.name}`,
        text: world.description,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("World URL copied to clipboard!");
    }
  };

  const importWorld = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.seed && data.name) {
            setSavedWorlds((prev) => [
              ...prev.filter((w) => w.seed !== data.seed),
              data,
            ]);
            localStorage.setItem(
              "piverse-saved-worlds",
              JSON.stringify([
                ...savedWorlds.filter((w) => w.seed !== data.seed),
                data,
              ])
            );
          }
        } catch (error) {
          alert("Invalid world file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportWorld = (world: WorldMetadata) => {
    const blob = new Blob([JSON.stringify(world, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `piverse-world-${world.name.replace(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSharing = () => {
    setActive(!active);
  };

  return (
    <>
      {/* World Sharing Toggle */}
      <motion.button
        className="absolute top-28 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm"
        onClick={toggleSharing}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        🌍 World Sharing
      </motion.button>

      {/* World Sharing Panel */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute top-32 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-6 text-white max-w-md"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-xl font-semibold mb-4">Save Current World</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">World Name</label>
                  <input
                    type="text"
                    value={worldName}
                    onChange={(e) => setWorldName(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="Enter world name..."
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    value={worldDescription}
                    onChange={(e) => setWorldDescription(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white h-20 resize-none"
                    placeholder="Describe this world..."
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(
                        e.target.value as WorldMetadata["difficulty"]
                      )
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="peaceful">Peaceful</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>

                <motion.button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                  onClick={saveCurrentWorld}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💾 Save World
                </motion.button>
              </div>
            </motion.div>

            {/* Saved Worlds List */}
            <motion.div
              className="absolute top-32 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-6 text-white max-w-md max-h-96 overflow-y-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h3 className="text-xl font-semibold mb-4">Saved Worlds</h3>

              <div className="space-y-3">
                {savedWorlds.map((world) => (
                  <motion.div
                    key={world.seed}
                    className="p-3 bg-gray-700 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{world.name}</h4>
                        <p className="text-xs text-gray-300">
                          {world.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          world.difficulty === "peaceful"
                            ? "bg-green-600"
                            : world.difficulty === "normal"
                            ? "bg-blue-600"
                            : world.difficulty === "hard"
                            ? "bg-yellow-600"
                            : "bg-red-600"
                        }`}
                      >
                        {world.difficulty}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 rounded text-xs"
                        onClick={() => loadSavedWorld(world.seed)}
                      >
                        Load
                      </button>
                      <button
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1 rounded text-xs"
                        onClick={() => shareWorld(world)}
                      >
                        Share
                      </button>
                      <button
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 rounded text-xs"
                        onClick={() => exportWorld(world)}
                      >
                        Export
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <motion.button
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg text-sm"
                  onClick={importWorld}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📁 Import World
                </motion.button>
              </div>
            </motion.div>

            {/* Instructions */}
            <motion.div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="text-center">
                <div>Save, share, and discover worlds with others</div>
                <div className="text-xs text-gray-300 mt-1">
                  Press ESC to exit sharing mode
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
