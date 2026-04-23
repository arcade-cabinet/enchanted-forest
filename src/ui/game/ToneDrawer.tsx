import { analyzeRuneGesture } from "@/engine/forestSimulation";
import { forestAudio, type ToneType } from "@/lib/forestAudio";
import { RUNE_PATTERNS, type RunePattern } from "@/lib/runePatterns";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface ToneDrawerProps {
  onSpellCast: (spell: RunePattern) => void;
  onDrawingChange: (isDrawing: boolean) => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  disabled?: boolean;
}

const SCALE_NOTES = ["C", "D", "E", "G", "A", "C", "D", "E"];
const SCALE_NOTE_STEPS = SCALE_NOTES.map((note, index) => ({
  id: `scale-note-${index + 1}-${note}`,
  note,
  index,
}));
const NOTE_COLORS = [
  "rgba(239, 68, 68, 0.6)",
  "rgba(249, 115, 22, 0.6)",
  "rgba(234, 179, 8, 0.6)",
  "rgba(34, 197, 94, 0.6)",
  "rgba(59, 130, 246, 0.6)",
  "rgba(168, 85, 247, 0.6)",
  "rgba(236, 72, 153, 0.6)",
  "rgba(239, 68, 68, 0.6)",
];

export function ToneDrawer({
  onSpellCast,
  onDrawingChange,
  onPositionChange,
  disabled = false,
}: ToneDrawerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const lastNoteTimeRef = useRef(0);
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [showSpellFeedback, setShowSpellFeedback] = useState<{
    type: ToneType;
    position: { x: number; y: number };
  } | null>(null);
  const [visualNotes, setVisualNotes] = useState<
    { x: number; y: number; note: number; id: number }[]
  >([]);
  const noteIdRef = useRef(0);

  const getEventPosition = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const getNormalizedPosition = useCallback(
    (pos: { x: number; y: number }): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      return { x: pos.x / canvas.width, y: pos.y / canvas.height };
    },
    []
  );

  const playNoteAtPosition = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastNoteTimeRef.current < 50) return;
    lastNoteTimeRef.current = now;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const normalizedY = y / canvas.height;
    const noteIndex = Math.floor((1 - normalizedY) * SCALE_NOTES.length);
    const clampedIndex = Math.max(0, Math.min(noteIndex, SCALE_NOTES.length - 1));
    setActiveNote(clampedIndex);
    forestAudio.playTouchNote(x / canvas.width, normalizedY);
    setVisualNotes((prev) => [
      ...prev.slice(-20),
      { x, y, note: clampedIndex, id: noteIdRef.current++ },
    ]);
    setTimeout(() => setActiveNote(null), 100);
  }, []);

  const drawTrail = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: { x: number; y: number },
      to: { x: number; y: number },
      noteIndex: number
    ) => {
      const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, NOTE_COLORS[noteIndex] || NOTE_COLORS[0]);
      gradient.addColorStop(1, NOTE_COLORS[(noteIndex + 1) % NOTE_COLORS.length]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = NOTE_COLORS[noteIndex] || NOTE_COLORS[0];
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
    []
  );

  const startDrawing = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      isDrawingRef.current = true;
      onDrawingChange(true);
      const pos = getEventPosition(e);
      pointsRef.current = [{ ...pos, time: Date.now() }];
      playNoteAtPosition(pos.x, pos.y);
      const clientPos =
        e instanceof MouseEvent
          ? { x: e.clientX, y: e.clientY }
          : { x: e.touches[0]?.clientX || 0, y: e.touches[0]?.clientY || 0 };
      onPositionChange(clientPos);
    },
    [disabled, getEventPosition, onDrawingChange, onPositionChange, playNoteAtPosition]
  );

  const draw = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current || disabled) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const pos = getEventPosition(e);
      const lastPos = pointsRef.current[pointsRef.current.length - 1];
      if (lastPos) {
        const noteIndex = Math.floor((1 - pos.y / canvas.height) * SCALE_NOTES.length);
        drawTrail(ctx, lastPos, pos, Math.max(0, Math.min(noteIndex, SCALE_NOTES.length - 1)));
      }
      pointsRef.current.push({ ...pos, time: Date.now() });
      playNoteAtPosition(pos.x, pos.y);
      const clientPos =
        e instanceof MouseEvent
          ? { x: e.clientX, y: e.clientY }
          : { x: e.touches[0]?.clientX || 0, y: e.touches[0]?.clientY || 0 };
      onPositionChange(clientPos);
    },
    [disabled, getEventPosition, drawTrail, onPositionChange, playNoteAtPosition]
  );

  const stopDrawing = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      isDrawingRef.current = false;
      onDrawingChange(false);
      const canvas = canvasRef.current;
      const spellType = canvas
        ? analyzeRuneGesture(
            pointsRef.current.map((p) => ({ x: p.x / canvas.width, y: p.y / canvas.height }))
          )
        : null;
      if (spellType) {
        const spell = RUNE_PATTERNS.find((r) => r.type === spellType);
        if (spell) {
          forestAudio.playGestureSequence(
            pointsRef.current.map((p) => getNormalizedPosition(p)),
            spellType
          );
          const avgX =
            pointsRef.current.reduce((sum, p) => sum + p.x, 0) / pointsRef.current.length;
          const avgY =
            pointsRef.current.reduce((sum, p) => sum + p.y, 0) / pointsRef.current.length;
          setShowSpellFeedback({ type: spellType, position: { x: avgX, y: avgY } });
          onSpellCast(spell);
        }
      }
      pointsRef.current = [];
      setVisualNotes([]);
    },
    [getNormalizedPosition, onSpellCast, onDrawingChange]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("mousedown", startDrawing);
    window.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    window.addEventListener("touchmove", draw, { passive: false });
    window.addEventListener("touchend", stopDrawing, { passive: false });
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousedown", startDrawing);
      window.removeEventListener("mousemove", draw);
      window.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      window.removeEventListener("touchmove", draw);
      window.removeEventListener("touchend", stopDrawing);
    };
  }, [startDrawing, draw, stopDrawing]);

  return (
    <>
      <canvas
        ref={canvasRef}
        data-capture-exclude="true"
        className="absolute inset-0 z-30 touch-none"
        style={{
          cursor: disabled ? "not-allowed" : "crosshair",
          pointerEvents: disabled ? "none" : "auto",
        }}
      />
      <div className="fixed left-3 top-1/2 z-40 -translate-y-1/2 pointer-events-none sm:left-4">
        <div className="flex flex-col-reverse gap-1.5 sm:gap-1">
          {SCALE_NOTE_STEPS.map(({ id, note, index }) => (
            <motion.div
              key={id}
              className="flex items-center gap-2"
              animate={{
                scale: activeNote === index ? 1.2 : 1,
                opacity: activeNote === index ? 1 : 0.5,
              }}
              transition={{ duration: 0.1 }}
            >
              <div
                className="flex h-8 w-10 items-center justify-center rounded text-sm font-bold text-white sm:h-6 sm:w-8 sm:text-xs"
                style={{
                  background: NOTE_COLORS[index],
                  border:
                    activeNote === index
                      ? "1px solid rgba(255,255,255,0.8)"
                      : "1px solid rgba(255,255,255,0.22)",
                  boxShadow: activeNote === index ? `0 0 22px ${NOTE_COLORS[index]}` : "none",
                }}
              >
                {note}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {visualNotes.map((vn) => (
          <motion.div
            key={vn.id}
            className="fixed pointer-events-none z-35 text-2xl font-bold"
            style={{
              left: vn.x,
              top: vn.y,
              color: NOTE_COLORS[vn.note],
              textShadow: `0 0 10px ${NOTE_COLORS[vn.note]}`,
            }}
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: 0, scale: 0.5, y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            ♪
          </motion.div>
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {showSpellFeedback && (
          <motion.div
            className="fixed pointer-events-none z-40"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              left: showSpellFeedback.position.x,
              top: showSpellFeedback.position.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="px-6 py-3 rounded-lg font-bold text-2xl text-center"
              style={{
                background:
                  showSpellFeedback.type === "shield"
                    ? "linear-gradient(135deg, rgba(74, 222, 128, 0.3), rgba(74, 222, 128, 0.1))"
                    : showSpellFeedback.type === "heal"
                      ? "linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(167, 139, 250, 0.1))"
                      : "linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(251, 191, 36, 0.1))",
                color:
                  showSpellFeedback.type === "shield"
                    ? "#4ade80"
                    : showSpellFeedback.type === "heal"
                      ? "#a78bfa"
                      : "#fbbf24",
                border: `2px solid ${showSpellFeedback.type === "shield" ? "#4ade80" : showSpellFeedback.type === "heal" ? "#a78bfa" : "#fbbf24"}`,
                boxShadow: `0 0 40px ${showSpellFeedback.type === "shield" ? "rgba(74, 222, 128, 0.5)" : showSpellFeedback.type === "heal" ? "rgba(167, 139, 250, 0.5)" : "rgba(251, 191, 36, 0.5)"}`,
              }}
            >
              {showSpellFeedback.type === "shield" && "♪ 守護の歌 ♪"}
              {showSpellFeedback.type === "heal" && "♪ 癒しの調べ ♪"}
              {showSpellFeedback.type === "purify" && "♪ 浄化の旋律 ♪"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
