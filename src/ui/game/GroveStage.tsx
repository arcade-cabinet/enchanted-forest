import {
  createGroveLayout,
  type ForestRitualCue,
  type RuneType,
} from "@/engine/forestSimulation";
import { motion } from "framer-motion";

const layout = createGroveLayout();
const RITUAL_COLORS: Record<RuneType, string> = {
  heal: "#a78bfa",
  purify: "#fbbf24",
  shield: "#4ade80",
};

export function GroveStage({
  ritualCue,
  threatLevel,
}: {
  ritualCue: ForestRitualCue;
  threatLevel: number;
}) {
  const threatOpacity = Math.min(0.38, threatLevel / 220);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(4, 24, 18, 0) 0%, rgba(8, 42, 30, 0.82) 22%, rgba(10, 24, 18, 1) 100%)",
        }}
      />
      <div
        className="absolute left-1/2 bottom-[5%] h-[34%] w-[86%] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(22, 101, 52, 0.72) 0%, rgba(20, 83, 45, 0.52) 46%, rgba(4, 24, 18, 0) 72%)",
          transform: "translateX(-50%) perspective(480px) rotateX(58deg)",
        }}
      />

      {layout.wardRings.map((ring) => (
        <motion.div
          key={ring.id}
          className="absolute rounded-full border-2"
          style={{
            left: `${ring.x}%`,
            top: `${ring.y}%`,
            width: `${ring.width}%`,
            height: `${ring.height}%`,
            borderColor: ring.color,
            boxShadow: `0 0 24px ${ring.color}55`,
            transform: "translate(-50%, -50%) perspective(500px) rotateX(62deg)",
          }}
          animate={{ opacity: [0.26, 0.58, 0.26], scale: [0.99, 1.01, 0.99] }}
          transition={{ duration: ring.id === "outer-ward" ? 4 : 2.8, repeat: Infinity }}
        />
      ))}

      <RitualFocus cue={ritualCue} />

      {layout.roots.map((root) => (
        <div
          key={root.id}
          className="absolute h-4 rounded-full"
          style={{
            left: `${root.x}%`,
            top: `${root.y}%`,
            width: `${root.width}%`,
            transform: `translate(-50%, -50%) rotate(${root.rotate}deg)`,
            background:
              "linear-gradient(90deg, rgba(92, 64, 38, 0), rgba(92, 64, 38, 0.72), rgba(164, 113, 49, 0.3), rgba(92, 64, 38, 0))",
          }}
        />
      ))}

      {layout.standingStones.map((stone) => (
        <div
          key={stone.id}
          className="absolute rounded-t-full"
          style={{
            left: `${stone.x}%`,
            top: `${stone.y}%`,
            width: stone.id === "stone-crown" ? "2.8rem" : "3.4rem",
            height: `${stone.height}%`,
            transform: "translate(-50%, -100%)",
            background: `linear-gradient(90deg, #0f221f, ${stone.color}, #0b1715)`,
            boxShadow: "0 18px 30px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div
            className="absolute left-1/2 top-4 h-8 w-1 -translate-x-1/2 rounded-full"
            style={{
              background: "#a78bfa",
              boxShadow: "0 0 16px rgba(167, 139, 250, 0.75)",
            }}
          />
        </div>
      ))}

      <div
        className="absolute inset-x-0 top-0 h-[44%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.08) 65%, rgba(0, 0, 0, 0) 100%)",
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(88, 28, 135, ${threatOpacity}) 0%, rgba(88, 28, 135, 0) 48%)`,
        }}
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
    </div>
  );
}

function RitualFocus({ cue }: { cue: ForestRitualCue }) {
  const color = RITUAL_COLORS[cue.recommendedRune];
  const width = cue.recommendedRune === "purify" ? cue.focusRadius * 1.55 : cue.focusRadius * 1.8;
  const height = cue.recommendedRune === "purify" ? cue.focusRadius * 0.86 : cue.focusRadius * 0.72;
  const drawPath =
    cue.recommendedTreeIndex === null
      ? "M 35 56 C 43 45, 58 45, 66 56"
      : `M 50 52 C 50 44, ${cue.focusX} 44, ${cue.focusX} ${cue.focusY}`;

  return (
    <>
      <svg
        aria-hidden="true"
        className="absolute inset-0 z-10 h-full w-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <motion.path
          d={drawPath}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="0.42"
          strokeDasharray="1.6 1.1"
          initial={{ opacity: 0.2, pathLength: 0 }}
          animate={{ opacity: [0.26, 0.78, 0.26], pathLength: 1 }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </svg>
      <motion.div
        className="absolute z-[11] rounded-full border-2"
        style={{
          borderColor: color,
          boxShadow: `0 0 34px ${color}88, inset 0 0 24px ${color}33`,
          height: `${height}%`,
          left: `${cue.focusX}%`,
          top: `${cue.focusY}%`,
          transform: "translate(-50%, -50%) perspective(520px) rotateX(62deg)",
          width: `${width}%`,
        }}
        animate={{
          opacity: cue.manaReady ? [0.35, 0.88, 0.35] : [0.2, 0.42, 0.2],
          scale: cue.threatBand === "critical" ? [1, 1.06, 1] : [0.99, 1.02, 0.99],
        }}
        transition={{ duration: cue.threatBand === "critical" ? 0.9 : 1.7, repeat: Infinity }}
      />
      <motion.div
        className="absolute z-[12] rounded border border-white/15 bg-black/72 px-2 py-1 text-[10px] font-black uppercase text-white shadow-lg backdrop-blur"
        style={{
          boxShadow: `0 0 18px ${color}55`,
          color,
          left: `${cue.focusX}%`,
          top: `${Math.max(18, cue.focusY - 17)}%`,
          transform: "translate(-50%, -50%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7], y: [0, -2, 0] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        Draw {cue.recommendedRune}
      </motion.div>
    </>
  );
}
