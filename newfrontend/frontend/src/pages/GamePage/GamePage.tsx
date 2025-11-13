import { useEffect, useReducer, useState } from "react";
import { useAuth } from "../../store/AuthCtx";
import authorizedCall from "../../misc/authorizedCall";
import DinosaurGame from "../../pixijs/DinosaurGame/DinosaurGame";
import type {
  GameAction,
  GameState,
  MatchInfo,
} from "../../exported_styles/interfaces";
import DragAndDropGame from "../../pixijs/DragAndDropGame/DragAndDropGame";
import SpaceInvadersGame from "../../pixijs/SpaceInvadersGame/SpaceInvadersGame";
import type { Question } from "../../pixijs/Utils/interfaces";
import { useMatchCtx } from "../../store/MatchCtx";
import { retrieveGameOrder } from "../../pixijs/Utils/stringsutils";

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

  function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case "INIT_MATCH_SUCCESS":
        const {
          matchInfo,
          currentStage,
          minigameOrder,
          questionOrder,
          fullAnswerOrder,
          onLoadTime,
        } = action.payload;
        return {
          ...state,
          loading: false,
          matchInfo,
          currentStage: currentStage,
          minigameOrder,
          questionOrder,
          fullAnswerOrder,
          currentMinigameNumber: minigameOrder[currentStage],
          onLoadTime,
        };

      case "SET_QUESTION_DATA":
        return {
          ...state,
          questionInformation: action.payload.questionInformation,
          currentGameAnswerOrder: action.payload.currentGameAnswerOrder,
        };

      case "NEXT_STAGE":
        const newStage = state.currentStage + 1;
        const newMinigame = state.minigameOrder![newStage];

        return {
          ...state,
          currentStage: newStage,
          currentMinigameNumber: newMinigame,
          currentGameAnswerOrder: action.payload.nextAnswer,
          questionInformation: null, // Reset question to trigger loading logic
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
    }
  }

  // initial useEffect for retrieving information about the match
  useEffect(() => {
    const problemSetId = matchCtx.problemSetId;
    const onLoadTime = Math.floor(performance.now()); // time that loaded into match
    const matchInformation = authorizedCall(
      authCtx,
      "GET",
      "getMatchInfoForPlayer",
      undefined,
      { uid: authCtx.UID, problemSetId }
    );

    matchInformation.then((result) => {
      try {
        console.log(`Match Data: `, result.data);
        const matchData = result.data;
        const currentStage = Number(result.data[`level:${authCtx.UID}`]); // the stage the current player is at
        const minigameOrder: string = result.data!.minigameOrder; // string containing order of minigames to be played eg: "12212"

        dispatch({
          type: "INIT_MATCH_SUCCESS",
          payload: {
            matchInfo: matchData,
            currentStage,
            minigameOrder,
            questionOrder: matchData.questionOrder,
            fullAnswerOrder: matchData.fullAnswerOrder,
            onLoadTime,
          },
        });
        console.log(`Index: ${currentStage}`);
        console.log(`Match Information:`, result.data);
      } catch {
        console.log("No result.data found");
      }
    });

    // on dismount
    // update current time
    return () => {
      const previousTime = matchInfo?.[`time:${authCtx.UID}`] ?? 0;
      const currTime = Math.floor(performance.now());

      const newTime = previousTime + (currTime - onLoadTime); // total time in game
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
    console.log("In second useEffect");
    // if current stage is set, or we didn't set questionOrder yet (first useEffect didn't run properly), or questionInformation already set
    if (currentStage == -1 || !questionOrder || questionInformation) return;

    const currentQuestion = questionOrder!.split("_")[currentStage]; // current question we're on, splitting the string

    // getting question information for the minigame
    authorizedCall(
      authCtx,
      "GET",
      "getQuestionByIdAndQuestionNumber",
      undefined,
      { id: matchCtx.problemSetId, questionNumber: currentQuestion }
    ).then((result) => {
      console.log(`Question Information: `, result.data);
      const questionInformation = result.data;

      const currentGameAnswerOrder = retrieveGameOrder(
        fullAnswerOrder!,
        currentStage,
        minigameOrder!,
        currentMinigameNumber!
      );
      dispatch({
        type: "SET_QUESTION_DATA",
        payload: { questionInformation, currentGameAnswerOrder },
      });
    });
  }, [currentStage, questionOrder, questionInformation]);

  const gameWinFunction = (gameNumber: 1 | 2 | 3) => {
    // says that round is won
    dispatch({
      type: "SET_GAME_WIN_STATUS",
      payload: { gameNumber, status: true },
    });

    // update in Redis
    const newStage = currentStage + 1;
    authorizedCall(authCtx, "POST", "editPlayerLevel", "P", {
      uid: authCtx.UID,
      newLevel: newStage,
    });
    console.log(`New Stage: ${newStage}`);

    const nextGameAnswerOrder = retrieveGameOrder(
      fullAnswerOrder!,
      currentStage,
      minigameOrder!,
      currentMinigameNumber!
    );
    dispatch({
      type: "NEXT_STAGE",
      payload: { nextAnswer: nextGameAnswerOrder },
    });

    // reset win status after a short delay
    if (gameNumber === 1)
      setTimeout(
        () =>
          dispatch({
            type: "SET_GAME_WIN_STATUS",
            payload: { gameNumber: 1, status: false },
          }),
        1000
      );
    if (gameNumber === 2)
      setTimeout(
        () =>
          dispatch({
            type: "SET_GAME_WIN_STATUS",
            payload: { gameNumber: 2, status: false },
          }),
        1000
      );
    if (gameNumber === 3)
      setTimeout(
        () =>
          dispatch({
            type: "SET_GAME_WIN_STATUS",
            payload: { gameNumber: 3, status: false },
          }),
        1000
      );

    // locally update state
    // updating the current minigame for the player, based on their new level
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

  // In total:
  // On game completion add mistakes and update time to redis hash with match info, and add one to game
  // On refresh: UPDATE the current time, and ADD mistakes and in react start our current time timer with the time received from redis hash
  // Correct access with optional chaining
  if (loading || !questionInformation) return <div>Loading...</div>;
  // uses player's current level to get the game they should be playing
  // 0 is dinosaur game, 1 is drag and drop game, 2 is space invaders game
  if (currentStage == 5) return <div>Game done</div>;

  if (currentMinigameNumber === "0") {
    // console.log("In Dino Game");
    return (
      <div>
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
      <div>
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
      <div>
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
