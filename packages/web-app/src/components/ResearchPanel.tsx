import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@piverse/game-engine";

export default function ResearchPanel() {
  const [active, setActive] = useState(false);
  const { performanceMetrics, gameMode, setGameMode } = useGameStore();
  const [selectedMetric, setSelectedMetric] = useState<
    "fps" | "memory" | "chunks"
  >("fps");

  const toggleResearchMode = () => {
    const newMode = active ? "exploration" : "research";
    setActive(!active);
    setGameMode(newMode);
  };

  const getAverageFPS = () => {
    if (performanceMetrics.fps.length === 0) return 0;
    return (
      performanceMetrics.fps.reduce((a, b) => a + b, 0) /
      performanceMetrics.fps.length
    );
  };

  const getAverageMemory = () => {
    if (performanceMetrics.memoryUsage.length === 0) return 0;
    return (
      performanceMetrics.memoryUsage.reduce((a, b) => a + b, 0) /
      performanceMetrics.memoryUsage.length
    );
  };

  const getAverageChunks = () => {
    if (performanceMetrics.chunkCount.length === 0) return 0;
    return (
      performanceMetrics.chunkCount.reduce((a, b) => a + b, 0) /
      performanceMetrics.chunkCount.length
    );
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: performanceMetrics,
      averages: {
        fps: getAverageFPS(),
        memory: getAverageMemory(),
        chunks: getAverageChunks(),
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `piverse-research-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case "fps":
        return "#22c55e";
      case "memory":
        return "#f59e0b";
      case "chunks":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case "fps":
        return "FPS";
      case "memory":
        return "Memory (MB)";
      case "chunks":
        return "Chunks";
      default:
        return metric;
    }
  };

  return (
    <>
      {/* Research Mode Toggle */}
      <motion.button
        className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm"
        onClick={toggleResearchMode}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        🔬 Research Mode
      </motion.button>

      {/* Research Panel */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute top-20 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-6 text-white max-w-md"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-xl font-semibold mb-4">
                Performance Research
              </h3>

              {/* Metric Selector */}
              <div className="flex gap-2 mb-4">
                {(["fps", "memory", "chunks"] as const).map((metric) => (
                  <button
                    key={metric}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedMetric === metric
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                    onClick={() => setSelectedMetric(metric)}
                  >
                    {getMetricLabel(metric)}
                  </button>
                ))}
              </div>

              {/* Current Values */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average FPS:</span>
                  <span className="font-mono text-green-400">
                    {getAverageFPS().toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Memory:</span>
                  <span className="font-mono text-yellow-400">
                    {getAverageMemory().toFixed(1)} MB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Chunks:</span>
                  <span className="font-mono text-blue-400">
                    {getAverageChunks().toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Samples:</span>
                  <span className="font-mono text-gray-400">
                    {performanceMetrics.fps.length}
                  </span>
                </div>
              </div>

              {/* Simple Chart */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">
                  Recent {getMetricLabel(selectedMetric)}
                </h4>
                <div className="h-24 bg-gray-800 rounded p-2">
                  <div className="h-full flex items-end gap-1">
                    {performanceMetrics[selectedMetric]
                      .slice(-50)
                      .map((value, i) => {
                        const max = Math.max(
                          ...performanceMetrics[selectedMetric].slice(-50)
                        );
                        const height = (value / max) * 100;
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-t"
                            style={{
                              height: `${height}%`,
                              backgroundColor: getMetricColor(selectedMetric),
                              opacity: 0.7,
                            }}
                          />
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <motion.button
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
                onClick={exportData}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                📊 Export Research Data
              </motion.button>
            </motion.div>

            {/* Algorithm Testing Panel */}
            <motion.div
              className="absolute top-20 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-6 text-white max-w-md"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h3 className="text-xl font-semibold mb-4">Algorithm Testing</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Noise Functions</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                      Perlin Noise (Current)
                    </button>
                    <button className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                      Simplex Noise
                    </button>
                    <button className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                      Ridged Noise
                    </button>
                    <button className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                      π-Based Fractal
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">LOD Strategies</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                      Distance-based (Current)
                    </button>
                    <button className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                      Frustum + Distance
                    </button>
                    <button className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                      Screen-space Error
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Culling Methods</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                      Frustum Culling (Current)
                    </button>
                    <button className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                      Occlusion Culling
                    </button>
                    <button className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                      Hierarchical Z-Buffer
                    </button>
                  </div>
                </div>
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
                <div>
                  Research mode active - Performance data being collected
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Press ESC to exit research mode
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
