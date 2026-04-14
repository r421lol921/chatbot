"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export const Greeting = () => {
  const orbRef = useRef<HTMLDivElement>(null);

  // Animate the orb continuously with a pulsing grey shimmer
  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.012;
      const scale = 1 + Math.sin(t) * 0.06;
      const opacity = 0.18 + Math.sin(t * 1.3) * 0.06;
      orb.style.transform = `scale(${scale})`;
      orb.style.opacity = String(opacity);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex flex-col items-center px-4" key="overview">
      {/* Animated orb behind the text */}
      <div className="relative flex flex-col items-center">
        <div
          ref={orbRef}
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 size-32 rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0 0 / 0.25) 0%, oklch(0.6 0 0 / 0.08) 60%, transparent 100%)",
            filter: "blur(18px)",
          }}
        />
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center font-semibold text-2xl tracking-tight text-foreground md:text-3xl"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Hi, I&apos;m Lio
        </motion.div>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-muted-foreground/80 text-sm"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Ask a question, write code, or explore ideas.
        </motion.div>
      </div>
    </div>
  );
};
