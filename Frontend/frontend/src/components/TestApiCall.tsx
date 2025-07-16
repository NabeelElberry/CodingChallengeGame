import { Button } from "@heroui/button"
import { getAuth } from "firebase/auth"
import { initializeApp } from "firebase-admin";
export const TestApiCall = () => {
    const auth = getAuth();
    const getFirebaseToken = async () => {
        const user = auth.currentUser
        if (!user) throw new Error("User not signed in");
    
        const token = await user.getIdToken(true);
        return token;
    }


    const apiCall = async () => {
        const token = await getFirebaseToken();
        const response = await fetch("http://localhost:5270/Question", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({  
                "name": "string",
                "description": "string",
                "difficulty": 0})
        });
        const result = await response.json();
        console.log(result);
    }

    const checkClaims = async () => {
        const tokenResullt = await auth.currentUser?.getIdTokenResult(true);
        console.log(`Token: ${await auth.currentUser?.getIdToken()}`)
        console.log(tokenResullt?.claims.role);
    }
    
    return (
        <div>
            <Button onPress = {apiCall}>Test Call</Button>
            <Button onPress = {checkClaims}>Check Claim</Button>
        </div>
    )
}


export const MakeAdminButton = () => {
    return (<Button></Button>)
}