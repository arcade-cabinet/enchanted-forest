import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SpiritProps {
  position: { x: number; y: number };
  isDrawing: boolean;
}

const NOTES = ["♪", "♫", "♬", "♩"];
const PULSE_RINGS = ["inner", "middle", "outer"] as const;

export function Spirit({ position, isDrawing }: SpiritProps) {
  const [trail, setTrail] = useState<{ x: number; y: number; id: number; note: string }[]>([]);

  useEffect(() => {
    setTrail((prev) => {
      const newTrail = [
        ...prev,
        {
          ...position,
          id: Date.now(),
          note: NOTES[Math.floor(Math.random() * NOTES.length)],
        },
      ];
      return newTrail.slice(-15);
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

        <motion.div
          className="w-4 h-4 -m-2 rounded-full"
          style={{
            background: isDrawing
              ? "radial-gradient(circle, rgba(255, 255, 220, 1) 0%, rgba(255, 220, 100, 0.8) 70%)"
              : "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(180, 220, 255, 0.8) 70%)",
            boxShadow: isDrawing
              ? "0 0 20px rgba(255, 220, 100, 0.8)"
              : "0 0 15px rgba(180, 220, 255, 0.6)",
          }}
          animate={{
            boxShadow: isDrawing
              ? [
                  "0 0 20px rgba(255, 220, 100, 0.8)",
                  "0 0 35px rgba(255, 220, 100, 1)",
                  "0 0 20px rgba(255, 220, 100, 0.8)",
                ]
              : [
                  "0 0 15px rgba(180, 220, 255, 0.6)",
                  "0 0 25px rgba(180, 220, 255, 0.8)",
                  "0 0 15px rgba(180, 220, 255, 0.6)",
                ],
          }}
          transition={{
            duration: isDrawing ? 0.4 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

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
