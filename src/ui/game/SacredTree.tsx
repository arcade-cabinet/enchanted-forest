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
  const damageTimerRef = useRef<number | null>(null);
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

      if (damageTimerRef.current !== null) {
        window.clearTimeout(damageTimerRef.current);
      }
      damageTimerRef.current = window.setTimeout(() => {
        setShowDamage(false);
        damageTimerRef.current = null;
      }, 800);
    }
    prevHealthRef.current = health;
  }, [health, controls]);

  useEffect(() => {
    return () => {
      if (damageTimerRef.current !== null) {
        window.clearTimeout(damageTimerRef.current);
        damageTimerRef.current = null;
      }
      controls.stop();
    };
  }, [controls]);

  return (
    <motion.div
      data-testid={`tree-${id}`}
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

        <SacredTreeBody
          id={id}
          healthPercent={healthPercent}
          isCritical={isCritical}
          isDamaged={isDamaged}
        />

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

interface SacredTreeBodyProps {
  id: number;
  healthPercent: number;
  isCritical: boolean;
  isDamaged: boolean;
}

// Layered canopy: three elliptical clusters of leaf-lobes, plus a trunk with
// bark grooves, root flare, and a glyph that fades as health drops. Under
// 30% HP cracks appear and the canopy shrinks.
function SacredTreeBody({ id, healthPercent, isCritical, isDamaged }: SacredTreeBodyProps) {
  const canopyScale = Math.max(0.72, healthPercent / 100);
  const trunk = isCritical ? "#3a2818" : "#5b3a24";
  const bark = isCritical ? "#2c1d12" : "#3e2817";
  const canopyDeep = isCritical ? "#2d3a1d" : "#1f4422";
  const canopyMid = isCritical ? "#4a5a25" : "#2f6a34";
  const canopyBright = isCritical ? "#6a7a38" : "#4b9a4d";
  const glowOpacity = Math.max(0.15, healthPercent / 140);

  return (
    <svg
      aria-hidden="true"
      width="96"
      height="156"
      viewBox="0 0 96 156"
      className="drop-shadow-lg"
    >
      <defs>
        <radialGradient id={`canopyGrad-${id}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={canopyBright} stopOpacity="1" />
          <stop offset="70%" stopColor={canopyMid} stopOpacity="0.96" />
          <stop offset="100%" stopColor={canopyDeep} stopOpacity="0.92" />
        </radialGradient>
        <linearGradient id={`trunkGrad-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={bark} />
          <stop offset="50%" stopColor={trunk} />
          <stop offset="100%" stopColor={bark} />
        </linearGradient>
        <filter id={`canopyGlow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`glyphGlow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Root flare at the base */}
      <path
        d="M 18 150 Q 34 138 48 146 Q 62 138 78 150 Z"
        fill={bark}
        opacity="0.85"
      />
      <path
        d="M 22 152 Q 30 142 36 150 M 60 150 Q 66 142 74 152"
        stroke={trunk}
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />

      {/* Trunk — tapers upward */}
      <path
        d="M 40 148 L 38 78 Q 37 62 44 54 L 52 54 Q 59 62 58 78 L 56 148 Z"
        fill={`url(#trunkGrad-${id})`}
      />
      {/* Bark grooves */}
      <path
        d="M 44 140 L 45 90 M 49 145 L 50 84 M 53 140 L 52 92"
        stroke={bark}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Cracks appear on critical health */}
      {isCritical && (
        <g opacity="0.7">
          <path
            d="M 47 138 L 48 120 L 45 108 L 48 96"
            stroke="#1b0e07"
            strokeWidth="0.8"
            fill="none"
          />
          <path
            d="M 51 130 L 52 118 L 50 104"
            stroke="#1b0e07"
            strokeWidth="0.7"
            fill="none"
          />
        </g>
      )}

      {/* Canopy — three stacked lobes using the gradient */}
      <g
        filter={`url(#canopyGlow-${id})`}
        transform={`translate(48 48) scale(${canopyScale}) translate(-48 -48)`}
      >
        {/* Deep back lobe */}
        <ellipse cx="48" cy="50" rx="36" ry="22" fill={`url(#canopyGrad-${id})`} opacity="0.9" />
        {/* Mid cluster — three leaf-lobes stacked */}
        <ellipse cx="32" cy="40" rx="18" ry="14" fill={canopyMid} opacity="0.95" />
        <ellipse cx="48" cy="32" rx="22" ry="16" fill={canopyMid} />
        <ellipse cx="64" cy="42" rx="16" ry="13" fill={canopyMid} opacity="0.95" />
        {/* Bright highlights */}
        <ellipse cx="42" cy="28" rx="12" ry="8" fill={canopyBright} opacity="0.95" />
        <ellipse cx="56" cy="22" rx="9" ry="6" fill={canopyBright} />
        {/* Leaf-tip detail — small dots suggest individual leaves */}
        <g fill={canopyBright} opacity="0.55">
          <circle cx="30" cy="28" r="1.6" />
          <circle cx="38" cy="20" r="1.4" />
          <circle cx="50" cy="16" r="1.6" />
          <circle cx="60" cy="22" r="1.4" />
          <circle cx="68" cy="34" r="1.6" />
          <circle cx="20" cy="44" r="1.4" />
          <circle cx="74" cy="52" r="1.4" />
        </g>
      </g>

      {/* Living glyph — three dots + triangle arrangement, glows with health */}
      <g
        opacity={glowOpacity}
        filter={`url(#glyphGlow-${id})`}
        transform="translate(48 92)"
      >
        <circle cx="0" cy="-8" r="2" fill="#a78bfa" />
        <circle cx="-5" cy="3" r="1.6" fill="#a78bfa" />
        <circle cx="5" cy="3" r="1.6" fill="#a78bfa" />
        <path d="M -3 10 L 3 10 L 0 16 Z" fill="#a78bfa" />
      </g>

      {/* Warm root-glow pool when healthy */}
      {!isCritical && (
        <ellipse
          cx="48"
          cy="150"
          rx="24"
          ry="4"
          fill="#f2c14e"
          opacity={isDamaged ? 0.12 : 0.22}
        />
      )}
    </svg>
  );
}
