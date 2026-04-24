import { isRuntimePaused } from "@/lib/runtimePause";
import { advanceShadowPosition } from "@/sim/corruption";
import type {
  CorruptionShadow,
  ShadowIntentPath,
  TreePosition,
} from "@/sim/grove";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const VAPOR_PARTICLES = Array.from({ length: 12 }, (_, index) => ({
  id: `vapor-particle-${index + 1}`,
  x: Math.cos((index * Math.PI * 2) / 12) * 50,
  y: Math.sin((index * Math.PI * 2) / 12) * 50,
  delay: index * 0.02,
}));
// Each shadow is bucketed into one of these silhouettes by id — the grove
// faces a mix of moths (fast, many) and wisps (slower, larger glow) instead
// of a single generic blob.
type CorruptionKind = "moth" | "wisp";

export type { CorruptionShadow };

interface CorruptionWaveProps {
  shadows: CorruptionShadow[];
  onShadowReachTree: (shadowId: number, treeIndex: number) => void;
  onShadowPurified: (shadowId: number) => void;
  shadowIntents: ShadowIntentPath[];
  treePositions: TreePosition[];
  isPurifying: boolean;
  purifyZone?: { x: number; y: number; radius: number } | null;
}

export function CorruptionWave({
  shadows,
  shadowIntents,
  onShadowReachTree,
  onShadowPurified,
  treePositions,
  purifyZone,
}: CorruptionWaveProps) {
  return (
    <>
      <ShadowIntentTelegraph paths={shadowIntents} />
      <AnimatePresence>
        {shadows.map((shadow) => (
          <CorruptionShadowEntity
            key={shadow.id}
            shadow={shadow}
            treePosition={treePositions[shadow.targetTreeIndex]}
            onReachTree={() => onShadowReachTree(shadow.id, shadow.targetTreeIndex)}
            onPurified={() => onShadowPurified(shadow.id)}
            purifyZone={purifyZone}
          />
        ))}
      </AnimatePresence>
    </>
  );
}

function ShadowIntentTelegraph({ paths }: { paths: ShadowIntentPath[] }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="shadow-intent" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(168, 85, 247, 0)" />
          <stop offset="54%" stopColor="rgba(168, 85, 247, 0.38)" />
          <stop offset="100%" stopColor="rgba(251, 191, 36, 0.5)" />
        </linearGradient>
      </defs>
      {paths.map((path) => (
        <g key={`intent-${path.id}`}>
          <motion.path
            d={`M ${path.fromX} ${path.fromY} C ${path.fromX} ${(path.fromY + path.targetY) / 2}, ${path.targetX} ${(path.fromY + path.targetY) / 2}, ${path.targetX} ${path.targetY}`}
            fill="none"
            stroke="url(#shadow-intent)"
            strokeLinecap="round"
            strokeWidth={0.28 + path.alertLevel * 0.22}
            strokeDasharray="1.2 1.2"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{
              opacity: [0.18, 0.52 + path.alertLevel * 0.28, 0.22],
              pathLength: 1,
            }}
            transition={{ duration: 1.4, repeat: Infinity, delay: (path.id % 5) * 0.08 }}
          />
          <motion.circle
            cx={path.targetX}
            cy={path.targetY}
            r={1.4 + path.alertLevel * 1.4}
            fill="none"
            stroke="rgba(251, 191, 36, 0.55)"
            strokeWidth="0.2"
            initial={{ opacity: 0.2, scale: 0.6 }}
            animate={{ opacity: [0.25, 0.75, 0.25], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: (path.id % 3) * 0.11 }}
          />
        </g>
      ))}
    </svg>
  );
}

interface CorruptionShadowEntityProps {
  shadow: CorruptionShadow;
  treePosition: TreePosition;
  onReachTree: () => void;
  onPurified: () => void;
  purifyZone?: { x: number; y: number; radius: number } | null;
}

function CorruptionShadowEntity({
  shadow,
  treePosition,
  onReachTree,
  onPurified,
  purifyZone,
}: CorruptionShadowEntityProps) {
  const [position, setPosition] = useState({ x: shadow.x, y: shadow.y });
  const [isVaporizing, setIsVaporizing] = useState(false);
  const hasReachedRef = useRef(false);
  const reachTimerRef = useRef<number | null>(null);

  // Stash frequently-changing props in a ref so the 60Hz interval
  // doesn't tear down and rebind every time health/size/speed/intent
  // shifts. Without this, each ForestGame render (which also rebuilt
  // onReachTree identity) re-registered N intervals per frame.
  const shadowRef = useRef(shadow);
  shadowRef.current = shadow;
  const treePositionRef = useRef(treePosition);
  treePositionRef.current = treePosition;
  const onReachTreeRef = useRef(onReachTree);
  onReachTreeRef.current = onReachTree;
  const onPurifiedRef = useRef(onPurified);
  onPurifiedRef.current = onPurified;
  const purifyZoneRef = useRef(purifyZone);
  purifyZoneRef.current = purifyZone;

  useEffect(() => {
    if (isVaporizing) return undefined;

    if (purifyZone) {
      const dx = position.x - purifyZone.x;
      const dy = position.y - purifyZone.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < purifyZone.radius) {
        setIsVaporizing(true);
        const timer = window.setTimeout(() => onPurifiedRef.current(), 560);
        return () => window.clearTimeout(timer);
      }
    }
    return undefined;
  }, [purifyZone, position, isVaporizing]);

  // Mount the movement interval exactly once per shadow (keyed by
  // shadow.id above via AnimatePresence). All other scalar props
  // are read via refs so this effect never re-subscribes mid-life.
  useEffect(() => {
    if (isVaporizing) return undefined;
    const interval = setInterval(() => {
      if (isRuntimePaused()) return;
      setPosition((prev) => {
        const current = shadowRef.current;
        const next = advanceShadowPosition(
          {
            id: current.id,
            x: prev.x,
            y: prev.y,
            targetTreeIndex: current.targetTreeIndex,
            health: current.health,
            maxHealth: current.maxHealth,
            speed: current.speed,
            size: current.size,
          },
          treePositionRef.current
        );
        if (next.reached) {
          if (!hasReachedRef.current) {
            hasReachedRef.current = true;
            reachTimerRef.current = window.setTimeout(() => {
              reachTimerRef.current = null;
              onReachTreeRef.current();
            }, 0);
          }
          return prev;
        }
        return { x: next.x, y: next.y };
      });
    }, 16);
    return () => {
      clearInterval(interval);
      if (reachTimerRef.current !== null) {
        window.clearTimeout(reachTimerRef.current);
        reachTimerRef.current = null;
      }
    };
  }, [isVaporizing]);

  if (isVaporizing) {
    return (
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        initial={{ scale: 1, opacity: 1 }}
        animate={{
          scale: [1, 1.5, 0],
          opacity: [1, 0.5, 0],
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="absolute inset-0 -m-10 rounded-full"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: "radial-gradient(circle, rgba(251, 191, 36, 0.8) 0%, transparent 70%)",
          }}
        />
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 -top-8 text-amber-400 text-xl font-black whitespace-nowrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 0], y: -20 }}
          transition={{ duration: 0.5 }}
          style={{ textShadow: "0 0 10px rgba(251, 191, 36, 0.8)" }}
        >
          浄化!
        </motion.div>
        {VAPOR_PARTICLES.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-amber-400 rounded-full"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: particle.x,
              y: particle.y,
              opacity: 0,
              scale: [1, 0],
            }}
            transition={{ duration: 0.5, delay: particle.delay }}
            style={{
              boxShadow: "0 0 8px rgba(251, 191, 36, 0.8)",
            }}
          />
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute rounded-full"
        style={{
          width: shadow.size * 3,
          height: shadow.size * 3,
          left: -shadow.size * 1.5,
          top: -shadow.size * 1.5,
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(75, 0, 130, 0.4) 0%, rgba(50, 0, 80, 0.2) 50%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
      </motion.div>
      <CorruptionCreature shadow={shadow} />
    </motion.div>
  );
}

function getKindFor(id: number): CorruptionKind {
  return id % 3 === 0 ? "wisp" : "moth";
}

function CorruptionCreature({ shadow }: { shadow: CorruptionShadow }) {
  const kind = getKindFor(shadow.id);
  const bob = 0.8 + (shadow.id % 5) * 0.08;

  return (
    <motion.div
      className="relative"
      style={{ width: shadow.size, height: shadow.size }}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: bob, repeat: Infinity, ease: "easeInOut" }}
    >
      {kind === "moth" ? <MothSilhouette size={shadow.size} /> : <WispSilhouette size={shadow.size} />}
    </motion.div>
  );
}

function MothSilhouette({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      style={{
        filter: "drop-shadow(0 0 6px rgba(120, 80, 170, 0.55))",
        transform: "translate(-50%, -50%)",
        position: "absolute",
        left: "50%",
        top: "50%",
      }}
    >
      <defs>
        <radialGradient id="moth-wing" cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor="rgba(110, 70, 140, 0.85)" />
          <stop offset="65%" stopColor="rgba(60, 30, 90, 0.9)" />
          <stop offset="100%" stopColor="rgba(20, 6, 40, 0.95)" />
        </radialGradient>
      </defs>
      {/* Antennae */}
      <path
        d="M 18 12 Q 14 6 10 6"
        stroke="#1a0a2a"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 22 12 Q 26 6 30 6"
        stroke="#1a0a2a"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
      />
      {/* Left wing (upper + lower lobe) */}
      <motion.g
        animate={{ scaleX: [0.9, 1.05, 0.9] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "20px 22px" }}
      >
        <path
          d="M 20 18 Q 6 14 2 22 Q 4 30 20 26 Z"
          fill="url(#moth-wing)"
        />
        <path d="M 20 22 Q 10 26 8 32 Q 16 32 20 28 Z" fill="rgba(40, 16, 70, 0.9)" />
      </motion.g>
      {/* Right wing */}
      <motion.g
        animate={{ scaleX: [0.9, 1.05, 0.9] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.05 }}
        style={{ transformOrigin: "20px 22px" }}
      >
        <path d="M 20 18 Q 34 14 38 22 Q 36 30 20 26 Z" fill="url(#moth-wing)" />
        <path d="M 20 22 Q 30 26 32 32 Q 24 32 20 28 Z" fill="rgba(40, 16, 70, 0.9)" />
      </motion.g>
      {/* Body */}
      <ellipse cx="20" cy="22" rx="1.6" ry="6" fill="#0e0418" />
      {/* Eyes — two red points, menace without gore */}
      <circle cx="18.5" cy="13" r="0.9" fill="#ef4444" />
      <circle cx="21.5" cy="13" r="0.9" fill="#ef4444" />
    </svg>
  );
}

function WispSilhouette({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size * 1.05}
      height={size * 1.05}
      aria-hidden="true"
      style={{
        filter: "drop-shadow(0 0 10px rgba(130, 80, 180, 0.7))",
        transform: "translate(-50%, -50%)",
        position: "absolute",
        left: "50%",
        top: "50%",
      }}
    >
      <defs>
        <radialGradient id="wisp-core" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="rgba(160, 100, 200, 0.85)" />
          <stop offset="70%" stopColor="rgba(70, 30, 110, 0.8)" />
          <stop offset="100%" stopColor="rgba(20, 5, 40, 0.95)" />
        </radialGradient>
      </defs>
      {/* Outer halo */}
      <motion.circle
        cx="20"
        cy="22"
        r="16"
        fill="rgba(120, 70, 180, 0.18)"
        animate={{ r: [15, 17, 15], opacity: [0.12, 0.28, 0.12] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Trailing tendrils — wavering from below */}
      <motion.path
        d="M 13 28 Q 12 34 10 38 M 20 30 Q 20 36 18 40 M 27 28 Q 28 34 30 38"
        stroke="rgba(90, 50, 140, 0.85)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        animate={{ opacity: [0.6, 0.9, 0.6], pathLength: [0.7, 1, 0.7] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Core orb */}
      <circle cx="20" cy="20" r="9" fill="url(#wisp-core)" />
      {/* Single eye slit */}
      <motion.path
        d="M 15 19 Q 20 17 25 19"
        stroke="#f2c14e"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
