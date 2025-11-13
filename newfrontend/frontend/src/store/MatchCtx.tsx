import { createContext, useContext, useState, type ReactNode } from "react";

export const MatchCtx = createContext({
  matchFound: false,
  setMatchFound: (p0: boolean) => {},
  matchStatus: "NONE",
  setMatchStatus: (p0: "DECLINED" | "ACCEPTED" | "NONE") => {},
  problemSetId: "",
  setProblemSetId: (p0: string) => {},
  loadGame: false,
  setLoadGame: (p0: boolean) => {},
});

export const MatchCtxProvider = ({ children }: { children: ReactNode }) => {
  const [matchFound, setMatchFound] = useState(false);
  const [matchStatus, setMatchStatus] = useState<
    "DECLINED" | "ACCEPTED" | "NONE"
  >("NONE");
  const [problemSetId, setProblemSetId] = useState<string>("");
  const [loadGame, setLoadGame] = useState(false);
  return (
    <MatchCtx.Provider
      value={{
        matchFound,
        setMatchFound,
        matchStatus,
        setMatchStatus,
        problemSetId,
        setProblemSetId,
        loadGame,
        setLoadGame,
      }}
    >
      {children}
    </MatchCtx.Provider>
  );
};

export const useMatchCtx = () => useContext(MatchCtx);
