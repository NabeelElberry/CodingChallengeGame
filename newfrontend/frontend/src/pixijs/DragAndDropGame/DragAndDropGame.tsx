import { Application, extend, useApplication, useTick } from "@pixi/react";

import { Container, Graphics, Sprite, Text } from "pixi.js";

import { useEffect, useRef, useState, type RefObject } from "react";
import { answerToNumber, checkForAABB } from "../Utils/pixiutils";
import type { gameWonInterface } from "../Utils/interfaces";

extend({ Container, Graphics, Sprite, Text });

export default function DragAndDropGame({
  setGameWon,
  gameStatus,
  gameInformation,
  answerOrder,
}: gameWonInterface) {
  return (
    <div className="w-[800px] h-[400px]">
      <Application width={800} height={400} backgroundColor={"#ffffff"}>
        <PixiContainer
          setGameWon={setGameWon}
          gameStatus={gameStatus}
          gameInformation={gameInformation}
          answerOrder={answerOrder}
        />
      </Application>
    </div>
  );
}

const PixiContainer = ({
  setGameWon,
  gameStatus,
  gameInformation,
  answerOrder,
}: gameWonInterface) => {
  const textValueRefArray = [
    useRef<Text>(null),
    useRef<Text>(null),
    useRef<Text>(null),
    useRef<Text>(null),
  ];

  const stringValueRefArray = [
    useRef<string>(null),
    useRef<string>(null),
    useRef<string>(null),
    useRef<string>(null),
  ];
  const [isLoading, setIsLoading] = useState(true);
  // fetch information for level
  useEffect(() => {
    for (let i = 0; i < 4; i++) {
      console.log(`Answer Order: ${answerOrder}`);
      stringValueRefArray[i].current = answerOrder[i];
      console.log(`First 4 text is: ${answerOrder[i]}`);
    }
    setIsLoading(false);

    return () => {
      window.removeEventListener("keydown", keysDown);
      window.removeEventListener("keyup", keysUp);
    };
  }, []);

  if (!gameInformation) {
    return <div className="w-[800px] h-[400px]">Loading...</div>;
  }

  console.log("Game Information: ", gameInformation);

  let answerPressed = false;
  let correctAnswerIntersecting = false;

  const keysDown = (e: KeyboardEvent) => {
    if (e.key == " ") {
      if (correctAnswerIntersecting) {
        answerPressed = true;
      } else {
        console.log(
          `Pressed nothing, or wrong answer, correct answer is ${gameInformation.correctAnswer}`
        );
      }
      // spacebar pressed
    }
  };

  const keysUp = (e: KeyboardEvent) => {
    answerPressed = false;
  };
  window.addEventListener("keydown", keysDown);
  window.addEventListener("keyup", keysUp);

  const { app } = useApplication();
  const choiceRefs = [
    useRef<Container>(null),
    useRef<Container>(null),
    useRef<Container>(null),
    useRef<Container>(null),
  ];
  const lineRef = useRef<Graphics>(null);
  const answerSpeed = 3;
  let indexPassed = 3;
  useTick((time) => {
    const dx = time.deltaTime * answerSpeed;
    console.log(`IndexPassed: ${indexPassed}`);
    choiceRefs.forEach((containerRef, index) => {
      if (containerRef.current) {
        containerRef.current.x -= dx;
        if (containerRef.current.x <= 0) {
          containerRef.current.x += app.screen.width + 200;
          stringValueRefArray[index].current = answerOrder[indexPassed];
          textValueRefArray[index].current!.text = answerOrder[indexPassed];
          console.log(
            `Should be changing containerRef text to ${answerOrder[indexPassed]}`
          );
          indexPassed += 1;

          // if somehow they make it past 200 letters, just reuse it infinitely
          if (indexPassed > 199) {
            indexPassed = 0;
          }
        }

        if (checkForAABB(containerRef.current, lineRef.current) == true) {
          // console.log(`Overlap for box ${index}`);
          if (
            answerToNumber(stringValueRefArray[index].current!) ==
            gameInformation.correctAnswer
          ) {
            correctAnswerIntersecting = true;
            // console.log("Correct answer intersecting");
          } else {
            correctAnswerIntersecting = false;
            // console.log("Setting correct answer intersecting false 1");
          }
        }
      }
    });

    if (answerPressed && correctAnswerIntersecting && !gameStatus) {
      setGameWon();
      answerPressed = false; // reset so space doesn't carry over
    }
  });

  const rectW = 150;
  const rectH = 100;

  return isLoading ? (
    <pixiContainer></pixiContainer>
  ) : (
    <pixiContainer>
      {choiceRefs.map((ref, index) => (
        <pixiContainer ref={ref} x={index * 200} y={app.canvas.height / 2 - 65}>
          <pixiGraphics
            x={0}
            y={0}
            draw={(graphics) => {
              graphics.clear();
              graphics.setFillStyle({ color: "red" });
              graphics.roundRect(0, 0, rectW, rectH);
              graphics.fill("#ffff2f");
            }}
            eventMode="static"
          />
          <pixiText
            ref={textValueRefArray[index]}
            x={rectW / 2}
            y={rectH / 2}
            anchor={0.5}
            text={stringValueRefArray[index].current!}
            style={{ fill: "#000000", fontSize: 36 }}
          />
        </pixiContainer>
      ))}
      <pixiGraphics
        ref={lineRef}
        draw={(graphics) => {
          graphics.clear();
          graphics.setFillStyle({ color: "red" });
          graphics.stroke();
          graphics.setStrokeStyle({ width: 10, color: "#000000" });
          graphics.moveTo(app.screen.width / 2, 0);
          graphics.lineTo(app.screen.width / 2, app.screen.height);
          graphics.stroke();
          graphics.fill("#000000");
        }}
      />
    </pixiContainer>
  );
};

interface num {
  num: string;
  x: number;
  y: number;
  ref: RefObject<Container | null>;
  index: number;
}

// const Choice = ({ num, x, y, ref, index }: num) => {
//   const { app } = useApplication();
//   const rectRef = useRef<Graphics>(null);

//   const rectW = 150;
//   const rectH = 100;
//   return (
//     <pixiContainer ref={ref} x={x} y={y}>
//       <pixiGraphics
//         x={0}
//         y={0}
//         ref={rectRef}
//         draw={(graphics) => {
//           graphics.clear();
//           graphics.setFillStyle({ color: "red" });
//           graphics.roundRect(0, 0, rectW, rectH);
//           graphics.fill("#ffff2f");
//         }}
//         eventMode="static"
//       />
//       <pixiText
//         x={rectW / 2}
//         y={rectH / 2}
//         anchor={0.5}
//         text={textValueRefArray[index]!.current!}
//         style={{ fill: "#000000", fontSize: 36 }}
//       />
//     </pixiContainer>
//   );
// };
