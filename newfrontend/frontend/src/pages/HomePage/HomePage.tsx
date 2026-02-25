import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { SlActionUndo } from "react-icons/sl";
import CustomButton from "../../components/Button";
import { getAuth } from "firebase/auth";
import { useAuth } from "../../store/AuthCtx";
import { jwtDecode } from "jwt-decode";
import { useMatchCtx } from "../../store/MatchCtx";
import { QueuePopInternal } from "../../components/QueuePopInternal";
import { CheckForInMatch } from "../../components/CheckForInMatch";

import useSignalR from "../../hooks/useSignalR";
import authorizedCall from "../../misc/authorizedCall";
import type {
  FirebaseJwtPayload,
  MatchResponse,
  SelectButtonProps,
} from "../../exported_styles/interfaces";
import {
  largeClass,
  smallClass,
  textFlashVariant,
  variants,
} from "../../exported_styles/styles";
import { useNavigate } from "react-router-dom";
import { Select } from "@mantine/core";

const BackgroundParticle = ({
  delay,
  x,
  size,
  duration,
  drift,
}: {
  delay: number;
  x: number;
  size: number;
  duration: number;
  drift: number;
}) => (
  <motion.div
    initial={{ y: "108vh", opacity: 0, scale: 0, x: 0 }}
    animate={{
      y: ["108vh" as unknown as number, "-20vh" as unknown as number],
      opacity: [0, 1, 1, 0],
      scale: [0, 1, 1, 0],
      x: [0, drift, -drift * 0.5, drift * 0.3],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      repeatDelay: 0.5 + (x % 3),
      ease: "easeOut",
    }}
    style={{
      position: "fixed",
      left: `${x}%`,
      bottom: 0,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: "radial-gradient(circle, #c4b5fd 0%, #6662FF 60%)",
      boxShadow: `0 0 ${size * 3}px #6662FF, 0 0 ${size * 6}px rgba(102,98,255,0.6), 0 0 ${size * 10}px rgba(102,98,255,0.25)`,
      pointerEvents: "none",
      zIndex: 10,
    }}
  />
);

const AmbientOrb = ({
  x,
  y,
  size,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
}) => (
  <motion.div
    animate={{
      x: [0, 50, -35, 25, 0],
      y: [0, -40, 25, -20, 0],
      opacity: [0.18, 0.38, 0.22, 0.32, 0.18],
    }}
    transition={{
      duration: 14 + delay * 3,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    style={{
      position: "fixed",
      left: `${x}%`,
      top: `${y}%`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: "rgba(102,98,255,0.45)",
      filter: `blur(${size * 0.38}px)`,
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      zIndex: 2,
    }}
  />
);

const StarParticle = ({
  x,
  y,
  delay,
  size,
}: {
  x: number;
  y: number;
  delay: number;
  size: number;
}) => (
  <motion.div
    animate={{
      opacity: [0.2, 0.85, 0.2],
      scale: [0.7, 1.6, 0.7],
    }}
    transition={{
      duration: 2 + (y % 3),
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    style={{
      position: "fixed",
      left: `${x}%`,
      top: `${y}%`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: "#a78bfa",
      boxShadow: `0 0 ${size * 4}px rgba(167,139,250,0.9), 0 0 ${size * 8}px rgba(102,98,255,0.5)`,
      pointerEvents: "none",
      zIndex: 6,
    }}
  />
);

export const HomePage = () => {
  return (
    <div className="h-full bg-navbar-bg flex items-center justify-center overflow-hidden">
      <HomeBody />
    </div>
  );
};

export const HomeBody = () => {
  const bgParticles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        delay: i * 0.35,
        x: 2 + i * 4.5,
        size: 7 + (i % 4) * 4,
        duration: 3.5 + (i % 4),
        drift: ((i % 5) - 2) * 35,
      })),
    [],
  );

  const starParticles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: (i * 37 + 7) % 97,
        y: (i * 53 + 11) % 93,
        delay: i * 0.15,
        size: i % 3 === 0 ? 5 : 3,
      })),
    [],
  );

  const ambientOrbs = useMemo(
    () => [
      { x: 18, y: 28, size: 280, delay: 0 },
      { x: 78, y: 18, size: 220, delay: 4 },
      { x: 52, y: 72, size: 320, delay: 7 },
      { x: 88, y: 62, size: 200, delay: 2 },
    ],
    [],
  );

  // contexts
  const authCtx = useAuth();
  const matchCtx = useMatchCtx();
  // websockets
  const { connectionRef } = useSignalR();
  // state
  const [matchData, setMatchData] = useState<MatchResponse | null>(null);
  const [step, setStep] = useState(0);
  const [currentlySelected, setCurrentlySelected] = useState(0);
  const [selectedSequence, setSelectedSequence] = useState<Array<number>>([]);
  const [modesVisible, setModesVisible] = useState(0); // 0 is all, 1 is quickplay, 2 is solo, 3 is friends
  const [casualCompVisible, setCasualCompVisible] = useState(-1); // -1 means none visible, 0 means both, 1 means casual, 2 means comp
  const [queueVisible, setQueueVisible] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [userAccepted, setUserAccepted] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);
  const [selectedProblemSet, setSelectedProblemSet] = useState<string | null>(
    "",
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (matchCtx.matchStatus == "ACCEPTED") {
      navigate("/match");
    }
    if (matchCtx.matchStatus == "DECLINED") {
      setIsQueuing(false);
      const t = setTimeout(() => {
        setMatchFound(false);
        setUserAccepted(false);
        matchCtx.setMatchStatus("NONE");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [matchCtx.matchStatus]);

  const updateSelectedButtons = (chosen: number) => {
    setCurrentlySelected(chosen);
    if (!selectedSequence.includes(chosen) && chosen != 100) {
      setSelectedSequence([...selectedSequence, chosen]);
    }
    if (chosen == 1 || chosen == 2 || chosen == 3) {
      // modes
      setModesVisible(chosen);
      if (chosen == 1) setCasualCompVisible(0);
      setStep(1);
    } else if (chosen == 4 || chosen == 5) {
      // casual/competitive
      setCasualCompVisible(chosen - 3);
      setStep(2);
      setQueueVisible(true);
    } else if (chosen == 6 || chosen == 7) {
      // make/join lobby
    }
  };

  const handleBackLogic = () => {
    if (step < 0) return false; // cant go under 0
    setStep(step - 1);
    let array = [...selectedSequence];
    array.splice(array.length - 1, 1);

    if (selectedSequence.length <= 2) {
      // then there'll only be one in the sequence, so may as well just empty it
      setSelectedSequence([]);
    } else {
      setSelectedSequence(array);
    }

    if (step - 1 <= 1) {
      setModesVisible(0);
      setCasualCompVisible(-1);
      setCurrentlySelected(-1);
      setQueueVisible(false);
    }
  };

  const startQueue = async (mode: string) => {
    setIsQueuing(true);
    const token = await authCtx.user?.getIdToken();
    if (token) {
      const decodedToken = jwtDecode<FirebaseJwtPayload>(token);
      // console.log(`decoded token: ${decodedToken.user_id}`);
      const response = await authorizedCall(
        authCtx,
        "POST",
        "queueUsers",
        "P",
        {
          mmr: authCtx.mmr,
          mode: mode,
        },
      );

      if (response.data != false) {
        setMatchData(response.data);
        setUserAccepted(false);
        matchCtx.setMatchStatus("NONE");
        setMatchFound(true);
      } else {
        setIsQueuing(false);
      }
    } else {
      setIsQueuing(false);
    }
  };

  const cancelQueue = async () => {
    await authorizedCall(authCtx, "POST", "cancelQueue", "P", null);
    setIsQueuing(false);
  };

  const SelectButton = ({
    buttonChosen,
    children,
    small,
  }: SelectButtonProps) => {
    return (
      <motion.button
        disabled={selectedSequence.includes(buttonChosen) || isQueuing}
        onClick={() => updateSelectedButtons(buttonChosen)}
        className={`bg-text-color text-button-text rounded-2xl
        duration-500 flex items-center justify-center text-center
        hover:cursor-pointer hover:text-white
        ${
          small
            ? selectedSequence.includes(buttonChosen)
              ? largeClass
              : smallClass
            : largeClass
        }
        `}
        style={{
          boxShadow: selectedSequence.includes(buttonChosen)
            ? "0 0 18px rgba(102,98,255,0.65), 0 0 36px rgba(102,98,255,0.3), inset 0 0 18px rgba(102,98,255,0.12)"
            : "0 0 14px rgba(102,98,255,0.45), 0 0 28px rgba(102,98,255,0.2)",
          opacity:
            isQueuing && !selectedSequence.includes(buttonChosen) ? 0.3 : 1,
          transition: "opacity 0.4s ease",
        }}
        animate={
          currentlySelected == buttonChosen
            ? {
                scale: [1.1, 1.0],
                transition: { duration: 0.5, times: [0.7, 1] },
              }
            : { scale: 1 }
        }
        whileHover={
          !selectedSequence.includes(buttonChosen) && !isQueuing
            ? {
                boxShadow:
                  "0 0 20px rgba(102,98,255,0.7), 0 0 40px rgba(102,98,255,0.35)",
              }
            : {}
        }
      >
        <motion.span
          className="text-3xl 3xl:text-6xl"
          variants={textFlashVariant}
          animate={
            currentlySelected == buttonChosen
              ? "flash"
              : selectedSequence.includes(buttonChosen)
                ? "selected"
                : "idle"
          }
          whileHover={
            !selectedSequence.includes(buttonChosen)
              ? {
                  color: "#ffffff",
                  transition: { duration: 0.01, ease: "linear" },
                }
              : {}
          }
        >
          {children}
        </motion.span>
      </motion.button>
    );
  };

  const sendMatchSignal = async (confirm: boolean) => {
    const param = matchData?.matchDto;
    if (param) {
      try {
        if (confirm) setUserAccepted(true);
        matchCtx.setProblemSetId(selectedProblemSet!);
        await connectionRef.current?.invoke(
          "JoinMatchRoom",
          confirm,
          selectedProblemSet,
        );
      } catch (e) {
        // console.log(`Ran into an error ${e}`);
      }
    }
  };

  return (
    <div
      className="h-full w-full flex items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, #1a1535 0%, #110e1e 55%, #0d0d0d 100%)",
      }}
    >
      {ambientOrbs.map((o, i) => (
        <AmbientOrb key={i} x={o.x} y={o.y} size={o.size} delay={o.delay} />
      ))}
      {starParticles.map((s, i) => (
        <StarParticle key={i} x={s.x} y={s.y} delay={s.delay} size={s.size} />
      ))}
      {bgParticles.map((p, i) => (
        <BackgroundParticle
          key={i}
          delay={p.delay}
          x={p.x}
          size={p.size}
          duration={p.duration}
          drift={p.drift}
        />
      ))}
      {!matchFound && <CheckForInMatch />}
      {matchFound && (
        <QueuePopInternal
          isDeclined={matchCtx.matchStatus === "DECLINED"}
          hasAccepted={userAccepted}
          onAccept={() => sendMatchSignal(true)}
          onDecline={() => sendMatchSignal(false)}
        />
      )}
      <div className="relative inline-block" style={{ zIndex: 20 }}>
        <div className="flex flex-row w-full items-end">
          <button
            onClick={() => handleBackLogic()}
            className=" bg-text-color h-fit p-3 mr-auto text-button-text rounded-2xl px-4  hover:cursor-pointer hover:scale-110 ease-in-out duration-100"
          >
            <SlActionUndo />
          </button>
          <Select
            className="justify-end"
            label="Problem Set To Play"
            placeholder="Pick one..."
            data={[
              {
                value: "e13971db-021b-4a96-89de-09f7a3bb8262",
                label: "Coding",
              },
              { value: "languages", label: "Languages" },
              { value: "history", label: "History" },
            ]}
            value={selectedProblemSet}
            onChange={setSelectedProblemSet}
          />
        </div>
        {/* 2) Push the grid down so it clears the back button */}
        <div className="pt-6 flex items-center justify-center">
          <motion.div className="flex flex-col items-center justify-center gap-6">
            <LayoutGroup>
              <AnimatePresence mode="popLayout">
                {(modesVisible == 1 || modesVisible == 0) && (
                  <motion.div
                    key="quickplay"
                    variants={variants}
                    layout
                    exit="exit"
                  >
                    <SelectButton buttonChosen={1}>QUICK PLAY</SelectButton>
                  </motion.div>
                )}
                {(modesVisible == 2 || modesVisible == 0) && (
                  <motion.div key="solo" variants={variants} layout exit="exit">
                    <SelectButton buttonChosen={2}>SOLO</SelectButton>
                  </motion.div>
                )}
                {(modesVisible == 3 || modesVisible == 0) && (
                  <motion.div
                    key="friends"
                    variants={variants}
                    layout
                    exit="exit"
                  >
                    <SelectButton buttonChosen={3}>FRIENDS</SelectButton>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 md:gap-10 flex-col md:flex-row">
                <LayoutGroup>
                  <AnimatePresence mode="popLayout">
                    {(casualCompVisible == 0 || casualCompVisible == 1) && (
                      <motion.div
                        key="casual"
                        variants={variants}
                        layout
                        exit="exit"
                      >
                        <SelectButton buttonChosen={4} small>
                          CASUAL
                        </SelectButton>
                      </motion.div>
                    )}
                    {(casualCompVisible == 0 || casualCompVisible == 2) && (
                      <motion.div
                        key="competitive"
                        variants={{
                          initial: { opacity: 1, x: 0 },
                          exit: { x: 3000, transition: { duration: 0.5 } },
                        }}
                        exit="exit"
                        layout
                      >
                        <SelectButton buttonChosen={5} small>
                          COMPETITIVE
                        </SelectButton>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </LayoutGroup>
              </div>

              {queueVisible && (
                <motion.div className="flex flex-col items-center gap-5">
                  <CustomButton
                    className="w-64 h-16 sm:w-80 sm:h-20 md:w-300 md:h-40"
                    tailwindTextSize={"text-xl sm:text-2xl md:text-4xl"}
                    pulse
                    onClick={async () =>
                      !isQueuing &&
                      (await startQueue(
                        casualCompVisible == 1 ? "casual" : "competitive",
                      ))
                    }
                  >
                    QUEUE
                  </CustomButton>

                  <AnimatePresence>
                    {isQueuing && (
                      <motion.div
                        key="searching"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-4"
                      >
                        {/* Spinning radar rings */}
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: "50%",
                              border: "3px solid transparent",
                              borderTopColor: "#6662FF",
                              borderRightColor: "rgba(102,98,255,0.35)",
                              boxShadow: "0 0 12px rgba(102,98,255,0.5)",
                            }}
                          />
                          <motion.div
                            animate={{ rotate: -360 }}
                            transition={{
                              duration: 3.2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            style={{
                              position: "absolute",
                              inset: "9px",
                              borderRadius: "50%",
                              border: "2px solid transparent",
                              borderTopColor: "#a78bfa",
                              borderRightColor: "rgba(167,139,250,0.25)",
                            }}
                          />
                          <motion.div
                            animate={{
                              opacity: [0.5, 1, 0.5],
                              scale: [0.8, 1.15, 0.8],
                            }}
                            transition={{
                              duration: 1.4,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background: "#6662FF",
                              boxShadow:
                                "0 0 14px #6662FF, 0 0 28px rgba(102,98,255,0.55)",
                            }}
                          />
                        </div>

                        <motion.p
                          animate={{ opacity: [0.55, 1, 0.55] }}
                          transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          style={{
                            color: "#a78bfa",
                            fontSize: "13px",
                            letterSpacing: "4px",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            margin: 0,
                          }}
                        >
                          SEARCHING FOR MATCH...
                        </motion.p>

                        <motion.button
                          onClick={cancelQueue}
                          whileHover={{
                            scale: 1.05,
                            boxShadow: "0 0 18px rgba(239,68,68,0.45)",
                          }}
                          whileTap={{ scale: 0.96 }}
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.35)",
                            borderRadius: "12px",
                            padding: "10px 36px",
                            color: "rgba(239,68,68,0.8)",
                            fontSize: "12px",
                            letterSpacing: "3px",
                            fontWeight: 700,
                            cursor: "pointer",
                            textTransform: "uppercase",
                          }}
                        >
                          CANCEL
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </LayoutGroup>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
