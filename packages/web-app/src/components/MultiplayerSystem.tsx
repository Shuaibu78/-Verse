import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGameStore,
  usePlayerStore,
  useWorldStore,
  multiplayerManager,
  type WorldSeed,
  type Player,
  type SharedDiscovery,
} from "@piverse/game-engine";

export default function MultiplayerSystem() {
  const [active, setActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sharedWorlds, setSharedWorlds] = useState<WorldSeed[]>([]);
  const [discoveries, setDiscoveries] = useState<SharedDiscovery[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorld, setSelectedWorld] = useState<WorldSeed | null>(null);

  const { piSegment } = useWorldStore();
  const { x: playerX, z: playerZ } = usePlayerStore();
  const { gameMode, setGameMode } = useGameStore();

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (active && sessionId) {
      // Update player position periodically
      updateIntervalRef.current = setInterval(() => {
        multiplayerManager.updatePlayerPosition(
          sessionId,
          "local-player",
          playerX,
          playerZ
        );
      }, 1000);

      // Fetch nearby discoveries
      multiplayerManager
        .getNearbyDiscoveries(playerX, playerZ, 50)
        .then(setDiscoveries);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [active, sessionId, playerX, playerZ]);

  const toggleMultiplayer = () => {
    setActive(!active);
    setGameMode(active ? "exploration" : "multiplayer");
  };

  const createSession = async () => {
    const session = await multiplayerManager.createSession(
      piSegment,
      "local-player"
    );
    setSessionId(session.id);
    setPlayers(session.players);
  };

  const joinSession = async (targetSessionId: string) => {
    const success = await multiplayerManager.joinSession(
      targetSessionId,
      "local-player",
      "Player"
    );
    if (success) {
      setSessionId(targetSessionId);
      const sessionPlayers = await multiplayerManager.getSessionPlayers(
        targetSessionId
      );
      setPlayers(sessionPlayers);
    }
  };

  const shareCurrentWorld = async () => {
    const world: WorldSeed = {
      seed: piSegment,
      name: `πVerse World ${piSegment.slice(0, 8)}`,
      description: "A procedurally generated world based on π digits",
      difficulty: "normal",
      features: ["procedural", "infinite", "π-based"],
      discoveredBy: "Player",
      sharedBy: "Player",
      createdAt: Date.now(),
      playCount: 0,
      rating: 5,
      tags: ["procedural", "exploration", "mathematical"],
    };

    await multiplayerManager.shareWorld(world);
    loadSharedWorlds();
  };

  const loadSharedWorlds = async () => {
    const worlds = await multiplayerManager.getSharedWorlds();
    setSharedWorlds(worlds);
  };

  const searchWorlds = async () => {
    const results = await multiplayerManager.searchWorlds(searchQuery);
    setSharedWorlds(results);
  };

  const shareDiscovery = async (
    type: SharedDiscovery["type"],
    x: number,
    z: number
  ) => {
    const discovery: Omit<SharedDiscovery, "id" | "sharedAt"> = {
      type,
      x,
      z,
      discoveredBy: "Player",
      description: `Discovered ${type} at coordinates (${x.toFixed(
        1
      )}, ${z.toFixed(1)})`,
      value: Math.floor(Math.random() * 100) + 1,
    };

    await multiplayerManager.shareDiscovery(discovery);
    multiplayerManager
      .getNearbyDiscoveries(playerX, playerZ, 50)
      .then(setDiscoveries);
  };

  useEffect(() => {
    if (active) {
      loadSharedWorlds();
    }
  }, [active]);

  return (
    <>
      {/* Multiplayer Toggle */}
      <motion.button
        className="absolute top-40 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm"
        onClick={toggleMultiplayer}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        🌐 Multiplayer
      </motion.button>

      {/* Multiplayer Panel */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Session Management */}
            <motion.div
              className="absolute top-44 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-6 text-white max-w-md"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-xl font-semibold mb-4">
                Collaboration Session
              </h3>

              {!sessionId ? (
                <div className="space-y-3">
                  <motion.button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                    onClick={createSession}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🚀 Create Session
                  </motion.button>

                  <div className="text-center text-gray-300 text-sm">
                    Or join an existing session
                  </div>

                  <input
                    type="text"
                    placeholder="Session ID"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    onChange={(e) => setSessionId(e.target.value)}
                  />

                  <motion.button
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
                    onClick={() => sessionId && joinSession(sessionId)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🔗 Join Session
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-300">
                    Session: {sessionId}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Players ({players.length})</h4>
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        <span>{player.name}</span>
                        <span className="text-gray-400">
                          ({player.x.toFixed(1)}, {player.z.toFixed(1)})
                        </span>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
                    onClick={() => setSessionId(null)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Leave Session
                  </motion.button>
                </div>
              )}
            </motion.div>

            {/* World Sharing */}
            <motion.div
              className="absolute top-44 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-6 text-white max-w-md max-h-96 overflow-y-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h3 className="text-xl font-semibold mb-4">World Sharing</h3>

              <div className="space-y-3">
                <motion.button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
                  onClick={shareCurrentWorld}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📤 Share Current World
                </motion.button>

                <div>
                  <input
                    type="text"
                    placeholder="Search worlds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                  <motion.button
                    className="w-full mt-2 bg-gray-600 hover:bg-gray-700 text-white py-1 rounded"
                    onClick={searchWorlds}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🔍 Search
                  </motion.button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Shared Worlds</h4>
                  {sharedWorlds.slice(0, 5).map((world) => (
                    <div
                      key={world.seed}
                      className="p-2 bg-gray-700 rounded text-sm"
                    >
                      <div className="font-medium">{world.name}</div>
                      <div className="text-gray-300 text-xs">
                        {world.description}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs">
                          ⭐ {world.rating.toFixed(1)}
                        </span>
                        <span className="text-xs">👥 {world.playCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Shared Discoveries */}
            <motion.div
              className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <h4 className="font-medium mb-2">
                Nearby Discoveries ({discoveries.length})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {discoveries.map((discovery) => (
                  <div
                    key={discovery.id}
                    className="text-xs p-1 bg-gray-700 rounded"
                  >
                    <div className="font-medium">{discovery.type}</div>
                    <div className="text-gray-300">{discovery.description}</div>
                    <div className="text-gray-400">
                      by {discovery.discoveredBy} •{" "}
                      {Math.round((Date.now() - discovery.sharedAt) / 60000)}m
                      ago
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <h4 className="font-medium mb-2">Quick Share</h4>
              <div className="space-y-1">
                <motion.button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-xs"
                  onClick={() =>
                    shareDiscovery("collectible", playerX, playerZ)
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💎 Share Collectible
                </motion.button>
                <motion.button
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-1 rounded text-xs"
                  onClick={() => shareDiscovery("landmark", playerX, playerZ)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🏛️ Share Landmark
                </motion.button>
              </div>
            </motion.div>

            {/* Instructions */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="text-center">
                <div>Collaborate with others in real-time</div>
                <div className="text-xs text-gray-300 mt-1">
                  Press ESC to exit multiplayer mode
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
