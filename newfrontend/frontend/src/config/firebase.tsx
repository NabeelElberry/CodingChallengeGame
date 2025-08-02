import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import firebase from "firebase/compat/app";
import axios from "axios";
import { useUrl } from "../store/AuthCtx";

const firebaseConfig = {
  apiKey: "AIzaSyC1TyBaoI10D2jIx_P0xS4nUwy9qL4Jvao",
  authDomain: "code1v1authentication.firebaseapp.com",
  projectId: "code1v1authentication",
  storageBucket: "code1v1authentication.firebasestorage.app",
  messagingSenderId: "726688198821",
  appId: "1:726688198821:web:5d44dbd27681ab43335d4c",
  measurementId: "G-6WL9EF80FN"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app);

export const createUser = async (email: string, password: string) => {
    return await createUserWithEmailAndPassword(auth, email, password); 
}

export const signInUser = async (email: string, password: string) => {
    return await signInWithEmailAndPassword(auth, email, password);
}