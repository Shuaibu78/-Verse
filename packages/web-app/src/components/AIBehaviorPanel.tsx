import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGameStore,
  useWorldStore,
  AIBehaviorSystem,
  type BehaviorEvent,
  type EmergentPattern,
} from "@piverse/game-engine";

export default function AIBehaviorPanel() {
  const [active, setActive] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState<string | null>(null);
  const [behaviorSystem, setBehaviorSystem] = useState<AIBehaviorSystem | null>(
    null
  );
  const [events, setEvents] = useState<BehaviorEvent[]>([]);
  const [patterns, setPatterns] = useState<EmergentPattern[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  const { piSegment } = useWorldStore();
  const { gameMode, setGameMode } = useGameStore();

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (active) {
      // Initialize AI behavior system
      const system = new AIBehaviorSystem(piSegment);
      setBehaviorSystem(system);

      // Update behavior data every 2 seconds
      updateIntervalRef.current = setInterval(() => {
        if (system) {
          setEvents(system.getRecentEvents(selectedCreature || undefined, 20));
          setPatterns(system.getActivePatterns());
          setStatistics(system.getBehaviorStatistics());
        }
      }, 2000);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [active, piSegment, selectedCreature]);

  const toggleAIStudy = () => {
    setActive(!active);
    setGameMode(active ? "exploration" : "research");
  };

  const exportBehaviorData = () => {
    if (!behaviorSystem) return;

    const data = {
      timestamp: new Date().toISOString(),
      piSegment,
      events: behaviorSystem.getRecentEvents(undefined, 100),
      patterns: behaviorSystem.getActivePatterns(),
      statistics: behaviorSystem.getBehaviorStatistics(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `piverse-ai-behavior-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getEventTypeColor = (type: BehaviorEvent["type"]) => {
    switch (type) {
      case "interaction":
        return "#3b82f6";
      case "hunting":
        return "#ef4444";
      case "fleeing":
        return "#f59e0b";
      case "exploring":
        return "#10b981";
      case "resting":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getPatternTypeColor = (type: EmergentPattern["type"]) => {
    switch (type) {
      case "flocking":
        return "#3b82f6";
      case "territorial":
        return "#ef4444";
      case "hunting_pack":
        return "#f59e0b";
      case "migration":
        return "#10b981";
      case "competition":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  return (
    <>
      {/* AI Study Toggle */}
      <motion.button
        className="absolute top-52 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm"
        onClick={toggleAIStudy}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        🤖 AI Behavior Study
      </motion.button>

      {/* AI Study Panel */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Behavior Statistics */}
            <motion.div
              className="absolute top-56 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-6 text-white max-w-md"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-xl font-semibold mb-4">
                Behavior Statistics
              </h3>

              {statistics && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-300">Total Creatures</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {statistics.totalCreatures}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-300">Avg Intelligence</div>
                      <div className="text-2xl font-bold text-green-400">
                        {(statistics.averageIntelligence * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-300">Avg Social Level</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(statistics.averageSocialLevel * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-300">Active Patterns</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {statistics.activePatterns}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-sm text-gray-300">
                      Recent Interactions (1min)
                    </div>
                    <div className="text-lg font-bold text-orange-400">
                      {statistics.recentInteractions}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Emergent Patterns */}
            <motion.div
              className="absolute top-56 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-6 text-white max-w-md max-h-80 overflow-y-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h3 className="text-xl font-semibold mb-4">Emergent Patterns</h3>

              <div className="space-y-3">
                {patterns.map((pattern) => (
                  <motion.div
                    key={pattern.id}
                    className="p-3 bg-gray-700 rounded-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: getPatternTypeColor(pattern.type),
                        }}
                      />
                      <span className="font-medium capitalize">
                        {pattern.type.replace("_", " ")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {Math.round(pattern.duration / 1000)}s
                      </span>
                    </div>

                    <div className="text-sm text-gray-300 mb-2">
                      Participants: {pattern.participants.length}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full"
                          style={{
                            backgroundColor: getPatternTypeColor(pattern.type),
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pattern.strength * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {(pattern.strength * 100).toFixed(0)}%
                      </span>
                    </div>
                  </motion.div>
                ))}

                {patterns.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    No active patterns detected
                  </div>
                )}
              </div>
            </motion.div>

            {/* Behavior Events */}
            <motion.div
              className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Recent Behavior Events</h4>
                <motion.button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  onClick={exportBehaviorData}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📊 Export Data
                </motion.button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    className="flex items-center gap-3 p-2 bg-gray-700 rounded text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getEventTypeColor(event.type) }}
                    />
                    <div className="flex-1">
                      <div className="font-medium capitalize">{event.type}</div>
                      <div className="text-xs text-gray-300">
                        {event.creatureId} → {event.targetId || "environment"}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{event.outcome}</div>
                    <div className="text-xs text-gray-400">
                      {Math.round((Date.now() - event.timestamp) / 1000)}s ago
                    </div>
                  </motion.div>
                ))}

                {events.length === 0 && (
                  <div className="text-center text-gray-400 py-4">
                    No recent events
                  </div>
                )}
              </div>
            </motion.div>

            {/* Pattern Visualization */}
            <motion.div
              className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <h4 className="font-medium mb-3">Pattern Strength</h4>

              <div className="space-y-2">
                {patterns.slice(0, 3).map((pattern) => (
                  <div key={pattern.id} className="flex items-center gap-2">
                    <div className="w-16 text-xs capitalize">
                      {pattern.type.replace("_", " ")}
                    </div>
                    <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full"
                        style={{
                          backgroundColor: getPatternTypeColor(pattern.type),
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pattern.strength * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="w-8 text-xs text-gray-400">
                      {(pattern.strength * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
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
                <div>AI Behavior Study Active</div>
                <div className="text-xs text-gray-300 mt-1">
                  Press ESC to exit AI study mode
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
