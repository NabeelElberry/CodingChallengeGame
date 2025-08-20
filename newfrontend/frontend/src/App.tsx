import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { HeroPage } from "./pages/HeroPage/HeroPage";
import { HeroHeader } from "./pages/HeroPage/HeroHeader";
import { useAuth } from "./store/AuthCtx";
import { HomePage } from "./pages/HomePage/HomePage";
import { ProtectedRoute } from "./misc/ProtectedRoute";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import { TestPage } from "./pages/TestPage/TestPage";
import DinosaurGame from "./pixijs/DinosaurGame/DinosaurGame";
import TestPixiGame from "./pixijs/TestPixiGame";

function App() {
  const authCtx = useAuth();
  const [loading, setLoading] = useState(true);
  // refreshes the user token on refresh
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      authCtx.setUser(user);
      console.log("Auth state changed");
      setLoading(false);
    }
    setLoading(false);
  });

  if (!loading) {
    return (
      <div className="flex flex-col h-full">
        <BrowserRouter>
          <HeroHeader />
          <Routes>
            <Route path="/" element={<HeroPage />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test"
              element={
                <ProtectedRoute>
                  <DinosaurGame />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </div>
    );
  } else {
    return <div>Loading...</div>;
  }
}

export default App;
