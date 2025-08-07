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
    const response = await fetch("http://localhost:5270/queueUsers?userId=z8zpPLez6gVdMWrjsjfJqrs4dpq2&mmr=0&mode=competitive", {
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
        console.log(response);
        const result = await response.json();
  }

  const queueUser2 = async () => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`http://localhost:5270/queueUsers?userId=t4x3KHHgKqZSAJA05DznO6SRBnk2&mmr=0&mode=competitive`, {
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

    const queueUser3 = async () => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch("http://localhost:5270/queueUsers?userId=mgofr8TxJsQyLE31cbeecvDKE0D3&mmr=0&mode=competitive", {
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
        console.log(response);
        const result = await response.json();
  }

  const queueUser4 = async () => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`http://localhost:5270/queueUsers?userId=wepLXFVDhAZvBd33S827RbB2vy12&mmr=0&mode=competitive`, {
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
          "languageId": 62,
          "questionId": "2fa85fbc-75a9-42fc-8039-e815643438bb" // two sum
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
      <div id="unique-id">
        <Button onPress = {queueUser1}>Queue User 1</Button>
        <Button onPress={queueUser2}>Queue User 2</Button>
        <Button onPress={queueUser3}>Queue User 3</Button>
        <Button onPress={queueUser4}>Queue User 4</Button>
      </div>
        <Editor defaultLanguage="python" theme="vs-dark" onMount={handleEdtorDidMount} height="90vh"/>
        <Button onPress={printCode}>Submit</Button>
    </DefaultLayout>
  );
}
