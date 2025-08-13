import * as signalR from "@microsoft/signalr";

const token = localStorage.getItem("access_token");

const connection = new signalR.HubConnectionBuilder()
  .withUrl("localhost:5270/matchhub", {
    accessTokenFactory: () => token // 👈 token goes in query param
  })
  .withAutomaticReconnect()
  .build();

  connection.on("MatchFound", () => {
    console.log("Match Found");
    connection.invoke("JoinMatchRoom", matchId);
  })

await connection.start();