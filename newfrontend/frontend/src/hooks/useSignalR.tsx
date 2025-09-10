import * as signalR from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";
import { auth } from "../config/firebase";
import { useMatchCtx } from "../store/MatchCtx";

const useSignalR = () => {
  const [foundStatus, setFoundStatus] = useState(false);

  const connectionRef = useRef<signalR.HubConnection>(null);
  const matchCtx = useMatchCtx();
  useEffect(() => {
    const websockets = async () => {
      const token = await auth.currentUser?.getIdToken();
      console.log(`auth curr user: ${auth.currentUser}`);
      if (!token) {
        throw new Error("...");
      }
      const connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5270/matchhub", {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .build();

      connectionRef.current = connection;
      const connectionR = connectionRef.current;
      // ✅ Register listeners before starting connection
      connectionR.on("MatchFound", () => {
        console.log("📦 Matched!");

        setFoundStatus(true);
      });

      connectionR.on("ReceiveCode", (userId, message) => {
        console.log(`💬 [${userId}]: ${message}`);
      });

      connectionR.on("MatchDeclined", () => {
        console.log("Match declined");
        matchCtx.setMatchFound(true);
        matchCtx.setMatchStatus("DECLINED");
      });

      connectionR.on("MatchAccepted", () => {
        console.log("Match accepted");
        matchCtx.setMatchFound(true);
        matchCtx.setMatchStatus("ACCEPTED");
      });

      connectionR.onclose((err) => {
        console.error("❌ SignalR connection closed:", err?.message || err);
      });

      try {
        await connectionR.start();
        console.log("✅ SignalR connected");
      } catch (err) {
        console.error("❌ SignalR failed to connect:", err);
      }
    };
    websockets();
  }, []);

  return { connectionRef, foundStatus, setFoundStatus };
};

export default useSignalR;
