import * as signalR from "@microsoft/signalr";
import { useMatchCtx } from "../../store/MatchCtx";

const matchCtx = useMatchCtx();
const token = localStorage.getItem("access_token");
if (token) { // sanity check
    const connection = new signalR.HubConnectionBuilder()
    .withUrl("localhost:5270/matchhub", {
        accessTokenFactory: () => token // 👈 token goes in query param
    })
    .withAutomaticReconnect()
    .build();

    connection.on("MatchFound", () => {
        console.log("Match Found");
        matchCtx.setMatchFound(true);
    })

    await connection.start();
}