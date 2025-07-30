import { Button, Image } from "@mantine/core"
import logo from "../assets/logo.png";
import CustomButton from "./Button";
export const HeroHeader = () => {
    return <div className="bg-navbar-bg flex flex-row w-full p-3 items-center shadow-sm">
        <Image src={logo} w={80} className="w-24 h-auto"/>
        <div className="grow h-min flex flex-row gap-5 justify-end">
            <CustomButton>Sign Up</CustomButton>
            <CustomButton >Login</CustomButton>
        </div>
    </div>
}