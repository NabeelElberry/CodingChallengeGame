import { Navigate } from "react-router-dom";
import { useUrl } from "../store/AuthCtx";
import { useEffect, useState } from "react";
import axios from "axios";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const authCtx = useUrl();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
        try {
            await axios.get(`${authCtx.API_URL}/auth`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token")}`
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