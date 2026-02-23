import { useEffect, useReducer, useRef, useState } from "react";
import { useAuth } from "../../store/AuthCtx";
import authorizedCall from "../../misc/authorizedCall";
import DinosaurGame from "../../pixijs/DinosaurGame/DinosaurGame";
import type { GameAction, GameState } from "../../exported_styles/interfaces";
import DragAndDropGame from "../../pixijs/DragAndDropGame/DragAndDropGame";
import SpaceInvadersGame from "../../pixijs/SpaceInvadersGame/SpaceInvadersGame";
import useSignalR from "../../hooks/useSignalR";
import { useMatchCtx } from "../../store/MatchCtx";
import { retrieveGameOrder } from "../../pixijs/Utils/stringsutils";
import { GameCountdown } from "../../components/GameCountdown";
import { MatchResultScreen } from "../../components/MatchResultScreen";
import { CheckForInMatch } from "../../components/CheckForInMatch";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
export const GamePage = () => {
  // essentially we're gonna call to get the information of the match using the details loaded
  // from local host and the context

  const initialGameState: GameState = {
    loading: true,
    matchInfo: null,
    questionInformation: null,
    questionOrder: null,
    fullAnswerOrder: null,
    minigameOrder: null,
    currentGameAnswerOrder: null,
    currentStage: -1,
    currentMinigameNumber: null,
    onLoadTime: 0,
    gameOne: false,
    gameTwo: false,
    gameThree: false,
  };
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const authCtx = useAuth();
  const matchCtx = useMatchCtx();
  const [countdown, setCountdown] = useState(false);
  const [matchOver, setMatchOver] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loading,
    matchInfo,
    questionInformation,
    questionOrder,
    fullAnswerOrder,
    minigameOrder,
    currentGameAnswerOrder,
    currentStage,
    currentMinigameNumber,
    onLoadTime,
    gameOne,
    gameTwo,
    gameThree,
  } = state;
  const { connectionRef } = useSignalR();
  const timeSentRef = useRef(false);
  const matchInfoRef = useRef(matchInfo);
  useEffect(() => {
    matchInfoRef.current = matchInfo;
  }, [matchInfo]);
  function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case "INIT_MATCH_SUCCESS":
        console.log("Game action: ", action);
        const {
          matchInfo,
          currentStageNum,
          minigameOrder,
          questionOrder,
          fullAnswerOrder,
          onLoadTime,
        } = action.payload;

        console.log(
          "Minigame order: ",
          minigameOrder,
          " current stage num: ",
          currentStageNum,
        );
        return {
          ...state,
          loading: false,
          matchInfo,
          currentStage: currentStageNum,
          minigameOrder,
          questionOrder,
          fullAnswerOrder,
          currentMinigameNumber: minigameOrder[currentStageNum],
          onLoadTime,
        };

      case "SET_QUESTION_DATA":
        return {
          ...state,
          questionInformation: action.payload.questionInformation,
          currentGameAnswerOrder: action.payload.currentGameAnswerOrder,
        };

      case "SET_GAME_WIN_STATUS":
        switch (action.payload.gameNumber) {
          case 1:
            return { ...state, gameOne: action.payload.status };
          case 2:
            return { ...state, gameTwo: action.payload.status };
          case 3:
            return { ...state, gameThree: action.payload.status };
          default:
            return state;
        }

      case "ADVANCE_STAGE":
        const nextStage = state.currentStage + 1;
        return {
          ...state,
          currentStage: nextStage,
          currentMinigameNumber: state.minigameOrder![nextStage],
          questionInformation: null,
          currentGameAnswerOrder: null,
        };
      default:
        return state;
    }
  }

  // useEffect for player loading back into game on reconnecting
  useEffect(() => {
    if (location.state) {
      dispatch({ type: "INIT_MATCH_SUCCESS", payload: location.state.payload });
    }
  }, [location]);

  // initial useEffect for retrieving information about the match
  useEffect(() => {
    const onLoadTime = Math.floor(performance.now()); // time that loaded into match
    const matchInformation = authorizedCall(
      authCtx,
      "GET",
      "getMatchInfoForPlayer",
      "P",
      null,
    );

    matchInformation.then((result) => {
      try {
        console.log(`Match Data: `, result.data);
        const matchData = result.data;
        const currentStage = Number(result.data[`level:${authCtx.UID}`]); // the stage the current player is at
        const minigameOrder: string = result.data!.minigameOrder; // string containing order of minigames to be played eg: "12212"

        console.log("Payload: ", {
          matchInfo: matchData,
          currentStageNum: currentStage,
          minigameOrder,
          questionOrder: matchData.questionOrder,
          fullAnswerOrder: matchData.fullAnswerOrder,
          onLoadTime,
        });

        dispatch({
          type: "INIT_MATCH_SUCCESS",
          payload: {
            matchInfo: matchData,
            currentStageNum: currentStage,
            minigameOrder,
            questionOrder: matchData.questionOrder,
            fullAnswerOrder: matchData.fullAnswerOrder,
            onLoadTime,
          },
        });
        // console.log(`Index: ${currentStage}`);
        // console.log(`Match Information:`, result.data);
      } catch {
        console.log("No result.data found");
      }
    });

    // on dismount
    // update current time (only if matchOver didn't already send it)
    return () => {
      if (timeSentRef.current) return;
      timeSentRef.current = true;
      const previousTime = matchInfoRef.current?.[`time:${authCtx.UID}`] ?? 0;
      const currTime = Math.floor(performance.now());

      const newTime = Number(previousTime) + (currTime - onLoadTime); // total time in game

      console.log(
        "Dismounting... PREVTIME: ",
        previousTime,
        " currTime: ",
        currTime,
        " onLoadTime: ",
        onLoadTime,
        " newTime: ",
        newTime,
      );
      // updates the current time for the player in the redis hash
      authorizedCall(authCtx, "POST", "editPlayerTime", "P", {
        uid: authCtx.UID,
        newTime: newTime,
      });
    };
  }, []);

  // this useEffect runs when the initial match information has been loaded
  // and is used for loading in the question data
  useEffect(() => {
    if (currentStage === -1 || !questionOrder || questionInformation) return;

    let cancelled = false;
    // check for game won condition
    if (currentStage == 5) {
      // invoke the signal R to notify both all clients of winner
      connectionRef.current?.invoke("ReceivedClientWin");
      return () => {
        console.log("Match over...");
      };
    }

    const fetchQuestionData = async () => {
      if (matchCtx.problemSetId == "") {
        console.log("Problem set ID is null...");
        navigate("/home");
        return;
      }

      const currentQuestion = questionOrder.split("_")[currentStage];

      const result = await authorizedCall(
        authCtx,
        "GET",
        "getQuestionByIdAndQuestionNumber",
        undefined,
        { id: matchCtx.problemSetId, questionNumber: currentQuestion },
      );

      if (cancelled) return;

      const currentGameAnswerOrder = retrieveGameOrder(
        fullAnswerOrder!,
        currentStage,
        minigameOrder!,
        currentMinigameNumber!,
      );

      dispatch({
        type: "SET_QUESTION_DATA",
        payload: {
          questionInformation: result.data,
          currentGameAnswerOrder,
        },
      });
    };

    fetchQuestionData();

    return () => {
      cancelled = true;
    };
  }, [
    currentStage,
    questionOrder,
    fullAnswerOrder,
    minigameOrder,
    currentMinigameNumber,
    location,
  ]);

  // this one just updates the game page to be for win whenever the matchCtx changes from signalR
  useEffect(() => {
    setMatchOver(matchCtx.matchOver);
    if (matchCtx.matchOver && !timeSentRef.current) {
      timeSentRef.current = true;
      const previousTime = matchInfo?.[`time:${authCtx.UID}`] ?? 0;
      const currTime = Math.floor(performance.now());
      const newTime = previousTime + (currTime - onLoadTime);
      authorizedCall(authCtx, "POST", "editPlayerTime", "P", {
        uid: authCtx.UID,
        newTime: newTime,
      });
    }
  }, [matchCtx.matchOver]);

  // incrementation of stages happens here
  const gameWinFunction = async (gameNumber: 1 | 2 | 3) => {
    // says that round is won
    if (countdown) return; // no double-advance

    dispatch({
      type: "SET_GAME_WIN_STATUS",
      payload: { gameNumber, status: true },
    });

    await authorizedCall(authCtx, "POST", "editPlayerLevel", "P", {
      uid: authCtx.UID,
      newLevel: 1,
    });
    // console.log(`New Stage: ${newStage}`);

    setCountdown(true); // start countdown for next game

    // const nextGameAnswerOrder = retrieveGameOrder(
    //   fullAnswerOrder!,
    //   newStage,
    //   minigameOrder!,
    //   currentMinigameNumber!
    // );
    dispatch({
      type: "ADVANCE_STAGE",
    });

    // reset win status after a short delay
    if (gameNumber === 1)
      setTimeout(
        () =>
          dispatch({
            type: "SET_GAME_WIN_STATUS",
            payload: { gameNumber: 1, status: false },
          }),
        1000,
      );
    if (gameNumber === 2)
      setTimeout(
        () =>
          dispatch({
            type: "SET_GAME_WIN_STATUS",
            payload: { gameNumber: 2, status: false },
          }),
        1000,
      );
    if (gameNumber === 3)
      setTimeout(
        () =>
          dispatch({
            type: "SET_GAME_WIN_STATUS",
            payload: { gameNumber: 3, status: false },
          }),
        1000,
      );

    // locally update state
    // updating the current minigame for the player, based on their new level
  };
  const onComplete = () => {
    setCountdown(false);
  };

  // what we should be doing is on every match completion we should update our redis list
  // with the current state of what level each player is on,
  // we also will need to keep track of the total mistakes of the player
  // this will need to be taken care of in the redis hash, in case of refresh
  // NEEDS TO BE UPDATED IMMEDIATELY, else the player can refresh and reset their mistake count

  // The issue we face now is that refreshing the page would reset the current timer in the way we handle it
  // Maybe we could do on dismount ( useEffect ) it will add up the current time into the redis hash, this way
  // there's absolutely no way to escape the current time you've accumulated

  // Update the current time, adding is problematic with multiple refreshes

  // UPDATE is simply changing the value
  // ADD is accumulating it

  if (matchOver == true) {
    const sessionMs =
      onLoadTime > 0 ? Math.floor(performance.now()) - onLoadTime : 0;
    const totalTimeMs =
      Number(matchInfo?.[`time:${authCtx.UID}` as `time:${string}`] ?? 0) +
      sessionMs;
    return (
      <MatchResultScreen won={matchCtx.wonMatch} totalTimeMs={totalTimeMs} />
    );
  }

  // In total:
  // On game completion add mistakes and update time to redis hash with match info, and add one to game
  // On refresh: UPDATE the current time, and ADD mistakes and in react start our current time timer with the time received from redis hash
  // Correct access with optional chaining
  if (loading || !questionInformation) {
    console.log("Loading...!");
    console.log("QUESTION INFORMATION: ", questionInformation);

    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <CheckForInMatch />
        <div>Loading...</div>
      </div>
    );
  }

  // uses player's current level to get the game they should be playing
  // 0 is dinosaur game, 1 is drag and drop game, 2 is space invaders game

  if (countdown) {
    return <GameCountdown onComplete={onComplete} />;
  }

  // check for winner
  if (currentMinigameNumber === "0") {
    // console.log("In Dino Game");
    return (
      <div style={{ color: "white" }}>
        <div>ROUND {currentStage} </div>
        <p>{questionInformation?.questionText}</p>
        {questionInformation?.answerChoices.map((answerChoice, index) => (
          <p key={index}>
            {index}:{answerChoice}
          </p>
        ))}

        <DinosaurGame
          key={currentStage}
          setGameWon={() => gameWinFunction(1)}
          gameStatus={gameOne}
          gameInformation={questionInformation!}
          answerOrder={currentGameAnswerOrder!}
        />
      </div>
    );
  } else if (currentMinigameNumber === "1") {
    // console.log("In Drag/Drop Game");
    return (
      <div style={{ color: "white" }}>
        <div>ROUND {currentStage} </div>
        <p>{questionInformation?.questionText}</p>
        {questionInformation?.answerChoices.map((answerChoice, index) => (
          <p key={index}>
            {index}:{answerChoice}
          </p>
        ))}
        <DragAndDropGame
          key={currentStage}
          setGameWon={() => gameWinFunction(2)}
          gameStatus={gameTwo}
          gameInformation={questionInformation!}
          answerOrder={currentGameAnswerOrder!}
        />
      </div>
    );
  } else {
    // console.log("In Space Invaders Game");
    return (
      <div style={{ color: "white" }}>
        <div>ROUND {currentStage} </div>
        <p>{questionInformation?.questionText}</p>
        {questionInformation?.answerChoices.map((answerChoice, index) => (
          <p key={index}>
            {index}:{answerChoice}
          </p>
        ))}
        <SpaceInvadersGame
          key={currentStage}
          setGameWon={() => gameWinFunction(3)}
          gameStatus={gameThree}
          gameInformation={questionInformation!}
          answerOrder={currentGameAnswerOrder!}
        />
      </div>
    );
  }
  return <div>Game</div>;
};
