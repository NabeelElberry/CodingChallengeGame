import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QueuePopInternalProps {
  isDeclined: boolean;
  hasAccepted: boolean;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}

export const QueuePopInternal = ({
  isDeclined,
  hasAccepted,
  onAccept,
  onDecline,
}: QueuePopInternalProps) => {
  const [locked, setLocked] = useState<"accept" | "decline" | null>(null);

  // Precompute so TypeScript doesn't narrow `locked` inside JSX conditionals
  const declineIsLocked = locked === "accept";
  const acceptIsLocked = locked === "decline";

  const handleAccept = async () => {
    if (locked) return;
    setLocked("accept");
    await onAccept();
  };

  const handleDecline = async () => {
    if (locked) return;
    setLocked("decline");
    await onDecline();
  };

  const acceptedView = hasAccepted || locked === "accept";

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Dark backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/75"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Card */}
      <motion.div
        className="relative z-10 bg-gray-950 border border-gray-800 rounded-2xl p-14 flex flex-col items-center gap-10 shadow-2xl"
        initial={{ scale: 0.75, opacity: 0, y: -40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        {/* Title */}
        <motion.h1
          className="text-4xl font-bold tracking-[0.3em] uppercase select-none"
          animate={
            isDeclined
              ? { color: "#ef4444" }
              : { color: "#ffffff", opacity: [0.6, 1, 0.6] }
          }
          transition={
            isDeclined ? { duration: 0.3 } : { repeat: Infinity, duration: 2 }
          }
        >
          {isDeclined ? "Match Declined" : "Match Found"}
        </motion.h1>

        {/* Body — switches between three states */}
        <AnimatePresence mode="wait">
          {/* Opponent declined */}
          {isDeclined && (
            <motion.p
              key="declined"
              className="text-gray-400 text-base"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              A player declined. Returning to menu…
            </motion.p>
          )}

          {/* User accepted — waiting */}
          {!isDeclined && acceptedView && (
            <motion.div
              key="waiting"
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <motion.div
                className="px-20 py-6 rounded-xl text-2xl font-bold text-gray-900 bg-amber-400 select-none"
                animate={{
                  boxShadow: [
                    "0 0 12px #f59e0b44",
                    "0 0 48px #f59e0b",
                    "0 0 12px #f59e0b44",
                  ],
                }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              >
                ACCEPTED
              </motion.div>

              <div className="flex items-center gap-1 text-gray-500 text-sm select-none">
                <span>Waiting for opponent</span>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                  >
                    .
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Default — two buttons */}
          {!isDeclined && !acceptedView && (
            <motion.div
              key="initial"
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Accept */}
              <motion.button
                onClick={handleAccept}
                disabled={locked !== null}
                className="px-20 py-6 text-white text-2xl font-bold rounded-xl select-none"
                style={{
                  cursor: locked ? "not-allowed" : "pointer",
                  opacity: acceptIsLocked ? 0.2 : 1,
                  pointerEvents: acceptIsLocked ? "none" : "auto",
                  backgroundColor: "#15803d",
                  transition: "opacity 0.35s ease",
                }}
                whileHover={locked === null ? { scale: 1.06 } : {}}
                whileTap={locked === null ? { scale: 0.94 } : {}}
                animate={
                  locked === null
                    ? {
                        boxShadow: [
                          "0 0 8px #15803d44",
                          "0 0 36px #15803d",
                          "0 0 8px #15803d44",
                        ],
                      }
                    : { boxShadow: "none" }
                }
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                ACCEPT
              </motion.button>

              {/* Decline */}
              <motion.button
                onClick={handleDecline}
                disabled={locked !== null}
                className="px-20 py-4 bg-gray-800 text-gray-400 text-lg font-semibold rounded-xl select-none"
                style={{
                  cursor: locked ? "not-allowed" : "pointer",
                  opacity: declineIsLocked ? 0.15 : 1,
                  pointerEvents: declineIsLocked ? "none" : "auto",
                  transition: "opacity 0.35s ease",
                }}
                whileHover={
                  locked === null
                    ? { backgroundColor: "#374151", color: "#d1d5db", scale: 1.03 }
                    : {}
                }
                whileTap={locked === null ? { scale: 0.97 } : {}}
              >
                DECLINE
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
