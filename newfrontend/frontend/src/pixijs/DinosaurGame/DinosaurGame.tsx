import { Application, extend, useApplication, useTick } from "@pixi/react";

import { Container, Graphics, Sprite, Assets, Texture, Text } from "pixi.js";

import { useEffect, useRef, useState } from "react";
import {
  answerToNumber,
  checkForAABB,
  generateAnswerChoice,
  numToAnswer,
} from "../Utils/pixiutils";
import type { gameWonInterface, xyInterface } from "../Utils/interfaces";
import authorizedCall from "../../misc/authorizedCall";
import { useAuth } from "../../store/AuthCtx";

extend({ Container, Graphics, Sprite });

export default function DinosaurGame({
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

const Player = ({ x, y, width, height, ref }: xyInterface) => {
  const [texture, setTexture] = useState(Texture.EMPTY);

  useEffect(() => {
    if (texture === Texture.EMPTY) {
      Assets.load("/src/assets/mogus.png").then((result) => setTexture(result));
    }
  }, [texture]);

  return (
    <pixiSprite
      texture={texture}
      width={width}
      height={height}
      x={x}
      y={y}
      ref={ref}
    />
  );
};

const PixiContainer = ({
  setGameWon,
  gameStatus,
  gameInformation,
  answerOrder,
}: gameWonInterface) => {
  // console.log("game information", gameInformation);
  const treeRefs = [
    useRef<Sprite>(null),
    useRef<Sprite>(null),
    useRef<Sprite>(null),
    useRef<Sprite>(null),
  ];
  const treeValueRef = [
    useRef<string>(null),
    useRef<string>(null),
    useRef<string>(null),
    useRef<string>(null),
  ];
  const treeContainerRefs = [
    useRef<Container>(null),
    useRef<Container>(null),
    useRef<Container>(null),
    useRef<Container>(null),
  ];
  const treeTextRefs = [
    useRef<Text>(null),
    useRef<Text>(null),
    useRef<Text>(null),
    useRef<Text>(null),
  ];
  const [playerJumping, setPlayerJumping] = useState(false);
  const playerRef = useRef<Sprite | null>(null);
  const [gapArray, setGapArray] = useState<number[]>([]);
  const { app } = useApplication();
  const [velocityY, setVelocity] = useState(0);
  const [loading, setLoading] = useState(true);
  const jumpPower = -3;
  const gravity = 0.05;
  const gameY = app.screen.height - 180;
  let indexOfTree = 3;
  let totalTrees = 0;
  const treeDimensions = [50, 50];
  useEffect(() => {
    // only runs on mount
    console.log("game information", gameInformation);

    // on spawn assign 4 random values of A,B,C,D to each tree in treeValueRef array
    // treeValueRef.forEach((ref) => {
    //   ref.current = generateAnswerChoice();
    // });

    for (let i = 0; i < 4; i++) {
      treeValueRef[i].current = answerOrder[i];
    }

    setGapArray(() => {
      const newArray: number[] = [];
      for (let i = 0; i < 200; i++) {
        const topElement = newArray[newArray.length - 1] ?? 0;
        // first number is the base spacing guaranteed, with a variation of randomness of 0 - second number added onto it
        newArray.push(topElement + 20 + Math.random() * 200);
      }
      console.log("Array: ", newArray);
      return newArray;
    });

    const keysDown = (e: KeyboardEvent) => {
      if (e.key == " " && playerJumping == false && playerRef.current) {
        // spacebar pressed

        setPlayerJumping((prev) => {
          if (!prev) {
            setVelocity(jumpPower);
            return true;
          }
          return prev; // still true, no new jump
        });
      }
    };

    const keysUp = (e: KeyboardEvent) => {
      console.log(e.key);
    };

    window.addEventListener("keydown", keysDown);
    window.addEventListener("keyup", keysUp);
    setLoading(false);
    return () => {
      window.removeEventListener("keydown", keysDown);
      window.removeEventListener("keyup", keysUp);
    };
  }, []);

  useTick((time) => {
    const dx = time.deltaTime * 5;
    treeContainerRefs.forEach((ref, index) => {
      if (ref.current) {
        ref.current.x -= dx;
        // console.log(
        //   "Current ref coordinates: X: ",
        //   ref.current.x,
        //   "Y: ",
        //   ref.current.y
        // );
        if (ref.current.x <= 0) {
          // spawn the tree at variable spots depending on random array generated in the useEffect
          ref.current.x += app.screen.width + gapArray[totalTrees];

          // Randomly give each tree a value of A,B,C,D
          const newLetter = answerOrder[indexOfTree];
          treeValueRef[index].current = newLetter;

          // directly mutate Pixi.Text instance
          if (treeTextRefs[index].current) {
            treeTextRefs[index].current.text = newLetter;
          }

          indexOfTree += 1;
          totalTrees += 1;
          console.log("I: ", indexOfTree);
        }
      }
    });

    // keep dinosaur grounded
    if (playerRef.current) {
      // jump logic

      if (playerJumping) {
        playerRef.current.y += velocityY;
        setVelocity((prev) => prev + gravity);
      }
      if (playerRef.current.y > gameY) {
        setPlayerJumping(false);
        playerRef.current.y = gameY;
      }

      treeContainerRefs.forEach((treeRef, index) => {
        if (
          playerRef.current &&
          treeRef.current &&
          checkForAABB(playerRef.current, treeRef.current)
        ) {
          // console.log("User collided with answer", treeValueRef[index].current);
          // if (!gameStatus) setGameWon();

          if (
            answerToNumber(treeValueRef[index].current!) ==
            gameInformation.correctAnswer
          ) {
            console.log("Game Won");
            setGameWon();
          }
        }
      });
    }
  });

  // console.log(`Loading: ${loading}`);

  return !loading ? (
    <pixiContainer>
      <Player
        x={10}
        y={app.screen.height - 180}
        width={50}
        height={50}
        ref={playerRef}
      />

      {treeContainerRefs.map((ref, index) => {
        return (
          <pixiContainer
            ref={ref}
            key={index}
            x={900 + index * 200}
            y={app.screen.height - 180}
          >
            <SmallTree
              key={index}
              x={0}
              y={0}
              width={treeDimensions[0]}
              height={treeDimensions[1]}
              ref={treeRefs[index]}
            />
            <pixiText
              ref={treeTextRefs[index]}
              x={treeDimensions[0] / 2}
              y={treeDimensions[1] / 2}
              anchor={0.5}
              text={treeValueRef[index].current!}
              style={{ fill: "#000000", fontSize: 36 }}
            />
          </pixiContainer>
        );
      })}
    </pixiContainer>
  ) : (
    <pixiContainer></pixiContainer>
  );
};

const SmallTree = ({ x, y, width, height, ref }: xyInterface) => {
  const [texture, setTexture] = useState(Texture.EMPTY);

  useEffect(() => {
    if (texture === Texture.EMPTY) {
      Assets.load("/src/assets/treepng.png").then((result) =>
        setTexture(result)
      );
    }
  }, [texture]);

  return (
    <pixiSprite
      texture={texture}
      width={width}
      height={height}
      x={x}
      y={y}
      ref={ref}
    />
  );
};
