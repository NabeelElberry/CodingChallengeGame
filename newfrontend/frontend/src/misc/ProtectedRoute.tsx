import { Navigate } from "react-router-dom";
import { useAuth } from "../store/AuthCtx";
import { useEffect, useState } from "react";
import axios from "axios";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const authCtx = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
        try {
          const token = await authCtx.user?.getIdToken(true);
          await axios.get(`${authCtx.API_URL}/auth`, {
          headers: {
              Authorization: `Bearer ${token}`
          },
          });
          authCtx.setAuthenticationStatus(true);
        }
        catch {
          authCtx.setAuthenticationStatus(false);
        } 
        setChecking(false);
    })();
  }, []);

  if (checking) {
    return <div>Loading…</div>;          // or your spinner
  }

  // if still not authenticated, redirect to public HeroPage
  if (!authCtx.authenticationStatus) {
    return <Navigate to="/" replace />;
  }
  // Otherwise render the protected content
  return <>{children}</>;
}