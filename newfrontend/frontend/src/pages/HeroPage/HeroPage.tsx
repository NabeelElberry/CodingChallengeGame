import Marquee from "react-fast-marquee"
import { HeroHeader } from "../../components/HeroHeader"
import celeste from "../../assets/9047370-celeste-nintendo-switch-front-cover.jpg"
import ff6 from "../../assets/final_fantasy_vi.jpg"
import ff4 from "../../assets/final-fantasy-iv-snes-jp.jpg"
import { Image } from "@mantine/core"
import CustomButton from "../../components/Button"
export const HeroPage = () => {
    return ( 
    <div className="h-full w-full">
        <HeroHeader />
        <HeroBody />

    </div>
    )
}

const HeroBody = () => {
    return (<div className="flex flex-col mt-5">
        <div className="flex flex-col mb-5">
            <div className="font-extrabold text-7xl text-text-color">GET BETTER AT CODING<p className="text-9xl text-white">WHILE PLAYING</p></div>
            <p className="text-[#ACB4E2] tracking-[0.5em]">LEARN ALGORITHMS AND DATA STRUCTURES THROUGH FAST-PACED CODING MINI-GAMES</p>
        </div>
        <Marquee className="overflow-hidden mb-5">
            <Image src={celeste} h={300}/>
            <div className="w-10"></div>
            <Image src={ff6}  h={300}/>
            <div className="w-10"></div>
            <Image src={ff4}  h={300} />
            <div className="w-10"></div>
        </Marquee>
        <div>
            <CustomButton width={96} height={96} size={"2xl"} spacing={"tracking-widest"}>START</CustomButton>
        </div>
    </div>)
}