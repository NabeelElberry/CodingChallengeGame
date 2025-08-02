import { Button, Image, Modal, PasswordInput, TextInput } from "@mantine/core"
import logo from "../../assets/logo.png";
import CustomButton from "../../components/Button";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { button } from "motion/react-client";
import { auth, createUser, signInUser } from "../../config/firebase";
import { useUrl } from "../../store/AuthCtx";
import { signOut } from "firebase/auth";
import {jwtDecode} from "jwt-decode";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export const HeroHeader = () => {
    const authCtx = useUrl();
    const navigate = useNavigate();


    const signUpForm = useForm({
        mode: 'uncontrolled',
        initialValues: {
            username: '',
            email: '',
            password: '',
        },

        validate: {
            username: (value) => /^[a-zA-Z0-9_]{3,20}$/.test(value) ? null : 'Username must be 3-20 characters, only letters, numbers, or underscores',
            password: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(value) ? null : 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol',
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
        },
    });
    
    const loginForm = useForm({
        mode: 'uncontrolled',
        initialValues: {
            email: '',
            password: '',
        },

        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
        },
    })

    const handleUserCreation = async (username: string, email: string, password: string) => {
        const userCredential = await createUser(email, password) // firebase
        const uid = userCredential.user.uid;
        // adding user into dynamodb
        const response = await axios.post(`http://localhost:5270/User`, 
            {
                username: username,
                email: email,
                password: password,
                id: uid
            }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        close();
        if (response.status == 200) {
            return true;
        } else {
            return false;
        }
        
    }

    const handleUserSignIn = async (email: string, password: string) => {
        const userCredential = await signInUser(email, password);
        
        if (!userCredential.user) {
            throw new Error("Username and password do not match.")
        } else {
            const token = await userCredential.user.getIdToken(true);
            authCtx.setAuthenticationStatus(true);
            console.log("authenticaiton status: ", authCtx.authenticationStatus)
            authCtx.setAccessToken(token);
            localStorage.setItem("access_token", token);
            navigate("/home");
            close();
            return true;
       }
    }

    const handleUserSignOut = async () => {
        if (!authCtx.authenticationStatus) {
            throw new Error("User not signed in.")
        } else {
            await signOut(auth);
            navigate("/");
            authCtx.setAuthenticationStatus(false);
            localStorage.removeItem("access_token");
        }
    }
    
    const [opened, {open, close}] = useDisclosure(false);
    const [buttonClicked, setButtonClicked] = useState(0); // 0 is sign up, 1 is login

    const openModal = (distinguisher: number) => {
        setButtonClicked(distinguisher);
        open()
    }

    return <div className="bg-navbar-bg flex flex-row w-full p-3 items-center shadow-sm">
        <Image src={logo} w={80} className="w-24 h-auto"/>
        <div className="grow h-min flex flex-row gap-5 justify-end">
            <Modal size={"md"} centered transitionProps={{ transition: 'fade', duration: 200 }} opened={opened} onClose={close} title={buttonClicked == 0 ? "Sign Up" : "Login"} 
            styles={{
                content: {
                    backgroundColor: '#111117',
                    color: 'white',
                    fontFamily:'Pixelify Sans',
                },
                title: {
                    color: 'white',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    pointerEvents: 'none', // let clicks pass through if needed
                },
                header: {
                    backgroundColor: '#111117',
                    position: 'relative'
                },
                close: {
                    backgroundColor: '#1E1E29',
                }
            }}>
                {buttonClicked == 0 ? 
                <form className="flex flex-col justify-center gap-2" onSubmit={signUpForm.onSubmit(async (values) => await handleUserCreation(values["username"], values["email"], values["password"]) )}>
                    <TextInput 
                        withAsterisk
                        label="Email"
                        placeholder="Enter email..."
                        key={signUpForm.key('email')}
                        {...signUpForm.getInputProps('email')}
                    />

                    <TextInput 
                        withAsterisk
                        label="Username"
                        placeholder="Enter username..."
                        key={signUpForm.key('username')}
                        {...signUpForm.getInputProps('username')}
                    />

                    <PasswordInput 
                        withAsterisk
                        label="Password"
                        key={signUpForm.key('password')}
                        {...signUpForm.getInputProps('password')}
                    />
                    <div className="w-full flex justify-center">
                        <button type="submit" className="bg-text-color rounded-lg p-1 hover:cursor-pointer">Sign Up</button> 
                    </div>
                </form>
                :
                <form className="flex flex-col justify-center gap-2" onSubmit={loginForm.onSubmit(async (values) => await handleUserSignIn(values["email"], values["password"]))}>
                    <TextInput 
                        withAsterisk
                        label="Email"
                        placeholder="Enter email..."
                        key={loginForm.key('email')}
                        {...loginForm.getInputProps('email')}
                    />
                    <PasswordInput 
                        withAsterisk
                        label="Password"
                        key={loginForm.key('password')}
                        {...loginForm.getInputProps('password')}
                    />
                    <div className="w-full flex justify-center">
                        <button type="submit" className="bg-text-color rounded-lg p-1 hover:cursor-pointer">Login</button> 
                    </div>
                </form>
                }
            </Modal>
            {!authCtx.authenticationStatus ? <>
            <CustomButton onClick={() => openModal(0)}>Sign Up</CustomButton>
            <CustomButton onClick={() => openModal(1)}>Login</CustomButton></> : 
            <CustomButton onClick={() => handleUserSignOut()}>Sign Out</CustomButton>}
        </div>
    </div>



}

