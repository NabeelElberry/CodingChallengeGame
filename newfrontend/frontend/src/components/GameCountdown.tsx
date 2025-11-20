import { useEffect, useState, type SetStateAction } from "react";

export const GameCountdown = ({ onComplete }: { onComplete: () => void }) => {
  const [timer, setTimer] = useState(3);

  // This useEffect handles the 3, 2, 1 sequence
  useEffect(() => {
    // If timer is 0, nothing to do here
    if (timer === 0) {
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]); // Run whenever the timer changes

  const display = timer > 0 ? timer : "GO!";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        fontSize: "150px",
        fontWeight: "bold",
        zIndex: 1000,
      }}
    >
      {display}
    </div>
  );
};
