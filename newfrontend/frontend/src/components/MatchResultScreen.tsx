import * as motion from "motion/react-client";
import { useNavigate } from "react-router-dom";
import { useMatchCtx } from "../store/MatchCtx";

interface MatchResultScreenProps {
  won: boolean;
  totalTimeMs?: number;
}

const GoldParticle = ({ delay, x }: { delay: number; x: number }) => (
  <motion.div
    initial={{ y: "105vh", opacity: 0, scale: 0 }}
    animate={{
      y: [("105vh" as unknown as number), ("-15vh" as unknown as number)],
      opacity: [0, 1, 1, 0],
      scale: [0, 1, 1, 0],
    }}
    transition={{
      duration: 3.5 + Math.random() * 2,
      delay,
      repeat: Infinity,
      repeatDelay: 1 + Math.random() * 3,
      ease: "easeOut",
    }}
    style={{
      position: "fixed",
      left: `${x}%`,
      bottom: 0,
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: "#ffd700",
      boxShadow: "0 0 8px #ffd700, 0 0 16px rgba(255,215,0,0.6)",
      pointerEvents: "none",
      zIndex: 2001,
    }}
  />
);

export const MatchResultScreen = ({
  won,
  totalTimeMs,
}: MatchResultScreenProps) => {
  const navigate = useNavigate();
  const matchCtx = useMatchCtx();

  const handleReturnHome = () => {
    matchCtx.setMatchOver(false);
    matchCtx.setWonMatch(false);
    matchCtx.setMatchFound(false);
    matchCtx.setMatchStatus("NONE");
    navigate("/home");
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
  };

  const particles = won
    ? Array.from({ length: 14 }, (_, i) => ({
        delay: i * 0.25,
        x: 3 + i * 7,
      }))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(5, 5, 20, 0.96)",
        zIndex: 2000,
        overflow: "hidden",
      }}
    >
      {/* Gold particles — victory only */}
      {particles.map((p, i) => (
        <GoldParticle key={i} delay={p.delay} x={p.x} />
      ))}

      {/* Card */}
      <motion.div
        initial={{ scale: 0.55, y: 60, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", duration: 0.65, bounce: 0.38, delay: 0.1 }}
        style={{
          position: "relative",
          background: won
            ? "linear-gradient(145deg, #0e0c2e 0%, #1e1a5e 55%, #0e0c2e 100%)"
            : "linear-gradient(145deg, #10101a 0%, #181828 55%, #10101a 100%)",
          border: `2px solid ${won ? "#ffd700" : "#3a3a5c"}`,
          borderRadius: "24px",
          padding: "52px 64px 44px",
          textAlign: "center",
          maxWidth: "460px",
          width: "90%",
          boxShadow: won
            ? "0 0 80px rgba(255,215,0,0.18), 0 0 24px rgba(255,165,0,0.1), 0 28px 56px rgba(0,0,0,0.7)"
            : "0 28px 56px rgba(0,0,0,0.7)",
          overflow: "hidden",
          zIndex: 2002,
        }}
      >
        {/* Shimmer sweep — victory only */}
        {won && (
          <motion.div
            animate={{ x: ["-120%", "220%"] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 2.5,
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "55%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,215,0,0.07), transparent)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -200 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            delay: 0.4,
            duration: 0.9,
            bounce: 0.55,
          }}
          style={{ fontSize: "72px", lineHeight: 1, marginBottom: "18px" }}
        >
          {won ? "🏆" : "💀"}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62 }}
          style={{
            fontSize: "52px",
            fontWeight: 900,
            letterSpacing: "6px",
            margin: "0 0 10px",
            color: won ? "#ffd700" : "#5a5a7a",
            textShadow: won
              ? "0 0 28px rgba(255,215,0,0.65), 0 0 56px rgba(255,165,0,0.3)"
              : "none",
          }}
        >
          {won ? "VICTORY" : "DEFEATED"}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.78 }}
          style={{
            color: won
              ? "rgba(255,255,255,0.7)"
              : "rgba(255,255,255,0.3)",
            fontSize: "13px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginBottom: totalTimeMs !== undefined ? "28px" : "36px",
            margin: `0 0 ${totalTimeMs !== undefined ? "28px" : "36px"}`,
          }}
        >
          {won ? "You conquered the challenge!" : "Better luck next time"}
        </motion.p>

        {/* Time stat */}
        {totalTimeMs !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "16px 24px",
              marginBottom: "32px",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: "10px",
                letterSpacing: "3px",
                margin: "0 0 6px",
                textTransform: "uppercase",
              }}
            >
              Total Time
            </p>
            <p
              style={{
                color: won ? "#ffd700" : "rgba(255,255,255,0.55)",
                fontSize: "30px",
                fontWeight: 700,
                margin: 0,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTime(totalTimeMs)}
            </p>
          </motion.div>
        )}

        {/* Return Home button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleReturnHome}
          style={{
            background: won
              ? "linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)"
              : "linear-gradient(135deg, #322f98 0%, #4a47cc 100%)",
            color: won ? "#0a0820" : "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "14px 44px",
            fontSize: "15px",
            fontWeight: 800,
            letterSpacing: "3px",
            textTransform: "uppercase",
            cursor: "pointer",
            width: "100%",
            boxShadow: won
              ? "0 4px 20px rgba(255,180,0,0.4)"
              : "0 4px 20px rgba(50,47,152,0.45)",
          }}
        >
          Return Home
        </motion.button>
      </motion.div>
    </motion.div>
  );
};