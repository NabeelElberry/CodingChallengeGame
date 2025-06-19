import { createContext, useContext } from "react";

export const UrlCtx = createContext({
  API_URL: "http://localhost:8080/api",
});

export const UrlContextProvider = ({ children }:{ children: React.ReactNode }) => {

  const API_URL = "http://localhost:5270";

  return (
    <UrlCtx.Provider
      value={{
        API_URL: "http://localhost:5270",
      }}
    >
      {children}
    </UrlCtx.Provider>
  );
};

export const useUrl = () => useContext(UrlCtx);