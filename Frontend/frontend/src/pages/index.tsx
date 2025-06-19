import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { CheckAuthStatus, CreateUserButton, SignInButton } from "@/config/firebase";
import { Button } from "@heroui/button";
import { getAuth } from "firebase/auth";

export default function IndexPage() {
  const auth = getAuth();
  

  const queueUser1 = async () => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch("http://localhost:5270/queueUsers?userId=iDBVWzWeyCTEXzwbeG08VgzNNyu1&mmr=0", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
           
        });

        if (!response.ok) {
          const text = await response.text(); // so you can log the actual error message
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const result = await response.json();
  }

  const queueUser2 = async () => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`http://localhost:5270/queueUsers?userId=QaDoiXI3SrRMNWqPzViGNi87IzE2&mmr=0`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
           
        });
        if (!response.ok) {
          const text = await response.text(); // so you can log the actual error message
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const result = await response.json();
  }

  return (
    <DefaultLayout>
      <div><Button onPress = {queueUser1}>Queue User 1</Button>
        
        
        <Button onPress={queueUser2}>Queue User 2</Button></div>
    </DefaultLayout>
  );
}
