import { createContext, useContext, useState, type ReactNode } from "react";

export const MatchCtx = createContext(
    {
        matchFound: false,
        setMatchFound: (p0: boolean) => {}
    }
);

export const MatchCtxProvider = ({ children }: { children: ReactNode }) => {
  const [matchFound, setMatchFound] = useState(false);

  return (
    <MatchCtx.Provider
      value={{
        matchFound,
        setMatchFound
        
      }}
    >
      {children}
    </MatchCtx.Provider>
  );
};

export const useMatchCtx = () => useContext(MatchCtx);