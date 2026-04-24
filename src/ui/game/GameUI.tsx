import { LandingHero, StartScreen } from "@/ui/shell";
import type {
  ForestRitualCue,
  ForestSpellCadenceCue,
  RuneType,
} from "@/sim/grove";
import type { ForestAudioStatus } from "@/lib/forestAudio";
import { RUNE_PATTERNS } from "@/lib/runePatterns";
import type { GameSaveSlot, SessionMode } from "@/lib/sessionMode";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { codenameFromSeed, randomSeed } from "@/sim/rng";

const RADIAL_SPEED_LINES = Array.from({ length: 24 }, (_, index) => ({
  id: `radial-speed-line-${index + 1}`,
  rotate: index * 15,
  delay: index * 0.02,
}));
const HORIZONTAL_SPEED_LINES = Array.from({ length: 20 }, (_, index) => ({
  id: `horizontal-speed-line-${index + 1}`,
  top: `${5 + index * 5}%`,
  width: `${50 + ((index * 17) % 50)}%`,
  left: `${(index * 23) % 50}%`,
  delay: index * 0.03,
}));
const RUNE_CUE_COLORS: Record<RuneType, string> = {
  heal: "#a78bfa",
  purify: "#fbbf24",
  shield: "#4ade80",
};
const RUNE_CUE_LABELS: Record<RuneType, string> = {
  heal: "Heal",
  purify: "Purify",
  shield: "Shield",
};

interface GameUIProps {
  wave: number;
  totalWaves: number;
  mana: number;
  maxMana: number;
  isPaused: boolean;
  gameState: "intro" | "tutorial" | "playing" | "victory" | "defeat";
  onStart: (mode: SessionMode, saveSlot?: GameSaveSlot, seed?: number) => void;
  onRestart: () => void;
  lastRune?: string | null;
  objective: string;
  threatLevel: number;
  harmonyLevel: number;
  harmonySurgeActive: boolean;
  ritualCue: ForestRitualCue;
  spellCadenceCue: ForestSpellCadenceCue;
  audioStatus: ForestAudioStatus;
  runSummary: {
    elapsedSeconds: number;
    healthyTrees: number;
    harmonyLevel: number;
    targetMinutes: number;
    totalWaves: number;
    wave: number;
  };
}

function SpeedLines({ direction = "radial" }: { direction?: "radial" | "horizontal" }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {direction === "radial"
        ? RADIAL_SPEED_LINES.map((line) => (
            <motion.div
              key={line.id}
              className="absolute top-1/2 left-1/2 h-[200vh] w-1 bg-gradient-to-b from-transparent via-white/20 to-transparent"
              style={{ transformOrigin: "top center", rotate: `${line.rotate}deg` }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.8, delay: line.delay }}
            />
          ))
        : HORIZONTAL_SPEED_LINES.map((line) => (
            <motion.div
              key={line.id}
              className="absolute h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                top: line.top,
                width: line.width,
                left: line.left,
              }}
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: "200%", opacity: [0, 1, 0] }}
              transition={{ duration: 0.5, delay: line.delay }}
            />
          ))}
    </div>
  );
}

function DramaticFlash({
  text,
  subtext,
  color = "#fbbf24",
}: {
  text: string;
  subtext?: string;
  color?: string;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <SpeedLines direction="radial" />
      <div className="relative text-center">
        <motion.div
          className="text-8xl md:text-9xl font-black"
          style={{
            color,
            textShadow: `0 0 60px ${color}, 0 0 120px ${color}`,
            WebkitTextStroke: `2px ${color}`,
          }}
          initial={{ scale: 3, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {text}
        </motion.div>
        {subtext && (
          <motion.div
            className="text-2xl md:text-3xl font-bold text-white/90 mt-4 tracking-widest"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {subtext}
          </motion.div>
        )}
        <motion.div
          className="h-1 mx-auto mt-4 rounded-full"
          style={{ background: color, boxShadow: `0 0 20px ${color}` }}
          initial={{ width: 0 }}
          animate={{ width: "80%" }}
          transition={{ delay: 0.3, duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

function RuneActivation({
  rune,
  onComplete,
}: {
  rune: (typeof RUNE_PATTERNS)[0];
  onComplete: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const runeNames: Record<string, { jp: string; romaji: string }> = {
    Shield: { jp: "守護", romaji: "SHUGO" },
    Heal: { jp: "癒し", romaji: "IYASHI" },
    Purify: { jp: "浄化", romaji: "JOUKA" },
  };
  const runeInfo = runeNames[rune.name] || { jp: rune.name, romaji: rune.name };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: rune.color }}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
      <SpeedLines direction="horizontal" />
      <RuneActivationMotif color={rune.color} motif={getRuneMotif(rune.type)} />
      <div className="relative">
        <motion.div
          className="absolute inset-0 -m-20 rounded-full blur-3xl"
          style={{ background: rune.color }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
        <motion.div
          className="text-7xl md:text-8xl font-black text-center"
          style={{
            color: rune.color,
            textShadow: `0 0 40px ${rune.color}, 0 0 80px ${rune.color}`,
          }}
          initial={{ scale: 2, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {runeInfo.jp}
        </motion.div>
        <motion.div
          className="text-xl md:text-2xl font-bold tracking-[0.5em] text-center mt-2"
          style={{ color: rune.color }}
          initial={{ opacity: 0, letterSpacing: "1em" }}
          animate={{ opacity: 1, letterSpacing: "0.5em" }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {runeInfo.romaji}
        </motion.div>
      </div>
    </motion.div>
  );
}

function RuneActivationMotif({
  color,
  motif,
}: {
  color: string;
  motif: ForestSpellCadenceCue["motif"];
}) {
  if (motif === "ring") {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={`shield-ring-${index}`}
            className="absolute rounded-full border-2"
            style={{ borderColor: color, width: 130 + index * 76, height: 130 + index * 76 }}
            initial={{ opacity: 0.8, scale: 0.35 }}
            animate={{ opacity: 0, scale: 1.25 }}
            transition={{ delay: index * 0.12, duration: 0.72 }}
          />
        ))}
      </div>
    );
  }

  if (motif === "ascending") {
    return (
      <div className="absolute inset-0 flex items-end justify-center gap-4 pb-[18vh]">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={`heal-column-${index}`}
            className="h-32 w-3 rounded-full"
            style={{ background: color, boxShadow: `0 0 24px ${color}` }}
            initial={{ opacity: 0, y: 140, scaleY: 0.3 }}
            animate={{ opacity: [0, 1, 0], y: -110 - index * 18, scaleY: 1.8 }}
            transition={{ delay: index * 0.1, duration: 0.88 }}
          />
        ))}
      </div>
    );
  }

  if (motif === "zigzag") {
    return (
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.polyline
            key={`purify-zig-${index}`}
            points="18,58 36,38 54,58 72,38 90,58"
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: [0, 1, 0], pathLength: 1 }}
            transition={{ delay: index * 0.12, duration: 0.7 }}
            style={{
              filter: `drop-shadow(0 0 14px ${color})`,
              transform: `translate(${8 + index * 8}%, ${24 + index * 12}%) scale(0.82)`,
              transformOrigin: "center",
            }}
          />
        ))}
      </svg>
    );
  }

  return null;
}

function getRuneMotif(type: RuneType): ForestSpellCadenceCue["motif"] {
  if (type === "shield") return "ring";
  if (type === "heal") return "ascending";
  return "zigzag";
}

function CadenceMeter({
  audioStatus,
  cue,
}: {
  audioStatus: ForestAudioStatus;
  cue: ForestSpellCadenceCue;
}) {
  return (
    <div className="mt-2 rounded border border-white/10 bg-white/5 px-2 py-1.5">
      <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest">
        <span style={{ color: cue.color }}>{cue.label}</span>
        <span
          className={audioStatus.visualFallbackActive ? "text-amber-200" : "text-emerald-100/60"}
        >
          {audioStatus.visualFallbackActive ? "Visual chorus" : "Audio live"}
        </span>
      </div>
      <div className="mt-1 grid grid-cols-3 gap-1">
        {cue.beatPattern.map((beat, index) => (
          <motion.div
            key={`${cue.label}-${beat}`}
            className="rounded-sm border px-1 py-0.5 text-center text-[9px] font-black uppercase"
            style={{
              borderColor: cue.color,
              color: cue.color,
              opacity: 0.48 + cue.intensity * 0.42,
            }}
            animate={{
              boxShadow: [
                `0 0 0 ${cue.color}00`,
                `0 0 ${10 + cue.intensity * 18}px ${cue.color}66`,
                `0 0 0 ${cue.color}00`,
              ],
            }}
            transition={{ delay: index * 0.12, duration: 0.9, repeat: Infinity }}
          >
            {beat}
          </motion.div>
        ))}
      </div>
      {audioStatus.visualFallbackActive ? (
        <div className="mt-1 text-[9px] font-bold uppercase text-amber-100/70">
          {cue.fallbackText}
        </div>
      ) : null}
    </div>
  );
}

export function GameUI({
  wave,
  totalWaves,
  mana,
  maxMana,
  gameState,
  onStart,
  onRestart,
  lastRune,
  objective,
  threatLevel,
  harmonyLevel,
  harmonySurgeActive,
  ritualCue,
  spellCadenceCue,
  audioStatus,
  runSummary,
}: GameUIProps) {
  const [showRuneEffect, setShowRuneEffect] = useState<(typeof RUNE_PATTERNS)[0] | null>(null);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [pendingSeed, setPendingSeed] = useState<number>(0);

  useEffect(() => {
    if (lastRune) {
      const rune = RUNE_PATTERNS.find((r) => r.name === lastRune);
      if (rune) setShowRuneEffect(rune);
    }
  }, [lastRune]);

  const cueColor = RUNE_CUE_COLORS[ritualCue.recommendedRune];
  const cueLabel = RUNE_CUE_LABELS[ritualCue.recommendedRune];
  const cueTarget = formatCueTarget(ritualCue);
  const cueObjective = ritualCue.manaReady
    ? ritualCue.objective
    : `Build mana for ${cueLabel} (${Math.floor(mana)}/${ritualCue.manaNeeded}).`;

  return (
    <>
      <AnimatePresence>
        {showRuneEffect && (
          <RuneActivation rune={showRuneEffect} onComplete={() => setShowRuneEffect(null)} />
        )}
      </AnimatePresence>

      {(gameState === "playing" || gameState === "tutorial") && (
        <div data-testid="hud" className="fixed inset-x-0 top-0 z-40 p-3 md:p-4 pointer-events-none">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 md:gap-4 items-start max-w-5xl mx-auto">
            <motion.div
              className="relative"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div
                className="bg-black/80 backdrop-blur-sm px-5 py-3 border-2 border-amber-400/50"
                style={{ clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}
              >
                <div className="text-amber-400/80 text-xs font-bold tracking-widest">
                  WAVE
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-amber-400">{wave}</span>
                  <span className="text-amber-400/60 text-lg">/ {totalWaves}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative hidden sm:block"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div
                className="bg-black/70 backdrop-blur-sm px-4 py-3 border border-emerald-300/30"
                style={{ clipPath: "polygon(3% 0, 100% 0, 97% 100%, 0% 100%)" }}
              >
                <div className="text-emerald-200/70 text-[10px] font-bold tracking-widest">
                  GROVE CHORUS
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-100">
                    Rune Cue
                  </span>
                  <span
                    className="text-sm font-black uppercase md:text-base"
                    style={{ color: cueColor, textShadow: `0 0 16px ${cueColor}88` }}
                  >
                    Draw {cueLabel}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-white/60">{cueTarget}</span>
                </div>
                <div className="mt-1 text-white font-black text-sm md:text-base leading-tight truncate">
                  {cueObjective || objective}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-purple-950/80">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-purple-400"
                    animate={{ width: `${Math.max(4, Math.min(100, threatLevel))}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest text-emerald-100/75">
                  <span>Harmony</span>
                  <span style={{ color: harmonySurgeActive ? "#fbbf24" : "#a7f3d0" }}>
                    {harmonySurgeActive ? "Surge" : `${harmonyLevel}/3`}
                  </span>
                </div>
                <div className="mt-1 truncate text-[10px] font-bold uppercase text-emerald-100/60">
                  {ritualCue.harmonyText}
                </div>
                <CadenceMeter audioStatus={audioStatus} cue={spellCadenceCue} />
                <div className="mt-1 grid grid-cols-3 gap-1">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className="h-1 rounded-full"
                      style={{
                        background:
                          harmonyLevel >= step
                            ? "linear-gradient(90deg, #34d399, #fbbf24)"
                            : "rgba(148, 163, 184, 0.24)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div
                className="bg-black/80 backdrop-blur-sm px-5 py-3 border-2 border-violet-400/50"
                style={{ clipPath: "polygon(5% 0, 100% 0, 100% 100%, 0% 100%)" }}
              >
                <div className="text-violet-400/80 text-xs font-bold tracking-widest text-right">
                  MANA
                </div>
                <div className="w-36 h-4 bg-black/50 rounded-sm overflow-hidden mt-1 border border-violet-500/30">
                  <motion.div
                    className="h-full"
                    style={{
                      width: `${(mana / maxMana) * 100}%`,
                      background: "linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)",
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {gameState === "tutorial" && (
        <motion.div
          key="tutorial-overlay"
          data-testid="tutorial-overlay"
          className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center px-6 py-8 max-w-md">
            <div className="text-emerald-100/70 text-[10px] font-black tracking-[0.3em] uppercase mb-3">
              The grove is still
            </div>
            <div className="text-amber-300 text-3xl md:text-4xl font-black tracking-wide mb-2"
              style={{ fontFamily: "Cormorant Garamond, Cinzel, serif", textShadow: "0 0 24px rgba(251, 191, 36, 0.5)" }}
            >
              Draw a circle anywhere
            </div>
            <div className="text-emerald-200/60 text-sm font-medium">
              to cast SHIELD. The first rune calls the waves.
            </div>
            <motion.div
              className="mt-6 mx-auto border-2 border-emerald-300/60 rounded-full"
              style={{ width: 120, height: 120, boxShadow: "0 0 40px rgba(74, 222, 128, 0.4)" }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          </div>
        </motion.div>
      )}

      {(gameState === "playing" || gameState === "tutorial") && (
        <motion.div
          className="fixed inset-x-3 top-24 z-40 pointer-events-none sm:hidden"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded border border-emerald-300/25 bg-black/78 px-3 py-2 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/65">
                Rune Cue
              </span>
              <span
                className="text-sm font-black uppercase"
                style={{ color: cueColor, textShadow: `0 0 14px ${cueColor}99` }}
              >
                Draw {cueLabel}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-bold uppercase text-white/70">
              <span className="truncate">{cueTarget}</span>
              <span>{ritualCue.threatBand}</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest">
              <span style={{ color: spellCadenceCue.color }}>{spellCadenceCue.label}</span>
              <span className="truncate text-white/40">
                {spellCadenceCue.beatPattern.join(" / ")}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {gameState === "intro" && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <StartScreen
            title="ENCHANTED FOREST"
            subtitle="Learn a rune, chain it, survive grove variety that tests the reading of your cadence. Finish as a wiser mage."
            primaryAction={{
              label: "START",
              onClick: () => {
                setPendingSeed(randomSeed());
                setShowNewGameModal(true);
              },
            }}
            glowColor="var(--color-firefly)"
            glowRgb="242, 193, 78"
            displayClassName="ef-display"
            verbs={[
              { icon: "✶", text: "Draw a rune" },
              { icon: "◇", text: "Chain its cadence" },
              { icon: "◈", text: "Seal the grove" },
            ]}
            renderHero={() => <LandingHero />}
          />
          {showNewGameModal && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-emerald-950/90 border border-emerald-500/30 p-8 rounded-xl text-center max-w-md w-full shadow-2xl">
                <h2 className="text-emerald-400 font-black text-xl tracking-widest mb-2 uppercase">
                  World Seed
                </h2>
                <p className="text-emerald-100/70 text-sm mb-6">
                  Your grove's layout, corruption rhythms, and fate are bound to this codename.
                </p>
                <div className="bg-black/50 py-4 px-6 rounded border border-amber-500/20 mb-6">
                  <div className="text-amber-400 font-bold text-2xl tracking-widest uppercase" style={{ fontFamily: "Cormorant Garamond, Cinzel, serif" }}>
                    {codenameFromSeed(pendingSeed)}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    className="w-full rounded border border-amber-500 bg-amber-500/20 px-4 py-3 text-amber-100 font-black tracking-widest hover:bg-amber-500/30 transition-colors uppercase"
                    onClick={() => {
                      setShowNewGameModal(false);
                      onStart("standard", undefined, pendingSeed);
                    }}
                  >
                    Begin Journey
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="flex-1 rounded border border-emerald-500/30 bg-emerald-900/50 px-4 py-2 text-emerald-200 font-bold hover:bg-emerald-800/50 transition-colors uppercase text-sm"
                      onClick={() => setPendingSeed(randomSeed())}
                    >
                      Reroll Seed
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded border border-emerald-500/30 bg-transparent px-4 py-2 text-emerald-200/60 font-bold hover:bg-emerald-900/30 hover:text-emerald-200 transition-colors uppercase text-sm"
                      onClick={() => setShowNewGameModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {gameState === "victory" && <DramaticFlash text="SEALED" subtext="The grove is whole" color="#fbbf24" />}
      {gameState === "victory" && (
        <motion.div
          className="fixed inset-0 z-[55] flex flex-col items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <div className="bg-black/80 backdrop-blur-md border border-amber-500/30 p-8 rounded-xl text-center max-w-lg mt-32 pointer-events-auto">
            <h2 className="text-amber-400 font-black text-2xl tracking-widest mb-4">VICTORY DIARY</h2>
            <p className="text-emerald-100/80 mb-6">
              Every rune you cast shaped the harmony of this grove. (Diary implementation pending)
            </p>
            <button
              type="button"
              className="rounded-lg border border-amber-300/40 bg-amber-900/80 px-8 py-3 text-white font-black hover:bg-amber-800/80 transition-colors"
              onClick={onRestart}
            >
              SEALED {runSummary.totalWaves} WAVES / RESTART
            </button>
          </div>
        </motion.div>
      )}
      {gameState === "defeat" && (
        <>
          <DramaticFlash text="FALLEN" subtext="The roots have gone dark" color="#ef4444" />
          <button
            type="button"
            className="fixed bottom-8 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-red-300/40 bg-red-900/80 px-8 py-3 text-white font-black"
            onClick={onRestart}
          >
            RESTART
          </button>
        </>
      )}
    </>
  );
}

function formatCueTarget(cue: ForestRitualCue): string {
  if (cue.recommendedTreeId) {
    return cue.recommendedTreeId.replace("-", " ");
  }
  if (cue.nearestShadowDistance !== null) {
    return `${Math.round(cue.nearestShadowDistance)}m to roots`;
  }
  return cue.waveLabel;
}
