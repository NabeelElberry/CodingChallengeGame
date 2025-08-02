import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import CustomButton from "../../components/Button";

export const HomePage = () => {
  return (
    <div className="h-full bg-navbar-bg flex items-center justify-center">
      <HomeBody />
    </div>
  );
};

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};


export const HomeBody = () => {
    const [step, setStep] = useState<0 | 1 | 2>(0);

    const [quickPlayVisible, setQuickPlayVisible] = useState(true)
    const [soloVisible, setSoloVisible] = useState(true)
    const [friendsVisible, setFriendsVisible] = useState(true)
    const [chosenSeqOne, setChosenSeqOne] = useState(0)
    
    useEffect(() => {
        if (chosenSeqOne == 1) {
            setSoloVisible(false);
            setFriendsVisible(false);
        } else if (chosenSeqOne == 2) {
            setQuickPlayVisible(false);
            setFriendsVisible(false);
        } else if (chosenSeqOne == 3) {
            setQuickPlayVisible(false);
            setSoloVisible(false);
        }
    }, [chosenSeqOne])

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
        whileHover: {
            color: "#ffffff",
            transition: {duration: 1}
        }
    }

    interface SelectButtonProps {
        children: React.ReactNode;
        buttonChosen: number;
    }

    const SelectButton = ({buttonChosen, children} : SelectButtonProps) => {
        return <motion.button 
            
            onClick={() => setChosenSeqOne(buttonChosen)} className="bg-text-color text-button-text rounded-2xl 
            duration-500 flex items-center justify-center text-center
            hover:cursor-pointer hover:text-white
            w-80 h-30 md:w-200 3xl:h-70 3xl:w-240 ">
                <motion.span className="text-3xl 3xl:text-6xl"
                variants={textFlashVariant}
                animate={chosenSeqOne == buttonChosen ? "flash" : "idle"} 
                whileHover={chosenSeqOne != buttonChosen ? {
                color: "#ffffff",
                transition: {duration: 0.01, ease: "linear"}
            } : {}}
                >{children}</motion.span>
        </motion.button>
    }



    return (
        <motion.div className="flex flex-col items-center h-full justify-center gap-6">
            <LayoutGroup>
                <AnimatePresence mode="popLayout">
                    {quickPlayVisible && 
                    <motion.div key="quickplay" variants={variants} layout exit="exit">
                        <SelectButton buttonChosen={1}>QUICK PLAY</SelectButton>
                    </motion.div>}
             
                    {soloVisible && <motion.div key="solo" layout variants={variants} exit="exit">
                        <SelectButton buttonChosen={2}>SOLO</SelectButton>
                    </motion.div>}
        
                    {friendsVisible && <motion.div key="friends" layout variants={variants} exit="exit">
                        <SelectButton buttonChosen={3}>FRIENDS</SelectButton>
                    </motion.div>}
                </AnimatePresence>
            </LayoutGroup>
        
        </motion.div>
    );
};
