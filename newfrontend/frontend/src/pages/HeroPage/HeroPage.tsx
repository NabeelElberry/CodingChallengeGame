import Marquee from "react-fast-marquee"
import { HeroHeader } from "./HeroHeader"
import celeste from "../../assets/9047370-celeste-nintendo-switch-front-cover.jpg"
import ff6 from "../../assets/final_fantasy_vi.jpg"
import ff4 from "../../assets/final-fantasy-iv-snes-jp.jpg"
import { Image } from "@mantine/core"
import CustomButton from "../../components/Button"
export const HeroPage = () => {
    return ( 
    <div className="flex flex-col grow h-full w-full">
        <HeroBody />
    </div>
    )
}

const HeroBody = () => {
    return (
        
        // Changed h-screen to flex-grow to make it take up remaining vertical space
        // Added pt-5 for top padding instead of mt-5 for the entire div
        <div className="flex flex-col pt-2 grow ">
            <div className="flex flex-col grow items-center justify-center">
                <div className="flex flex-col">
                <div className="font-extrabold text-3xl lg:text-7xl text-text-color pb-2">GET BETTER AT CODING<p className="text-5xl lg:text-9xl text-white">WHILE PLAYING</p></div>
                <p className="text-[#ACB4E2] text-sm md:text-lg tracking-[0.5em]">LEARN ALGORITHMS AND DATA STRUCTURES THROUGH FAST-PACED CODING MINI-GAMES</p>
            </div>
            <Marquee className="pt-10 overflow-hidden">
                <Image src={celeste} className="h-60 3xl:h-100"/>
                <div className="w-10"></div>
                <Image src={ff6} className="h-60 3xl:h-100"/>
                <div className="w-10"></div>
                <Image src={ff4} className="h-60 3xl:h-100" />
                <div className="w-10"></div>
            </Marquee>
            </div>
            {/* This div correctly centers the button within its available space */}
            <div className="flex items-center justify-center grow">
                <CustomButton className={"w-80 h-40 md:h-45 3xl:h-50 md:w-150 3xl:w-200"} tailwindTextSize={"text-5xl md:text-8xl 3xl:text-9xl"} pulse={true}>START</CustomButton>
            </div>
        </div>
    )
}
// width={800} height={300} size={"9xl"} spacing={"tracking-widest"}