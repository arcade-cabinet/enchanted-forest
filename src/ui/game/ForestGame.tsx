import { GameViewport, MuteToggle } from "@/ui/shell";
import { isRuntimePaused } from "@/lib/runtimePause";
import { useRunSnapshotAutosave } from "@/hooks/useRunSnapshotAutosave";
import { recordRunResult } from "@/hooks/runtimeResult";
import {
  applyShadowHit,
  getShadowIntentPath,
  removePurifiedShadow,
  spawnCorruptionWave,
} from "@/sim/corruption";
import {
  createInitialForestState,
  type CorruptionShadow,
  type ForestState,
  getForestModeTuning,
  getForestRitualCue,
  getForestRunSummary,
  getForestSpellCadenceCue,
  getForestTransition,
  MAX_WAVES,
  TREE_POSITIONS,
} from "@/sim/grove";
import {
  applySpellCast,
  canCastSpell,
  clearHealing,
  clearPurifyZone,
  clearRuneFeedback,
  clearShield,
  regenerateMana,
} from "@/sim/runes";
import type { ForestAudioStatus } from "@/lib/forestAudio";
import { forestAudio } from "@/lib/forestAudio";
import type { RunePattern } from "@/lib/runePatterns";
import type { GameSaveSlot, SessionMode } from "@/lib/sessionMode";
import { useCallback, useEffect, useRef, useState } from "react";
import { seedFromCodename } from "@/sim/rng";
import { motion } from "framer-motion";
import { CorruptionWave } from "./CorruptionWave";
import { FireflyParticles } from "./FireflyParticles";
import { GameUI } from "./GameUI";
import { GroveStage } from "./GroveStage";
import { ForestGradientBackground, NoiseBackground } from "./NoiseBackground";
import { SacredTree } from "./SacredTree";
import { Spirit } from "./Spirit";
import { ToneDrawer } from "./ToneDrawer";
import { FloatingCombatText, type FloatingTextEvent } from "./FloatingCombatText";

function parseSeedParam(val: string | null): number | undefined {
  if (!val) return undefined;
  if (val === "fast-wave") return 1337;
  const cn = seedFromCodename(val);
  if (cn !== null) return cn;
  const num = parseInt(val, 10);
  if (!isNaN(num)) return num;
  return undefined;
}

export function ForestGame() {
  const [forestState, setForestState] = useState(() => {
    const seedParam = new URLSearchParams(window.location.search).get("seed");
    return createInitialForestState("intro", "standard", parseSeedParam(seedParam));
  });
  const [audioStatus, setAudioStatus] = useState<ForestAudioStatus>(forestAudio.getStatus());
  const [isDrawing, setIsDrawing] = useState(false);
  const [spiritPos, setSpiritPos] = useState({ x: 0, y: 0 });
  const [lastDamageMs, setLastDamageMs] = useState(0);
  const [floatingEvents, setFloatingEvents] = useState<FloatingTextEvent[]>([]);
  const floatingIdRef = useRef(0);
  const shadowIdRef = useRef(0);
  // Track one-shot setTimeout handles from handleSpellCast so we can
  // cancel them on unmount and on restart — otherwise repeated
  // restarts or navigation accumulate pending state mutations that
  // fire into stale React trees.
  const spellTimeoutsRef = useRef<number[]>([]);
  const clearSpellTimeouts = useCallback(() => {
    for (const id of spellTimeoutsRef.current) window.clearTimeout(id);
    spellTimeoutsRef.current = [];
  }, []);

  const spawnWave = useCallback(
    (waveNum: number, mode: SessionMode = forestState.sessionMode) => {
      const waveData = spawnCorruptionWave(forestState, waveNum, shadowIdRef.current, mode);
      shadowIdRef.current = waveData.nextShadowId;
      forestAudio.playWaveStart(waveNum);
      setForestState((prev) => ({
        ...prev,
        wave: waveNum,
        shadows: waveData.shadows,
        objective: `Wave ${waveNum} is entering the ward line. Draw before it reaches the roots.`,
        threatLevel: Math.min(100, waveData.shadows.length * 7),
      }));
    },
    [forestState.sessionMode, forestState.seed]
  );

  useEffect(() => {
    // Cheat codes for e2e testing
    (window as any).__EF_CHEAT_VICTORY = () => {
      setForestState((prev) => ({ ...prev, phase: "victory", objective: "The grove is sealed." }));
    };
    (window as any).__EF_CHEAT_TUTORIAL = () => {
      const waveData = spawnCorruptionWave(forestState, 1, 0, forestState.sessionMode);
      shadowIdRef.current = waveData.nextShadowId;
      forestAudio.playWaveStart(1);
      setForestState((prev) => ({
        ...prev,
        phase: "playing",
        wave: 1,
        shadows: waveData.shadows,
        threatLevel: waveData.shadows.length * 7,
        objective: "Corruption arrives. Read the cadence; defend the trees.",
      }));
    };
    return () => {
      delete (window as any).__EF_CHEAT_VICTORY;
      delete (window as any).__EF_CHEAT_TUTORIAL;
    };
  }, [forestState]);

  const startGame = async (mode: SessionMode, saveSlot?: GameSaveSlot) => {
    // Unlock the AudioContext synchronously in the same frame as the user
    // click so Chrome doesn't log an autoplay warning during the async gap
    // before Tone.start() resolves.
    forestAudio.unlock();
    const status = await forestAudio.initialize();
    setAudioStatus(status);
    forestAudio.startAmbient();
    const restored = resolveForestStartState(mode, saveSlot);
    if (restored) {
      shadowIdRef.current = getNextShadowId(restored);
      setForestState(restored);
      return;
    }

    // Enter tutorial phase: trees at full health, no shadows yet,
    // a clear instruction overlay. The first successful rune cast
    // promotes to "playing" and spawns wave 1. This avoids the
    // hostile "shadows already descending the instant you click
    // START" experience.
    shadowIdRef.current = 0;
    setForestState((prev) => ({
      ...createInitialForestState("tutorial", mode, prev.seed),
      objective: "Draw a circle anywhere to cast SHIELD.",
    }));
  };

  // Promote tutorial → playing on first successful cast, then
  // spawn wave 1. We flip phase="playing" INSIDE the setTimeout at
  // the same moment the wave spawns — otherwise the transition
  // effect below sees phase==="playing" with shadows=[] and fires a
  // duplicate spawnWave(1), overwriting this wave's shadow IDs and
  // double-playing playWaveStart.
  useEffect(() => {
    if (forestState.phase !== "tutorial") return;
    if (!forestState.lastRuneType) return;
    // Small delay so the tutorial-overlay fade has time to run
    // before the first wave arrives.
    const timeout = setTimeout(() => {
      const waveData = spawnCorruptionWave(forestState, 1, 0, forestState.sessionMode);
      shadowIdRef.current = waveData.nextShadowId;
      forestAudio.playWaveStart(1);
      setForestState((prev) => ({
        ...prev,
        phase: "playing",
        wave: 1,
        shadows: waveData.shadows,
        threatLevel: waveData.shadows.length * 7,
        objective: "Corruption arrives. Read the cadence; defend the trees.",
      }));
    }, 700);
    return () => clearTimeout(timeout);
  }, [forestState.phase, forestState.lastRuneType, forestState.sessionMode, forestState.seed]);

  const restartGame = () => {
    forestAudio.stopAmbient();
    clearSpellTimeouts();
    shadowIdRef.current = 0;
    setForestState((prev) => createInitialForestState("intro", "standard", prev.seed));
  };

  // Stop the ambient Tone pad and cancel any pending spell cleanup
  // timeouts when ForestGame unmounts (e.g. Playwright navigation or
  // HMR). Without this the Tone.Transport schedules + synth nodes
  // accumulate across remounts, and spell-cleanup timers fire into
  // stale React trees.
  useEffect(() => {
    return () => {
      forestAudio.stopAmbient();
      clearSpellTimeouts();
    };
  }, [clearSpellTimeouts]);

  useEffect(() => {
    if (forestState.phase !== "playing") return undefined;

    const manaRegen = setInterval(() => {
      setForestState((prev) => {
        if (isRuntimePaused()) return prev;

        return regenerateMana(prev, getForestModeTuning(prev.sessionMode).manaRegenPerSecond);
      });
    }, 1000);

    return () => clearInterval(manaRegen);
  }, [forestState.phase]);

  useEffect(() => {
    if (forestState.phase === "playing") {
      const avgHealth =
        forestState.trees.reduce((sum, tree) => sum + tree.health, 0) / forestState.trees.length;
      forestAudio.updateTreeHealth(avgHealth);
    }
  }, [forestState.phase, forestState.trees]);

  const handleSpellCast = (spell: RunePattern) => {
    if (!canCastSpell(forestState, spell)) return;

    setForestState((prev) => {
      const nextState = applySpellCast(prev, spell);
      forestAudio.playSpellEffect(spell.type, nextState.harmonySurgeActive);
      
      let text = "";
      let color = "";
      if (spell.type === "shield") { text = "Shielded!"; color = "#4ade80"; }
      else if (spell.type === "heal") { text = "Healed!"; color = "#a78bfa"; }
      else if (spell.type === "purify") { text = "Purified!"; color = "#fbbf24"; }
      
      if (nextState.harmonySurgeActive) {
        text = "SURGE: " + text;
        color = "#f2c14e";
      }

      setFloatingEvents(e => [
        ...e.slice(-4),
        { id: floatingIdRef.current++, text, x: spiritPos.x / window.innerWidth * 100, y: spiritPos.y / window.innerHeight * 100, color, isSurge: nextState.harmonySurgeActive }
      ]);
      setTimeout(() => {
        setFloatingEvents(e => e.slice(1));
      }, 1200);

      return nextState;
    });

    const track = (id: number) => {
      spellTimeoutsRef.current.push(id);
    };

    track(
      window.setTimeout(() => setForestState((prev) => clearRuneFeedback(prev)), 1000)
    );

    if (spell.type === "shield") {
      track(window.setTimeout(() => setForestState((prev) => clearShield(prev)), spell.duration));
    } else if (spell.type === "heal") {
      track(window.setTimeout(() => setForestState((prev) => clearHealing(prev)), 1000));
    } else if (spell.type === "purify") {
      track(
        window.setTimeout(() => setForestState((prev) => clearPurifyZone(prev)), spell.duration)
      );
    }
  };

  const handleShadowReach = (shadowId: number, treeIndex: number) => {
    forestAudio.playCorruptionThreat();
    setLastDamageMs(Date.now());
    setForestState((prev) => applyShadowHit(prev, shadowId, treeIndex));
  };

  const handleShadowPurified = (shadowId: number) => {
    setForestState((prev) => removePurifiedShadow(prev, shadowId));
  };

  useEffect(() => {
    const transition = getForestTransition(forestState, MAX_WAVES);

    if (transition.type === "next-wave" && transition.nextWave) {
      spawnWave(transition.nextWave, forestState.sessionMode);
    } else if (transition.type === "victory") {
      forestAudio.playSpellEffect("victory");
      setForestState((prev) => ({ ...prev, phase: "victory", objective: "The grove is sealed." }));
    } else if (transition.type === "defeat") {
      forestAudio.playSpellEffect("defeat");
      setForestState((prev) => ({
        ...prev,
        phase: "defeat",
        objective: "The grove roots have gone dark.",
      }));
    }
  }, [forestState, spawnWave]);

  const runSummary = getForestRunSummary(forestState);
  const ritualCue = getForestRitualCue(forestState);
  const spellCadenceCue = getForestSpellCadenceCue(forestState);

  useRunSnapshotAutosave<ForestState>({
    key: "enchanted-forest:v1:save",
    paused: forestState.phase !== "playing",
    build: () => forestState,
  });

  // The landing ("intro") is its own screen — the live playfield
  // must not render behind it, or trees + shadows + the drawing pad
  // bleed through the modal. Only mount the playfield once the
  // player is inside a run.
  const showPlayfield = forestState.phase !== "intro";

  return (
    <GameViewport
      className="bg-emerald-950"
      background="#064e3b"
      data-browser-screenshot-mode="page"
    >
      <ForestGradientBackground />
      <RunResultEffect
        phase={forestState.phase}
        mode={forestState.sessionMode}
        victoryScore={
          runSummary.healthyTrees * 1000 + runSummary.wave * 100 + runSummary.harmonyLevel
        }
        defeatScore={runSummary.healthyTrees * 500 + runSummary.wave * 50}
        totalWaves={runSummary.totalWaves}
        wave={runSummary.wave}
      />
      {showPlayfield && (
        <motion.div
          className="absolute inset-0"
          animate={{
            x: Date.now() - lastDamageMs < 400 ? [0, -8, 8, -4, 4, 0] : 0,
            y: Date.now() - lastDamageMs < 400 ? [0, 4, -4, 2, -2, 0] : 0,
            boxShadow: forestState.harmonySurgeActive 
              ? "inset 0 0 100px rgba(242, 193, 78, 0.15)" 
              : "none",
          }}
          transition={{ duration: 0.4 }}
        >
          <GroveStage
            ritualCue={ritualCue}
            threatLevel={forestState.threatLevel}
            showCueLabel={forestState.phase === "playing"}
          />
          <NoiseBackground />
          <FireflyParticles count={forestState.harmonySurgeActive ? 80 : 40} />

          {forestState.trees.map((tree, index) => (
            <SacredTree
              key={TREE_POSITIONS[index].id}
              id={index}
              {...tree}
              position={TREE_POSITIONS[index]}
              isHealing={forestState.healingTreeIndex === index}
              isRitualTarget={ritualCue.recommendedTreeIndex === index}
              ritualRune={
                ritualCue.recommendedTreeIndex === index ? ritualCue.recommendedRune : null
              }
              isTargeted={isTreeTargeted(index, forestState.shadows)}
            />
          ))}

          <div data-testid="corruption-wave" className="absolute inset-0 pointer-events-none">
            <CorruptionWave
              shadows={forestState.shadows}
              shadowIntents={forestState.shadows.map(getShadowIntentPath)}
              treePositions={TREE_POSITIONS}
              onShadowReachTree={handleShadowReach}
              onShadowPurified={handleShadowPurified}
              isPurifying={!!forestState.purifyZone}
              purifyZone={forestState.purifyZone}
            />
          </div>

          <ToneDrawer
            onSpellCast={handleSpellCast}
            onDrawingChange={setIsDrawing}
            onPositionChange={setSpiritPos}
            disabled={forestState.phase !== "playing" && forestState.phase !== "tutorial"}
          />
          <Spirit position={spiritPos} isDrawing={isDrawing} />
          <FloatingCombatText events={floatingEvents} />
        </motion.div>
      )}

      <GameUI
        wave={forestState.wave}
        totalWaves={MAX_WAVES}
        mana={forestState.mana}
        maxMana={forestState.maxMana}
        isPaused={false}
        gameState={forestState.phase}
        onStart={startGame}
        onRestart={restartGame}
        lastRune={forestState.lastRune}
        objective={forestState.objective}
        threatLevel={forestState.threatLevel}
        harmonyLevel={forestState.harmonyLevel}
        harmonySurgeActive={forestState.harmonySurgeActive}
        ritualCue={ritualCue}
        spellCadenceCue={spellCadenceCue}
        audioStatus={audioStatus}
        runSummary={runSummary}
      />
      <MuteToggle />
    </GameViewport>
  );
}

function resolveForestStartState(mode: SessionMode, saveSlot?: GameSaveSlot): ForestState | null {
  const snapshot = saveSlot?.snapshot;
  if (!isForestSnapshot(snapshot)) return null;

  const restored = snapshot as ForestState;
  return {
    ...restored,
    lastSpellCastMs: restored.lastSpellCastMs ?? 0,
    phase: "playing",
    sessionMode: mode,
  };
}

function isForestSnapshot(snapshot: unknown): snapshot is ForestState {
  const value = snapshot as Partial<ForestState> | undefined;
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.elapsedMs === "number" &&
      typeof value.wave === "number" &&
      typeof value.mana === "number" &&
      Array.isArray(value.trees) &&
      Array.isArray(value.shadows)
  );
}

function getNextShadowId(state: ForestState) {
  return state.shadows.reduce((next, shadow) => Math.max(next, shadow.id + 1), 0);
}

function isTreeTargeted(treeIndex: number, shadows: CorruptionShadow[]): boolean {
  return shadows.some((shadow) => shadow.targetTreeIndex === treeIndex);
}

interface RunResultEffectProps {
  phase: ForestState["phase"];
  mode: SessionMode;
  victoryScore: number;
  defeatScore: number;
  totalWaves: number;
  wave: number;
}

function RunResultEffect({
  phase,
  mode,
  victoryScore,
  defeatScore,
  totalWaves,
  wave,
}: RunResultEffectProps) {
  useEffect(() => {
    if (phase === "victory") {
      recordRunResult({
        mode,
        score: victoryScore,
        status: "completed",
        summary: `Sealed ${totalWaves} grove waves`,
        milestones: ["first-grove-sealed"],
      });
    } else if (phase === "defeat") {
      recordRunResult({
        mode,
        score: defeatScore,
        status: "failed",
        summary: `Defeated at wave ${wave}`,
      });
    }
  }, [phase, mode, victoryScore, defeatScore, totalWaves, wave]);
  return null;
}
