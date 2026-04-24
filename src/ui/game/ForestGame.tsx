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
import { CorruptionWave } from "./CorruptionWave";
import { FireflyParticles } from "./FireflyParticles";
import { GameUI } from "./GameUI";
import { GroveStage } from "./GroveStage";
import { ForestGradientBackground, NoiseBackground } from "./NoiseBackground";
import { SacredTree } from "./SacredTree";
import { Spirit } from "./Spirit";
import { ToneDrawer } from "./ToneDrawer";

export function ForestGame() {
  const [forestState, setForestState] = useState(createInitialForestState);
  const [audioStatus, setAudioStatus] = useState<ForestAudioStatus>(forestAudio.getStatus());
  const [isDrawing, setIsDrawing] = useState(false);
  const [spiritPos, setSpiritPos] = useState({ x: 0, y: 0 });
  const shadowIdRef = useRef(0);

  const spawnWave = useCallback(
    (waveNum: number, mode: SessionMode = forestState.sessionMode) => {
      const wave = spawnCorruptionWave(waveNum, shadowIdRef.current, mode);
      shadowIdRef.current = wave.nextShadowId;
      forestAudio.playWaveStart(waveNum);
      setForestState((prev) => ({
        ...prev,
        wave: waveNum,
        shadows: wave.shadows,
        objective: `Wave ${waveNum} is entering the ward line. Draw before it reaches the roots.`,
        threatLevel: Math.min(100, wave.shadows.length * 7),
      }));
    },
    [forestState.sessionMode]
  );

  const startGame = async (mode: SessionMode, saveSlot?: GameSaveSlot) => {
    const status = await forestAudio.initialize();
    setAudioStatus(status);
    forestAudio.startAmbient();
    const restored = resolveForestStartState(mode, saveSlot);
    if (restored) {
      shadowIdRef.current = getNextShadowId(restored);
      setForestState(restored);
      return;
    }

    const wave = spawnCorruptionWave(1, 0, mode);
    shadowIdRef.current = wave.nextShadowId;
    forestAudio.playWaveStart(1);
    setForestState({
      ...createInitialForestState("playing", mode),
      shadows: wave.shadows,
      threatLevel: wave.shadows.length * 7,
    });
  };

  const restartGame = () => {
    forestAudio.stopAmbient();
    shadowIdRef.current = 0;
    setForestState(createInitialForestState());
  };

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

    forestAudio.playSpellEffect(spell.type);
    setForestState((prev) => applySpellCast(prev, spell));
    setTimeout(() => setForestState((prev) => clearRuneFeedback(prev)), 1000);

    if (spell.type === "shield") {
      setTimeout(() => setForestState((prev) => clearShield(prev)), spell.duration);
    } else if (spell.type === "heal") {
      setTimeout(() => setForestState((prev) => clearHealing(prev)), 1000);
    } else if (spell.type === "purify") {
      setTimeout(() => setForestState((prev) => clearPurifyZone(prev)), spell.duration);
    }
  };

  const handleShadowReach = (shadowId: number, treeIndex: number) => {
    forestAudio.playCorruptionThreat();
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
      <GroveStage ritualCue={ritualCue} threatLevel={forestState.threatLevel} />
      <NoiseBackground />
      <FireflyParticles count={40} />

      {forestState.trees.map((tree, index) => (
        <SacredTree
          key={TREE_POSITIONS[index].id}
          id={index}
          {...tree}
          position={TREE_POSITIONS[index]}
          isHealing={forestState.healingTreeIndex === index}
          isRitualTarget={ritualCue.recommendedTreeIndex === index}
          ritualRune={ritualCue.recommendedTreeIndex === index ? ritualCue.recommendedRune : null}
          isTargeted={isTreeTargeted(index, forestState.shadows)}
        />
      ))}

      <CorruptionWave
        shadows={forestState.shadows}
        shadowIntents={forestState.shadows.map(getShadowIntentPath)}
        treePositions={TREE_POSITIONS}
        onShadowReachTree={handleShadowReach}
        onShadowPurified={handleShadowPurified}
        isPurifying={!!forestState.purifyZone}
        purifyZone={forestState.purifyZone}
      />

      <ToneDrawer
        onSpellCast={handleSpellCast}
        onDrawingChange={setIsDrawing}
        onPositionChange={setSpiritPos}
        disabled={forestState.phase !== "playing"}
      />
      <Spirit position={spiritPos} isDrawing={isDrawing} />

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
