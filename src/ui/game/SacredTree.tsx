import type { RuneType } from "@/sim/grove";
import { cn } from "@/lib/utils";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const HEALING_PARTICLES = Array.from({ length: 8 }, (_, index) => ({
  id: `healing-particle-${index + 1}`,
  left: `${30 + ((index * 11) % 40)}%`,
  rise: -80 - ((index * 13) % 40),
  drift: ((index * 17) % 30) - 15,
  delay: index * 0.1,
}));
const RITUAL_COLORS: Record<RuneType, string> = {
  heal: "#a78bfa",
  purify: "#fbbf24",
  shield: "#4ade80",
};

interface SacredTreeProps {
  id: number;
  health: number;
  maxHealth: number;
  isShielded: boolean;
  position: { x: number; y: number; canopyScale?: number };
  isTargeted?: boolean;
  isHealing?: boolean;
  isRitualTarget?: boolean;
  ritualRune?: RuneType | null;
}

export function SacredTree({
  id,
  health,
  maxHealth,
  isShielded,
  position,
  isTargeted = false,
  isHealing = false,
  isRitualTarget = false,
  ritualRune = null,
}: SacredTreeProps) {
  const healthPercent = (health / maxHealth) * 100;
  const isDamaged = healthPercent < 70;
  const isCritical = healthPercent < 30;
  const prevHealthRef = useRef(health);
  const [showDamage, setShowDamage] = useState(false);
  const [damageAmount, setDamageAmount] = useState(0);
  const controls = useAnimationControls();
  const ritualColor = ritualRune ? RITUAL_COLORS[ritualRune] : "#fbbf24";

  const treeNames = ["First Elder", "Heart Tree", "Third Elder"];

  useEffect(() => {
    if (health < prevHealthRef.current) {
      const damage = prevHealthRef.current - health;
      setDamageAmount(damage);
      setShowDamage(true);

      controls.start({
        x: [0, -10, 10, -5, 5, 0],
        transition: { duration: 0.4 },
      });

      setTimeout(() => setShowDamage(false), 800);
    }
    prevHealthRef.current = health;
  }, [health, controls]);

  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -100%) scale(${position.canopyScale ?? 1})`,
        zIndex: 12,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.55, delay: id * 0.04 }}
    >
      {showDamage && (
        <motion.div
          className="absolute -top-8 left-1/2 z-20 pointer-events-none"
          initial={{ opacity: 0, y: 0, scale: 1.5, x: "-50%" }}
          animate={{ opacity: [1, 1, 0], y: -40, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div
            className="text-3xl font-black text-red-500 whitespace-nowrap"
            style={{
              textShadow: "0 0 10px rgba(239, 68, 68, 0.8), 2px 2px 0 #000, -2px -2px 0 #000",
              WebkitTextStroke: "1px black",
            }}
          >
            -{damageAmount}
          </div>
        </motion.div>
      )}

      {showDamage && (
        <motion.div
          className="absolute inset-0 -m-4 rounded-full pointer-events-none"
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: "radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, transparent 70%)",
          }}
        />
      )}

      {isRitualTarget && ritualRune && (
        <motion.div
          className="absolute inset-0 -m-12 pointer-events-none"
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: [0.35, 0.92, 0.35], scale: [0.94, 1.08, 0.94] }}
          transition={{ duration: ritualRune === "shield" ? 1.1 : 1.45, repeat: Infinity }}
        >
          <svg aria-hidden="true" viewBox="0 0 100 100" className="h-full w-full">
            <motion.circle
              cx="50"
              cy="54"
              r="42"
              fill="none"
              stroke={ritualColor}
              strokeDasharray={ritualRune === "heal" ? "2 2" : "5 2"}
              strokeWidth="2.5"
              style={{ filter: `drop-shadow(0 0 8px ${ritualColor})` }}
            />
            <motion.path
              d="M 50 12 L 58 42 L 88 50 L 58 58 L 50 88 L 42 58 L 12 50 L 42 42 Z"
              fill="none"
              stroke={ritualColor}
              strokeOpacity="0.72"
              strokeWidth="1.4"
              animate={{ rotate: ritualRune === "purify" ? [0, 8, 0] : [0, -5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </svg>
        </motion.div>
      )}

      {isShielded && (
        <>
          <motion.div
            className="absolute inset-0 -m-10 pointer-events-none"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <svg aria-hidden="true" viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <filter id={`shieldGlow-${id}`}>
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <motion.polygon
                points="50,5 95,25 95,75 50,95 5,75 5,25"
                fill="none"
                stroke="rgba(74, 222, 128, 0.6)"
                strokeWidth="2"
                filter={`url(#shieldGlow-${id})`}
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </svg>
          </motion.div>

          <motion.div
            className="absolute inset-0 -m-8 rounded-full"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              background:
                "radial-gradient(circle, rgba(74, 222, 128, 0.3) 0%, rgba(74, 222, 128, 0.1) 50%, transparent 70%)",
              boxShadow: "0 0 30px rgba(74, 222, 128, 0.5)",
            }}
          />

          <motion.div
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-emerald-400 text-sm font-bold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0.5, 1, 0.5], y: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ textShadow: "0 0 10px rgba(74, 222, 128, 0.8)" }}
          >
            守護中
          </motion.div>
        </>
      )}

      {isHealing && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {HEALING_PARTICLES.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: particle.left,
                bottom: 0,
                background: "linear-gradient(45deg, #a78bfa, #c4b5fd)",
                boxShadow: "0 0 10px rgba(167, 139, 250, 0.8)",
              }}
              initial={{ y: 0, opacity: 1, scale: 1 }}
              animate={{
                y: particle.rise,
                opacity: [1, 1, 0],
                scale: [1, 0.5],
                x: particle.drift,
              }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                repeat: 2,
              }}
            />
          ))}

          <motion.div
            className="absolute -top-4 left-1/2 -translate-x-1/2 text-violet-400 font-bold"
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: [0, 1, 0], scale: 1, y: -20 }}
            transition={{ duration: 1 }}
            style={{ textShadow: "0 0 10px rgba(167, 139, 250, 0.8)" }}
          >
            回復!
          </motion.div>
        </motion.div>
      )}

      <motion.div
        className={cn(
          "relative transition-all duration-300",
          isDamaged && "hue-rotate-30",
          isCritical && "hue-rotate-60 saturate-50"
        )}
        animate={controls}
      >
        {isCritical && (
          <motion.div
            className="absolute inset-0 -m-4 rounded-full"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              background: "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)",
            }}
          />
        )}

        {isTargeted && (
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2"
            animate={{
              opacity: [0.5, 1, 0.5],
              y: [0, -5, 0],
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <div
              className="text-red-500 text-2xl font-black"
              style={{ textShadow: "0 0 10px rgba(239, 68, 68, 0.8)" }}
            >
              ⚠
            </div>
          </motion.div>
        )}

        <svg
          aria-hidden="true"
          width="60"
          height="120"
          viewBox="0 0 60 120"
          className="drop-shadow-lg"
        >
          <path
            d="M25 120 L25 70 Q20 60 25 50 L25 50 Q30 45 30 40 Q30 45 35 50 L35 50 Q40 60 35 70 L35 120"
            fill={isCritical ? "#4a3728" : "#5d4037"}
          />

          <ellipse
            cx="30"
            cy="40"
            rx="28"
            ry="20"
            fill={isCritical ? "#4a5d23" : "#2d5a27"}
            opacity="0.9"
          />
          <ellipse
            cx="30"
            cy="30"
            rx="24"
            ry="18"
            fill={isCritical ? "#5a6d33" : "#3d7a37"}
            opacity="0.95"
          />
          <ellipse cx="30" cy="22" rx="18" ry="14" fill={isCritical ? "#6a7d43" : "#4d9a47"} />

          <g opacity={healthPercent / 100} filter={`url(#treeGlow-${id})`}>
            <circle cx="30" cy="65" r="2" fill="#a78bfa" />
            <circle cx="27" cy="75" r="1.5" fill="#a78bfa" />
            <circle cx="33" cy="75" r="1.5" fill="#a78bfa" />
            <path d="M28 80 L32 80 L30 85 Z" fill="#a78bfa" />
          </g>

          <defs>
            <filter id={`treeGlow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full blur-sm"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            background: `radial-gradient(ellipse, rgba(167, 139, 250, ${healthPercent / 200}) 0%, transparent 70%)`,
          }}
        />
      </motion.div>

      <div className="mt-2 relative">
        <div
          className="w-20 h-3 bg-black/70 overflow-hidden border-2"
          style={{
            borderColor: isCritical
              ? "rgba(239, 68, 68, 0.5)"
              : isDamaged
                ? "rgba(245, 158, 11, 0.3)"
                : "rgba(255, 255, 255, 0.2)",
            clipPath: "polygon(5% 0, 100% 0, 95% 100%, 0% 100%)",
          }}
        >
          <motion.div
            className={cn(
              "h-full transition-colors duration-300",
              isCritical
                ? "bg-gradient-to-r from-red-600 to-red-400"
                : isDamaged
                  ? "bg-gradient-to-r from-amber-600 to-amber-400"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-400"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${healthPercent}%` }}
            transition={{ type: "spring", stiffness: 100 }}
            style={{
              boxShadow: isCritical
                ? "0 0 8px rgba(239, 68, 68, 0.5)"
                : isDamaged
                  ? "0 0 8px rgba(245, 158, 11, 0.5)"
                  : "0 0 8px rgba(16, 185, 129, 0.5)",
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          </motion.div>
        </div>

        <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/80">
          {Math.ceil(health)}
        </div>
      </div>

      <div
        className="mt-1 text-xs font-bold tracking-wider"
        style={{
          color: isCritical ? "#f87171" : "#fcd34d",
          textShadow: isCritical ? "0 0 5px rgba(239, 68, 68, 0.5)" : "none",
        }}
      >
        {treeNames[id]}
      </div>
    </motion.div>
  );
}
