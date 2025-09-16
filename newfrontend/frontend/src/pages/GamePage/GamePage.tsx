import { useEffect, useState } from "react";
import { useAuth } from "../../store/AuthCtx";
import authorizedCall from "../../misc/authorizedCall";
import DinosaurGame from "../../pixijs/DinosaurGame/DinosaurGame";
import type { MatchInfo } from "../../exported_styles/interfaces";

export const GamePage = () => {
  // essentially we're gonna call to get the information of the match using the details loaded
  // from local host and the context
  const authCtx = useAuth();
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [levelHashTag, setLevelHashTag] = useState<`level:${string}`>("level:");
  useEffect(() => {
    const matchInformation = authorizedCall(
      authCtx,
      "GET",
      "getMatchInfoForPlayer",
      undefined,
      { uid: authCtx.UID }
    );

    matchInformation.then((result) => {
      console.log(`Match Information:`, result.data);
      setMatchInfo(result.data);
    });
    setLevelHashTag(`level:${authCtx.UID}`);
  }, []);

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
  const levelValue = matchInfo?.[levelHashTag] ?? null;
  console.log(`Level value: ${levelValue}`);
  if (levelValue === 0) {
    // handle level 0
  } else if (levelValue !== null) {
    // handle other levels
  }
  return <div>Game</div>;
};
