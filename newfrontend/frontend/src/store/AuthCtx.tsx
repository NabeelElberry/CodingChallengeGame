import { createContext, useContext, useState } from "react";

export const UrlCtx = createContext({
  API_URL: "http://localhost:8080/api",
  authenticationStatus: false,
  setAuthenticationStatus: (p0: boolean) => {},
  accessToken: "",
  setAccessToken: (p0: string) => {}
});

export const UrlContextProvider = ({ children }:{ children: React.ReactNode }) => {

  const API_URL = "http://localhost:5270";
  const [authenticationStatus, setAuthenticationStatus] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  return (
    <UrlCtx.Provider
      value={{
        API_URL: API_URL,
        authenticationStatus: authenticationStatus,
        setAuthenticationStatus: setAuthenticationStatus,
        accessToken: accessToken,
        setAccessToken: setAccessToken
      }}
    >
      {children}
    </UrlCtx.Provider>
  );
};

export const useUrl = () => useContext(UrlCtx);