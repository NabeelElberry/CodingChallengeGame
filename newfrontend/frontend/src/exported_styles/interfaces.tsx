import type { Question } from "../pixijs/Utils/interfaces";

export interface SelectButtonProps {
  children: React.ReactNode;
  buttonChosen: number;
  small?: boolean;
  onClick?: () => {};
}

export interface FirebaseJwtPayload {
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string; // <— this is the Firebase‐assigned UID
  sub: string; // often same as user_id
  iat: number;
  exp: number;
  email?: string;
  name?: string;
  // any other custom claims you’ve set
}

export interface MatchResponse {
  initiator: boolean;
  matchDto: {
    user1: string;
    user2: string;
    winner: number | null;
  };
}

// redis hash
export type MatchInfo = {
  [levelKey: `level:${string}`]: number;
  [timeKey: `time:${string}`]: number;
  init: number;
  minigameOrder: string;
  questionOrder: string;
  gameAnswerOrder: string;
};

export type GameState = {
  // Data State
  loading: boolean;
  matchInfo: MatchInfo | null;
  questionInformation: Question | null;
  questionOrder: string | null;
  fullAnswerOrder: string | null;
  minigameOrder: string | null;
  currentGameAnswerOrder: string | null;

  // Game Progress State
  currentStage: number; // position in minigameOrder
  currentMinigameNumber: string | null; // actual game string (e.g., "0", "1", "2")

  // UI/Timing State
  onLoadTime: number; // Time the component mounted
  gameOne: boolean;
  gameTwo: boolean;
  gameThree: boolean;
  randomAnswerIndex: string;
};

export type GameAction =
  | {
      type: "INIT_MATCH_SUCCESS"; // initial match loading
      payload: {
        matchInfo: MatchInfo;
        currentStageNum: number;
        minigameOrder: string;
        questionOrder: string;
        fullAnswerOrder: string;
        onLoadTime: number;
        randomAnswerIndex: string;
      };
    }
  | {
      type: "SET_QUESTION_DATA"; // setting question data (relies init match success)
      payload: {
        questionInformation: Question;
        currentGameAnswerOrder: string;
      };
    }
  // | { type: "NEXT_STAGE"; payload: { nextAnswer: string } } // updates the stage
  | {
      type: "SET_GAME_WIN_STATUS"; // buffer between rounds
      payload: { gameNumber: 1 | 2 | 3; status: boolean };
    }
  | {
      type: "ADVANCE_STAGE";
    }
  | {
      type: "MIX_QUESTION_ORDER";
      payload: { questionInformation: Question };
    };
