import { createContext, useContext, useState, type ReactNode } from "react";

export const MatchCtx = createContext({
  matchFound: false,
  setMatchFound: (p0: boolean) => {},
  matchStatus: "NONE",
  setMatchStatus: (p0: "DECLINED" | "ACCEPTED" | "NONE") => {},
});

export const MatchCtxProvider = ({ children }: { children: ReactNode }) => {
  const [matchFound, setMatchFound] = useState(false);
  const [matchStatus, setMatchStatus] = useState<
    "DECLINED" | "ACCEPTED" | "NONE"
  >("NONE");
  return (
    <MatchCtx.Provider
      value={{
        matchFound,
        setMatchFound,
        matchStatus,
        setMatchStatus,
      }}
    >
      {children}
    </MatchCtx.Provider>
  );
};

export const useMatchCtx = () => useContext(MatchCtx);
