import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@piverse/game-engine";

export default function PhotoMode() {
  const [active, setActive] = useState(false);
  const [settings, setSettings] = useState({
    exposure: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    blur: 0,
    vignette: 0,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const captureScreenshot = useCallback(async () => {
    if (!canvasRef.current) return;

    // Get the WebGL canvas from the DOM
    const webglCanvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!webglCanvas) return;

    // Get image data
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match WebGL canvas
    canvas.width = webglCanvas.width;
    canvas.height = webglCanvas.height;

    // Copy WebGL canvas to 2D canvas
    ctx.drawImage(webglCanvas, 0, 0);

    // Apply post-processing effects
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Exposure
      data[i] = Math.min(255, data[i] * settings.exposure);
      data[i + 1] = Math.min(255, data[i + 1] * settings.exposure);
      data[i + 2] = Math.min(255, data[i + 2] * settings.exposure);

      // Contrast
      const factor =
        (259 * (settings.contrast * 255 + 255)) /
        (255 * (259 - settings.contrast * 255));
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(
        255,
        Math.max(0, factor * (data[i + 1] - 128) + 128)
      );
      data[i + 2] = Math.min(
        255,
        Math.max(0, factor * (data[i + 2] - 128) + 128)
      );
    }

    ctx.putImageData(imageData, 0, 0);

    // Download
    const link = document.createElement("a");
    link.download = `piverse-screenshot-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [settings]);

  const togglePhotoMode = () => {
    setActive(!active);
    useGameStore.getState().setGameMode(active ? "exploration" : "photo");
  };

  return (
    <>
      {/* Photo Mode Toggle */}
      <motion.button
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm"
        onClick={togglePhotoMode}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        📸 Photo Mode
      </motion.button>

      {/* Photo Mode Overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Settings Panel */}
            <motion.div
              className="absolute top-20 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-semibold mb-4">Photo Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Exposure</label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={settings.exposure}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        exposure: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                  <span className="text-xs text-gray-300">
                    {settings.exposure.toFixed(1)}
                  </span>
                </div>

                <div>
                  <label className="block text-sm mb-1">Contrast</label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={settings.contrast}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        contrast: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                  <span className="text-xs text-gray-300">
                    {settings.contrast.toFixed(1)}
                  </span>
                </div>

                <div>
                  <label className="block text-sm mb-1">Saturation</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.saturation}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        saturation: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                  <span className="text-xs text-gray-300">
                    {settings.saturation.toFixed(1)}
                  </span>
                </div>
              </div>

              <motion.button
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                onClick={captureScreenshot}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                📸 Capture Screenshot
              </motion.button>
            </motion.div>

            {/* Crosshair */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 border-2 border-white/50 rounded-full">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full" />
              </div>
            </div>

            {/* Instructions */}
            <motion.div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="text-center">
                <div>Adjust settings and click Capture Screenshot</div>
                <div className="text-xs text-gray-300 mt-1">
                  Press ESC to exit photo mode
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
