import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { getAuth } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
export default function IndexPage() {
  const auth = getAuth();
  const [code, setCode] = useState<string | undefined>("");
  const editorRef = useRef<any>();
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

  const handleEdtorDidMount = (editor:any, monaco:any) => {
    editorRef.current = editor;
  }

  const printCode = async () => {
    console.log("CODE: ", editorRef.current.getValue());
    const token = await auth.currentUser?.getIdToken();
    // submit code
    const response = await fetch("http://localhost:5270/Match/judge/", 
      {method: "POST",
        body: JSON.stringify({
          "userCode": editorRef.current.getValue(),
          "languageId": 54,
          "questionId": "801a90d1-0a16-4781-8df3-c3942f432cab" // two sum
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
    const result = await response.json();
    console.log(result);
  }

  return (
    <DefaultLayout>
      <div id="unique-id"><Button onPress = {queueUser1}>Queue User 1</Button>
        
        
        <Button onPress={queueUser2}>Queue User 2</Button></div>
        <Editor defaultLanguage="python" theme="vs-dark" onMount={handleEdtorDidMount} height="90vh"/>
        <Button onPress={printCode}>Submit</Button>
    </DefaultLayout>
  );
}
