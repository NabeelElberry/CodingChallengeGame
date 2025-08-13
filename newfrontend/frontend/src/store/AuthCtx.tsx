import type { User } from "firebase/auth";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";

interface UrlContextValue {
  API_URL: string;
  authenticationStatus: boolean;
  setAuthenticationStatus: Dispatch<SetStateAction<boolean>>;
  accessToken: string;
  setAccessToken: Dispatch<SetStateAction<string>>;
  UID: string;
  setUID: Dispatch<SetStateAction<string>>;
  mmr: number;
  setMmr: Dispatch<SetStateAction<number>>;
  user: User | null;                          // ← allow User or null
  setUser: Dispatch<SetStateAction<User | null>>;
}

const DEFAULT_VALUE: UrlContextValue = {
  API_URL: "http://localhost:5270",
  authenticationStatus: false,
  setAuthenticationStatus: () => {},
  accessToken: "",
  setAccessToken: () => {},
  UID: "",
  setUID: () => {},
  mmr: 0,
  setMmr: () => {},
  user: null,                                 // ← real default
  setUser: () => {},                          // ← no-op setter
};

export const UrlCtx = createContext<UrlContextValue>(DEFAULT_VALUE);

export const UrlContextProvider = ({ children }: { children: ReactNode }) => {
  const API_URL = "http://localhost:5270";
  const [authenticationStatus, setAuthenticationStatus] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [UID, setUID]                 = useState("");
  const [mmr, setMmr]                 = useState(0);
  const [user, setUser]               = useState<User | null>(null);

  return (
    <UrlCtx.Provider
      value={{
        API_URL,
        authenticationStatus,
        setAuthenticationStatus,
        accessToken,
        setAccessToken,
        UID,
        setUID,
        mmr,
        setMmr,
        user,
        setUser,
      }}
    >
      {children}
    </UrlCtx.Provider>
  );
};

export const useUrl = () => useContext(UrlCtx);