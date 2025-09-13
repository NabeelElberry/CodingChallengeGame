import { useEffect } from "react";
import { useAuth } from "../../store/AuthCtx";
import authorizedCall from "../../misc/authorizedCall";

export const GamePage = () => {
  // essentially we're gonna call to get the information of the match using the details loaded
  // from local host and the context
  const authCtx = useAuth();

  useEffect(() => {
    const matchInformation = authorizedCall(
      authCtx,
      "GET",
      "getMatchInfoForPlayer",
      undefined,
      { uid: authCtx.UID }
    );

    matchInformation.then((result) =>
      console.log(`Match Information:`, result.data)
    );
  }, []);

  return <div>GamePage</div>;
};
