import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { SlActionUndo } from "react-icons/sl";
import CustomButton from "../../components/Button";
import { getAuth } from "firebase/auth";
import { useAuth } from "../../store/AuthCtx";
import { jwtDecode } from "jwt-decode";
import { useMatchCtx } from "../../store/MatchCtx";

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

export const HomePage = () => {
  return (
    <div className="h-full bg-navbar-bg flex items-center justify-center overflow-hidden">
      <HomeBody />
    </div>
  );
};

export const HomeBody = () => {
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
  const [responseState, setResponseState] = useState(false);
  const [foundStatus, setFoundStatus] = useState(false);
  useEffect(() => {
    console.log("in use effect: ");
    setFoundStatus(false);
  }, [responseState]);

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
      console.log("Empty selected seq");
      setSelectedSequence([]);
    } else {
      setSelectedSequence(array);
    }
    console.log("step: " + step);

    if (step - 1 <= 1) {
      setModesVisible(0);
      setCasualCompVisible(-1);
      setCurrentlySelected(-1);
      setQueueVisible(false);
    }
  };

  const startQueue = async (mode: string) => {
    const token = await authCtx.user?.getIdToken();
    if (token) {
      const decodedToken = jwtDecode<FirebaseJwtPayload>(token);
      console.log(`decoded token: ${decodedToken.user_id}`);
      const response = await authorizedCall(
        authCtx,
        "POST",
        "queueUsers",
        "P",
        {
          userId: decodedToken.user_id,
          mmr: authCtx.mmr,
          mode: mode,
        }
      );

      if (response.data != false) {
        setMatchData(response.data);
        setMatchFound(true);
      }
    }
  };

  const SelectButton = ({
    buttonChosen,
    children,
    small,
  }: SelectButtonProps) => {
    return (
      <motion.button
        disabled={selectedSequence.includes(buttonChosen)}
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
        animate={
          currentlySelected == buttonChosen
            ? {
                scale: [1.3, 1.0],
                transition: { duration: 0.2, times: [0.7, 1] },
              }
            : { scale: 1 }
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

  const QueuePop = () => {
    console.log("Queue pop in here");
    console.log("Match found? : ", matchFound);
    // first we need to create the match in the DB through backend
    console.log("matchData: ", matchData?.matchDto);
    const param = matchData?.matchDto;

    console.log(`USER1: ${param?.user1}, user2 ${param?.user2}`);
    const sendSignal = async (confirm: boolean) => {
      if (param) {
        try {
          connectionRef.current
            ?.invoke("JoinMatchRoom", param.user1, param.user2, confirm)
            .then((value) => {
              console.log(`Value: ${value}`);
              setFoundStatus(true);
            });
          setMatchFound(false);
          matchCtx.setMatchFound(false);
        } catch {
          console.log("Ran into an error");
        }
      }
    };

    // basically queue will pop up when we find a match, and when both accept or decline the queue will leave
    return matchFound && !matchCtx.matchFound ? (
      <div className="absolute w-full h-full backdrop-brightness-50 z-10 flex flex-col gap-2 items-center overflow-hidden justify-center">
        <button
          onClick={() => sendSignal(true)}
          className="p-8 bg-text-color text-white text-2xl rounded-lg hover:cursor-pointer shadow-lg"
        >
          ACCEPT
        </button>
        <button
          onClick={() => sendSignal(false)}
          className="p-8 bg-text-color text-white text-2xl rounded-lg hover:cursor-pointer shadow-lg"
        >
          {" "}
          DECLINE
        </button>
      </div>
    ) : null;
  };

  return (
    <div className="h-full w-full bg-navbar-bg flex items-center justify-center overflow-hidden">
      <QueuePop />
      <div className="relative inline-block">
        <button
          onClick={() => handleBackLogic()}
          className="absolute top-0 left-0 bg-text-color text-button-text rounded-2xl px-4 py-2"
        >
          <SlActionUndo />
        </button>

        {/* 2) Push the grid down so it clears the back button */}
        <div className="pt-12 flex items-center justify-center">
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
                <motion.div>
                  <CustomButton
                    className="w-300 h-40"
                    tailwindTextSize={"text-4xl"}
                    pulse
                    onClick={async () =>
                      await startQueue(
                        casualCompVisible == 1 ? "casual" : "competitive"
                      )
                    }
                  >
                    QUEUE
                  </CustomButton>
                </motion.div>
              )}
            </LayoutGroup>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
