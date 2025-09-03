import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HUDFrame({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(true);
  const timer = useRef<number | null>(null);

  const reset = () => {
    setActive(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActive(false), 2500);
  };

  useEffect(() => {
    const onMove = () => reset();
    const onKey = () => reset();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onKey);
    reset();
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0.15 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none"
      >
        <div className="pointer-events-auto">{children}</div>
      </motion.div>
    </AnimatePresence>
  );
}
