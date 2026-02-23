import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthCtx";
import authorizedCall from "../misc/authorizedCall";
import { useMatchCtx } from "../store/MatchCtx";

export const CheckForInMatch = () => {
  const authCtx = useAuth();
  const navigate = useNavigate();
  const matchCtx = useMatchCtx();
  const [show, setShow] = useState(false);
  const [playerInfo, setPlayerInfo] = useState(null);
  useEffect(() => {
    const check = async () => {
      try {
        // Backend: return truthy/{ inMatch: true } if the user has an active match
        const response = await authorizedCall(
          authCtx,
          "GET",
          "checkForPlayerInMatch",
        );
        if (response?.data) {
          setShow(true);
        }
      } catch {
        // If the check fails silently, just don't show the popup
      }
    };
    check();
  }, []);

  const onReconnect = () => {
    const matchInformation = authorizedCall(
      authCtx,
      "GET",
      "getMatchInfoForPlayer",
      "P",
      null,
    );

    matchInformation.then((result) => {
      const matchData = result.data;
      const currentStage = Number(result.data[`level:${authCtx.UID}`]); // the stage the current player is at
      const minigameOrder: string = result.data!.minigameOrder; // string containing order of minigames to be played eg: "12212"
      const payload = {
        matchInfo: matchData,
        currentStageNum: currentStage,
        minigameOrder,
        questionOrder: matchData.questionOrder,
        fullAnswerOrder: matchData.fullAnswerOrder,
        onLoadTime: Math.floor(performance.now()),
      };
      console.log("Problem setID ", matchData.problemSetId);
      matchCtx.setProblemSetId(matchData.problemSetId);

      console.log("Result data getting level: ", matchData);
      if (matchData != null) {
        navigate("/match", { state: { payload } });
      }
    });
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 bg-gray-950 border border-gray-800 rounded-2xl p-14 flex flex-col items-center gap-8 shadow-2xl"
            initial={{ scale: 0.75, opacity: 0, y: -40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <motion.h1
              className="text-3xl font-bold tracking-[0.25em] uppercase select-none"
              animate={{ color: "#ffffff", opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Match Found
            </motion.h1>

            <p className="text-gray-400 text-base text-center max-w-xs select-none">
              You were previously in a match.
              <br />
              Attempt to reconnect?
            </p>

            <div className="flex flex-col items-center gap-3 w-full">
              {/* Reconnect */}
              <motion.button
                onClick={() => onReconnect()}
                className="w-full px-20 py-5 text-white text-xl font-bold rounded-xl select-none"
                style={{ backgroundColor: "#15803d" }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                animate={{
                  boxShadow: [
                    "0 0 8px #15803d44",
                    "0 0 36px #15803d",
                    "0 0 8px #15803d44",
                  ],
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                RECONNECT
              </motion.button>

              {/* Dismiss */}
              <motion.button
                onClick={() => setShow(false)}
                className="w-full px-20 py-3 bg-gray-800 text-gray-400 text-lg font-semibold rounded-xl select-none"
                whileHover={{
                  backgroundColor: "#374151",
                  color: "#d1d5db",
                  scale: 1.03,
                }}
                whileTap={{ scale: 0.97 }}
              >
                DISMISS
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
