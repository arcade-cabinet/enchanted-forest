import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface SpiritProps {
  position: { x: number; y: number };
  isDrawing: boolean;
}

const NOTES = ["♪", "♫", "♬", "♩"];
const PULSE_RINGS = ["inner", "middle", "outer"] as const;
const TRAIL_LIMIT = 15;
// Throttle trail appends: a pointermove can fire hundreds of times per second
// but a 50ms cadence is already far denser than the eye reads at this blur.
const TRAIL_MIN_INTERVAL_MS = 50;

export function Spirit({ position, isDrawing }: SpiritProps) {
  const [trail, setTrail] = useState<{ x: number; y: number; id: number; note: string }[]>([]);
  const trailIdRef = useRef(0);
  const lastTrailMsRef = useRef(0);

  useEffect(() => {
    const now =
      typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    if (now - lastTrailMsRef.current < TRAIL_MIN_INTERVAL_MS) return;
    lastTrailMsRef.current = now;
    const id = trailIdRef.current++;
    // Deterministic note choice — avoids Math.random churn on every move.
    const note = NOTES[id % NOTES.length];
    setTrail((prev) => {
      const next = prev.length >= TRAIL_LIMIT ? prev.slice(1) : prev.slice();
      next.push({ x: position.x, y: position.y, id, note });
      return next;
    });
  }, [position]);

  return (
    <>
      {isDrawing &&
        trail.map((pos, i) => (
          <motion.div
            key={pos.id}
            className="fixed pointer-events-none text-amber-300/60"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 0.5, y: -20 }}
            transition={{ duration: 0.8 }}
            style={{
              left: pos.x,
              top: pos.y,
              fontSize: 12 + (i / trail.length) * 12,
              transform: "translate(-50%, -50%)",
              textShadow: "0 0 10px rgba(251, 191, 36, 0.5)",
            }}
          >
            {pos.note}
          </motion.div>
        ))}

      {trail.slice(-8).map((pos, i) => (
        <motion.div
          key={`glow-${pos.id}`}
          className="fixed pointer-events-none rounded-full"
          initial={{ opacity: 0.4, scale: 1 }}
          animate={{ opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.6 }}
          style={{
            left: pos.x,
            top: pos.y,
            width: 8 + (i / 8) * 12,
            height: 8 + (i / 8) * 12,
            background: isDrawing
              ? `radial-gradient(circle, rgba(251, 191, 36, ${0.2 + (i / 8) * 0.3}) 0%, transparent 70%)`
              : `radial-gradient(circle, rgba(180, 230, 255, ${0.2 + (i / 8) * 0.3}) 0%, transparent 70%)`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      <motion.div
        className="fixed pointer-events-none z-50"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          scale: isDrawing ? [1, 1.3, 1] : [1, 1.1, 1],
        }}
        transition={{
          duration: isDrawing ? 0.3 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="absolute rounded-full"
          animate={{
            width: isDrawing ? 80 : 64,
            height: isDrawing ? 80 : 64,
            margin: isDrawing ? -40 : -32,
          }}
          transition={{ duration: 0.2 }}
          style={{
            background: isDrawing
              ? "radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0.1) 40%, transparent 70%)"
              : "radial-gradient(circle, rgba(180, 230, 255, 0.3) 0%, rgba(180, 230, 255, 0.1) 40%, transparent 70%)",
            filter: "blur(4px)",
          }}
        />

        {isDrawing &&
          PULSE_RINGS.map((ring, index) => (
            <motion.div
              key={ring}
              className="absolute rounded-full border-2"
              style={{
                borderColor: "rgba(251, 191, 36, 0.4)",
                left: "50%",
                top: "50%",
              }}
              initial={{ width: 20, height: 20, x: "-50%", y: "-50%", opacity: 0.6 }}
              animate={{
                width: 60,
                height: 60,
                opacity: 0,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.33,
                ease: "easeOut",
              }}
            />
          ))}

        <div
          className="absolute w-10 h-10 -m-5 rounded-full"
          style={{
            background: isDrawing
              ? "radial-gradient(circle, rgba(255, 240, 150, 0.6) 0%, rgba(251, 191, 36, 0.3) 50%, transparent 70%)"
              : "radial-gradient(circle, rgba(200, 240, 255, 0.5) 0%, rgba(150, 200, 255, 0.2) 50%, transparent 70%)",
          }}
        />

        <FireflySpirit isDrawing={isDrawing} />

        {isDrawing &&
          NOTES.map((note, index) => (
            <motion.div
              key={note}
              className="absolute text-amber-200 text-sm font-bold"
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: Math.cos((index * Math.PI) / 2 + Date.now() / 500) * 25,
                y: Math.sin((index * Math.PI) / 2 + Date.now() / 500) * 25 - 10,
                opacity: [0.8, 0.4, 0.8],
                rotate: [0, 15, 0, -15, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
              style={{
                textShadow: "0 0 8px rgba(255, 220, 100, 0.8)",
              }}
            >
              {note}
            </motion.div>
          ))}
      </motion.div>
    </>
  );
}

// Silhouette: body + two translucent wings. Wings flutter faster while drawing
// (the spirit is "singing" the rune).
function FireflySpirit({ isDrawing }: { isDrawing: boolean }) {
  const body = isDrawing ? "#fde68a" : "#e0f2fe";
  const glow = isDrawing ? "rgba(251, 191, 36, 0.9)" : "rgba(191, 219, 254, 0.9)";
  const wing = isDrawing ? "rgba(253, 230, 138, 0.5)" : "rgba(224, 242, 254, 0.45)";
  return (
    <motion.div
      className="-m-4"
      style={{ width: 32, height: 32, filter: `drop-shadow(0 0 8px ${glow})` }}
      animate={{ rotate: isDrawing ? [-4, 4, -4] : [-2, 2, -2] }}
      transition={{ duration: isDrawing ? 0.25 : 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        {/* Left wing */}
        <motion.ellipse
          cx="11"
          cy="13"
          rx="6"
          ry="3"
          fill={wing}
          animate={{
            scaleX: isDrawing ? [0.8, 1.1, 0.8] : [0.9, 1.04, 0.9],
            opacity: [0.45, 0.85, 0.45],
          }}
          transition={{ duration: isDrawing ? 0.22 : 0.9, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "16px 13px" }}
        />
        {/* Right wing */}
        <motion.ellipse
          cx="21"
          cy="13"
          rx="6"
          ry="3"
          fill={wing}
          animate={{
            scaleX: isDrawing ? [0.8, 1.1, 0.8] : [0.9, 1.04, 0.9],
            opacity: [0.45, 0.85, 0.45],
          }}
          transition={{
            duration: isDrawing ? 0.22 : 0.9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.05,
          }}
          style={{ transformOrigin: "16px 13px" }}
        />
        {/* Body — slim oval */}
        <ellipse cx="16" cy="17" rx="2.6" ry="5" fill="#2a1b0e" />
        {/* Abdomen lantern — animated glow */}
        <motion.circle
          cx="16"
          cy="20"
          r="2.2"
          fill={body}
          animate={{ opacity: [0.7, 1, 0.7], r: isDrawing ? [2.4, 3, 2.4] : [2, 2.5, 2] }}
          transition={{
            duration: isDrawing ? 0.35 : 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Head */}
        <circle cx="16" cy="12" r="1.6" fill="#140a04" />
      </svg>
    </motion.div>
  );
}
