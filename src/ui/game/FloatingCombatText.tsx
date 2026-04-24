import { AnimatePresence, motion } from "framer-motion";

export interface FloatingTextEvent {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  isSurge?: boolean;
}

interface Props {
  events: FloatingTextEvent[];
}

export function FloatingCombatText({ events }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {events.map((evt) => (
          <div key={evt.id} className="absolute inset-0 pointer-events-none">
            {evt.isSurge && (
              <motion.div
                className="absolute rounded-full border-4"
                style={{
                  left: `${evt.x}%`,
                  top: `${evt.y}%`,
                  transform: "translate(-50%, -50%)",
                  borderColor: evt.color,
                }}
                initial={{ opacity: 0.8, width: 40, height: 40, x: "-50%", y: "-50%" }}
                animate={{ opacity: 0, width: 300, height: 300 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            )}
            <motion.div
              initial={{ opacity: 1, scale: 0.5, y: 0 }}
              animate={{ opacity: 0, scale: evt.isSurge ? 1.5 : 1.2, y: -80 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute font-black text-2xl tracking-widest uppercase drop-shadow-xl"
              style={{
                left: `${evt.x}%`,
                top: `${evt.y}%`,
                transform: "translate(-50%, -50%)",
                color: evt.color,
                textShadow: `0 0 15px ${evt.color}`,
                fontFamily: "Cinzel, serif",
              }}
            >
              {evt.text}
            </motion.div>
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
