import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, useWorldStore } from "@piverse/game-engine";

export default function GameHUD() {
  const { stats, objectives, gameMode } = useGameStore();
  const { piSegment } = useWorldStore();

  const getHealthColor = () => {
    const ratio = stats.health / stats.maxHealth;
    if (ratio > 0.6) return "#22c55e";
    if (ratio > 0.3) return "#f59e0b";
    return "#ef4444";
  };

  const getEnergyColor = () => {
    const ratio = stats.energy / stats.maxEnergy;
    if (ratio > 0.6) return "#3b82f6";
    if (ratio > 0.3) return "#f59e0b";
    return "#ef4444";
  };

  const getHungerColor = () => {
    const ratio = stats.hunger / stats.maxHunger;
    if (ratio > 0.6) return "#8b5cf6";
    if (ratio > 0.3) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Status Bar */}
      <motion.div
        className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Level {stats.level}</span>
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${(stats.experience % 1000) / 10}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs">❤️</span>
            <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: getHealthColor() }}
                initial={{ width: 0 }}
                animate={{
                  width: `${(stats.health / stats.maxHealth) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs">{Math.round(stats.health)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs">⚡</span>
            <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: getEnergyColor() }}
                initial={{ width: 0 }}
                animate={{
                  width: `${(stats.energy / stats.maxEnergy) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs">{Math.round(stats.energy)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs">🍎</span>
            <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: getHungerColor() }}
                initial={{ width: 0 }}
                animate={{
                  width: `${(stats.hunger / stats.maxHunger) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs">{Math.round(stats.hunger)}</span>
          </div>
        </div>
      </motion.div>

      {/* Objectives Panel */}
      <AnimatePresence>
        {objectives.length > 0 && (
          <motion.div
            className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white max-w-xs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-semibold mb-2">Objectives</h3>
            <div className="space-y-2">
              {objectives.slice(0, 3).map((obj) => (
                <motion.div
                  key={obj.id}
                  className={`p-2 rounded text-xs ${
                    obj.completed ? "bg-green-500/20" : "bg-gray-700/20"
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="font-medium">{obj.title}</div>
                  <div className="text-gray-300">{obj.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(obj.current / obj.target) * 100}%`,
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs">
                      {obj.current}/{obj.target}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Mode Indicator */}
      <motion.div
        className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              gameMode === "exploration"
                ? "bg-green-500"
                : gameMode === "survival"
                ? "bg-red-500"
                : gameMode === "research"
                ? "bg-blue-500"
                : gameMode === "multiplayer"
                ? "bg-yellow-500"
                : "bg-purple-500"
            }`}
          />
          <span className="capitalize">{gameMode} Mode</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          Discoveries: {stats.discoveries} | Distance:{" "}
          {Math.round(stats.distanceTraveled)}m
        </div>
      </motion.div>

      {/* World Info */}
      <motion.div
        className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div>World Seed: {piSegment.slice(0, 8)}...</div>
        <div>Time Survived: {Math.round(stats.timeSurvived / 60)}m</div>
      </motion.div>
    </div>
  );
}
