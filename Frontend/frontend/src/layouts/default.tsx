import { Link } from "@heroui/link";
import { Navbar } from "@/components/navbar";
import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Button } from "@heroui/button";
import { Auth } from "firebase-admin/auth";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const auth = getAuth();
useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5270/matchhub", {
        accessTokenFactory: async () => {
          const token = await user.getIdToken(true);
          return token;
        }
      })
      .withAutomaticReconnect()
      .build();

    // ✅ Register listeners before starting connection
    connection.on("MatchFound", async (matchId) => {
      console.log("📦 Matched:", matchId, "Type:", typeof(matchId));
      setMatchId(matchId);

      try {
        await connection.invoke("JoinMatchRoom", matchId);
        console.log("✅ JoinMatchRoom invoked");
      } catch (err) {
        console.error("❌ Error invoking JoinMatchRoom:", err);
      }
    });

    connection.on("ReceiveCode", (userId, message) => {
      console.log(`💬 [${userId}]: ${message}`);
    });

    connection.onclose((err) => {
      console.error("❌ SignalR connection closed:", err?.message || err);
    });

    try {
      await connection.start();
      console.log("✅ SignalR connected");
    } catch (err) {
      console.error("❌ SignalR failed to connect:", err);
    }

    connectionRef.current = connection;
  });

  return () => unsub(); // clean up on unmount
}, []);

  const sendTestMessage = async () => {
    if (!connectionRef.current || !matchId) {
      console.warn("No connection or match yet.");
      return;
    }

    await connectionRef.current.invoke("SendCode", matchId, await auth.currentUser?.uid ,`Hello from frontend! with token ${auth.currentUser?.uid}`);
  };

  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-16">
        {children}

        {/* ✅ Add your test button here */}
        <div className="mt-6">
          <Button onPress={sendTestMessage}>Send Test Message</Button>
        </div>
      </main>

      <footer className="w-full flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://heroui.com"
          title="heroui.com homepage"
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary">HeroUI</p>
        </Link>
      </footer>
    </div>
  );
}
