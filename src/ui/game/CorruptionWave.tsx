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
const SHADOW_DROPLETS = Array.from({ length: 3 }, (_, index) => ({
  id: `shadow-droplet-${index + 1}`,
  index,
}));
const SHADOW_TENDRILS = Array.from({ length: 3 }, (_, index) => ({
  id: `shadow-tendril-${index + 1}`,
  index,
}));

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

  useEffect(() => {
    if (isVaporizing) return undefined;

    if (purifyZone) {
      const dx = position.x - purifyZone.x;
      const dy = position.y - purifyZone.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < purifyZone.radius) {
        setIsVaporizing(true);
        const timer = window.setTimeout(onPurified, 560);
        return () => window.clearTimeout(timer);
      }
    }
    return undefined;
  }, [purifyZone, position, onPurified, isVaporizing]);

  useEffect(() => {
    if (isVaporizing) return undefined;
    const interval = setInterval(() => {
      if (isRuntimePaused()) return;
      setPosition((prev) => {
        const next = advanceShadowPosition(
          {
            id: shadow.id,
            x: prev.x,
            y: prev.y,
            targetTreeIndex: shadow.targetTreeIndex,
            health: shadow.health,
            maxHealth: shadow.maxHealth,
            speed: shadow.speed,
            size: shadow.size,
          },
          treePosition
        );
        if (next.reached) {
          if (!hasReachedRef.current) {
            hasReachedRef.current = true;
            window.setTimeout(onReachTree, 0);
          }
          return prev;
        }
        return { x: next.x, y: next.y };
      });
    }, 16);
    return () => clearInterval(interval);
  }, [
    treePosition,
    shadow.id,
    shadow.targetTreeIndex,
    shadow.health,
    shadow.maxHealth,
    shadow.speed,
    shadow.size,
    onReachTree,
    isVaporizing,
  ]);

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
      <motion.div
        className="relative"
        animate={{
          y: [0, -3, 0],
        }}
        transition={{
          duration: 0.8 + (shadow.id % 5) * 0.08,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div
          className="rounded-full relative overflow-hidden"
          style={{
            width: shadow.size,
            height: shadow.size,
            background:
              "radial-gradient(ellipse at 30% 30%, rgba(120, 50, 150, 0.9) 0%, rgba(60, 20, 80, 0.95) 50%, rgba(30, 5, 50, 1) 100%)",
            boxShadow: `
              0 0 ${shadow.size / 2}px rgba(100, 40, 120, 0.6),
              inset 0 -${shadow.size / 4}px ${shadow.size / 3}px rgba(0, 0, 0, 0.5),
              inset 0 ${shadow.size / 6}px ${shadow.size / 4}px rgba(150, 80, 180, 0.3)
            `,
          }}
        >
          <div
            className="absolute w-2 h-2 rounded-full bg-purple-300/50"
            style={{
              top: shadow.size * 0.15,
              left: shadow.size * 0.25,
            }}
          />
        </div>
        <div
          className="absolute flex gap-1"
          style={{
            left: shadow.size * 0.18,
            top: shadow.size * 0.22,
          }}
        >
          <motion.div
            className="relative"
            animate={{ scaleY: [1, 0.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <div
              className="w-2 h-2.5 bg-red-500 rounded-full"
              style={{
                boxShadow: "0 0 8px rgba(239, 68, 68, 0.9)",
              }}
            />
            <div className="absolute w-1 h-1 bg-white rounded-full top-0.5 left-0.5 opacity-60" />
          </motion.div>
          <motion.div
            className="relative"
            animate={{ scaleY: [1, 0.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.1 }}
          >
            <div
              className="w-2 h-2.5 bg-red-500 rounded-full"
              style={{
                boxShadow: "0 0 8px rgba(239, 68, 68, 0.9)",
              }}
            />
            <div className="absolute w-1 h-1 bg-white rounded-full top-0.5 left-0.5 opacity-60" />
          </motion.div>
        </div>
        {SHADOW_DROPLETS.map(({ id, index }) => (
          <motion.div
            key={id}
            className="absolute w-1.5 h-1.5 rounded-full bg-purple-800"
            style={{
              left: shadow.size * 0.3 + index * 8,
              bottom: -5,
            }}
            animate={{
              y: [-5, -15, -5],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 1 + index * 0.3,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
        {SHADOW_TENDRILS.map(({ id, index }) => (
          <motion.div
            key={id}
            className="absolute bg-gradient-to-t from-purple-900/80 to-transparent rounded-full"
            style={{
              width: 4,
              height: shadow.size * 0.5,
              left: shadow.size * 0.3 + index * (shadow.size * 0.2),
              top: shadow.size * -0.3,
              transformOrigin: "bottom center",
            }}
            animate={{
              rotate: [-10 + index * 10, 10 + index * 10, -10 + index * 10],
              scaleY: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.2 + index * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
      <motion.div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-purple-300/70 font-bold whitespace-nowrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        闇の影
      </motion.div>
    </motion.div>
  );
}
