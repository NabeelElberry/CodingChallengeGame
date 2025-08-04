import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup, scale } from "framer-motion";
import { button, s } from "motion/react-client";
import { Select } from "@mantine/core";
import { SlActionUndo } from "react-icons/sl";
export const HomePage = () => {
  return (
    <div className="h-full bg-navbar-bg flex items-center justify-center overflow-hidden">
      <HomeBody />
    </div>
  );
};


export const HomeBody = () => {
    const [step, setStep] = useState(0)
    const [currentlySelected, setCurrentlySelected] = useState(0);
    const [selectedSequence, setSelectedSequence] = useState<Array<number>>([])
    const [modesVisible, setModesVisible] = useState(0); // 0 is all, 1 is quickplay, 2 is solo, 3 is friends
    const [casualCompVisible, setCasualCompVisible] = useState(-1); // -1 means none visible, 0 means both, 1 means casual, 2 means comp

    const [queueVisible, setQueueVisible] = useState(false)
    const updateSelectedButtons = (chosen: number) => {
        
        setCurrentlySelected(chosen);

        if (!selectedSequence.includes(chosen) && chosen != 100) {
            setSelectedSequence([...selectedSequence, chosen]); 
        }


        console.log("Added to seq: " + chosen)
        
        console.log("Selected Sequence: " + selectedSequence)

        if (chosen == 1 || chosen == 2 || chosen == 3) { // modes
            setModesVisible(chosen);
            if (chosen == 1) setCasualCompVisible(0)
            setStep(1)
        }
        else if (chosen == 4 || chosen == 5) { // casual/competitive
            setCasualCompVisible(chosen-3);
            setStep(2)
            setQueueVisible(true)
        } else if (chosen == 6 || chosen == 7) { // make/join lobby

        } 
        

    }

    const variants = {
        exit: {x: -3000, transition: {duration: 0.5}},
    };

    const textFlashVariant = {
        flash: { color: ["#ffffff", "#322f98", "#ffffff"],
                transition: {
                    duration: 1,
                    times: [0,0.33,0.66], // evenly spaced flashes
                    ease: "easeInOut",
                },
            },
        idle: { color: "#322f98" },
        selected: {color: "#ffffff"},
        whileHover: {
            color: "#ffffff",
            transition: {duration: 1}
        }
    }

    interface SelectButtonProps {
        children: React.ReactNode;
        buttonChosen: number;
        small?: boolean;
        queue?: boolean;
    }

    const SelectButton = ({buttonChosen, children, small, queue} : SelectButtonProps) => {
        const smallClass = "w-60 h-20 md:w-100 3xl:h-50 3xl:w-120"
        const largeClass = "w-80 h-30 md:w-200 3xl:h-70 3xl:w-240"
        const queueClass = ""

        return <motion.button 
            disabled={selectedSequence.includes(buttonChosen)}
            onClick={() => updateSelectedButtons(buttonChosen)} className={`bg-text-color text-button-text rounded-2xl 
            duration-500 flex items-center justify-center text-center
            hover:cursor-pointer hover:text-white
            ${small ? selectedSequence.includes(buttonChosen) ? largeClass : smallClass : largeClass}
            `}
            animate={currentlySelected==buttonChosen? {scale:[1.3,1.0], transition: {duration: 0.2, times: [0.7,1]}}: {scale:1}}
            >
                <motion.span className="text-3xl 3xl:text-6xl"
                variants={textFlashVariant}
                animate={currentlySelected == buttonChosen? "flash" : selectedSequence.includes(buttonChosen) ? "selected" : "idle"} 
                whileHover={!selectedSequence.includes(buttonChosen) ? {
                color: "#ffffff",
                transition: {duration: 0.01, ease: "linear"}
            } : {}}
                >{children}</motion.span>
        </motion.button>
    }

    const handleBackLogic = () => {
        
        if (step < 0) return false; // cant go under 0
        setStep(step-1);
        let array = [...selectedSequence]
        array.splice(array.length-1, 1)
            
        if (selectedSequence.length<=2) { // then there'll only be one in the sequence, so may as well just empty it
            console.log("Empty selected seq")
            setSelectedSequence([])
        } else {
            setSelectedSequence(array)
        }
        console.log("step: " + step)

        if (step-1 <= 1) {
            setModesVisible(0)
            setCasualCompVisible(-1)
            setCurrentlySelected(-1);
            setQueueVisible(false);
        } else if (step-1 == 2) {
            
            
        }

    }


    return (
        <div className="h-full w-full bg-navbar-bg flex items-center justify-center overflow-hidden">
        {/* Centered “wrapper” for both Back + your Select-buttons */}
        <div className="relative inline-block">
        {/* 1) Back button sits in the top-left of this wrapper */}
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
                <motion.div key="quickplay" variants={variants} layout exit="exit">
                  <SelectButton buttonChosen={1}>QUICK PLAY</SelectButton>
                </motion.div>
              )}
              {(modesVisible == 2 || modesVisible == 0)&& (
                <motion.div key="solo" variants={variants} layout exit="exit">
                  <SelectButton buttonChosen={2}>SOLO</SelectButton>
                </motion.div>
              )}
              {(modesVisible == 3 || modesVisible == 0) && (
                <motion.div key="friends" variants={variants} layout exit="exit">
                  <SelectButton buttonChosen={3}>FRIENDS</SelectButton>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2 md:gap-10 flex-col md:flex-row">
              <LayoutGroup>
                <AnimatePresence mode="popLayout">
                  {(casualCompVisible == 0 || casualCompVisible == 1) && (
                    <motion.div key="casual" variants={variants} layout exit="exit">
                      <SelectButton buttonChosen={4} small>
                        CASUAL
                      </SelectButton>
                    </motion.div>
                  )}
                  {(casualCompVisible == 0 || casualCompVisible == 2) && (
                    <motion.div
                      key="competitive"
                      variants={{initial: { opacity: 1, x: 0 },
                        exit: { x:3000, transition: { duration: 0.5 } },
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
                <SelectButton buttonChosen={100} queue>
                  QUEUE
                </SelectButton>
              </motion.div>
            )}
          </LayoutGroup>
        </motion.div>
      </div>
    </div>
  </div>
    );
};