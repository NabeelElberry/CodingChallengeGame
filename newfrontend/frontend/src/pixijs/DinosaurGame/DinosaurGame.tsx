import { Application, extend, useApplication, useTick } from "@pixi/react";

import {
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Assets,
  Texture,
} from "pixi.js";

import { BunnySprite } from "../BunnySprite";
import {
  useEffect,
  useRef,
  useState,
  type SetStateAction,
  type Dispatch,
} from "react";
import { checkForAABB } from "../Utils/pixiutils";
import type {
  gameState,
  gameWonInterface,
  xyInterface,
} from "../Utils/interfaces";
import { JsonInput } from "@mantine/core";

extend({ Container, Graphics, Sprite });

export default function DinosaurGame({ gameWon, setGameWon }: gameState) {
  return gameWon ? (
    <div>Game Won</div>
  ) : (
    <div className="w-[800px] h-[400px]">
      <Application width={800} height={400} backgroundColor={"#ffffff"}>
        <PixiContainer gameWonFunction={setGameWon} />
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

const PixiContainer = ({ gameWonFunction }: gameWonInterface) => {
  const treeRefs = [
    useRef<Sprite>(null),
    useRef<Sprite>(null),
    useRef<Sprite>(null),
    useRef<Sprite>(null),
  ];
  const [playerJumping, setPlayerJumping] = useState(false);
  const playerRef = useRef<Sprite | null>(null);
  const [gapArray, setGapArray] = useState<number[]>([]);
  const { app } = useApplication();
  const [velocityY, setVelocity] = useState(0);

  const jumpPower = -3;
  const gravity = 0.05;
  const gameY = app.screen.height - 180;
  let i = 0;
  useEffect(() => {
    setGapArray(() => {
      const newArray: number[] = [];
      for (let i = 0; i < 200; i++) {
        const topElement = newArray[newArray.length - 1] ?? 0;
        // 150 is the base spacing guaranteed, with a variation of randomness of 0 - 200 added onto it
        newArray.push(topElement + 300 + Math.random() * 100);
      }
      console.log(newArray);
      return newArray;
    });
  }, []);

  useTick((time) => {
    const dx = time.deltaTime * 5;
    treeRefs.forEach((ref) => {
      if (ref.current) {
        ref.current.x -= dx;

        if (ref.current.x <= 0) {
          ref.current.x += app.screen.width + gapArray[i];

          i += 1;
        }
      }
    });

    // keep dinosaur grounded;

    if (playerRef.current) {
      // jump logic

      //console.log(`velocityY ${velocityY} currentY ${playerRef.current.y}`);

      if (playerJumping) {
        //console.log("Player jumped");

        playerRef.current.y += velocityY;
        setVelocity((prev) => prev + gravity);
      }
      if (playerRef.current.y > gameY) {
        setPlayerJumping(false);
        playerRef.current.y = gameY;
      }

      treeRefs.forEach((treeRef) => {
        if (
          playerRef.current &&
          treeRef.current &&
          checkForAABB(playerRef.current, treeRef.current)
        ) {
          gameWonFunction(true);
        }
      });
    }
  });
  const keysDown = (e: KeyboardEvent) => {
    if (e.key == " " && playerJumping == false && playerRef.current) {
      // spacebar pressed

      setPlayerJumping((prev) => {
        if (!prev) {
          console.log("Jumped");
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

  return (
    <pixiContainer>
      <Player
        x={10}
        y={app.screen.height - 180}
        width={50}
        height={50}
        ref={playerRef}
      />
      {treeRefs.map((ref, index) => {
        return (
          <SmallTree
            key={index}
            x={900 + index * 200}
            y={app.screen.height - 180}
            width={50}
            height={50}
            ref={ref}
          />
        );
      })}
    </pixiContainer>
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
