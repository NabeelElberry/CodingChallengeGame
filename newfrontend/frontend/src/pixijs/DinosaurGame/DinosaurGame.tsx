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
import { useEffect, useRef, useState } from "react";
import { checkForAABB } from "../Utils/pixiutils";
import type { xyInterface } from "../Utils/interfaces";

extend({ Container, Graphics, Sprite });

const treeSpeed = 0.5;
export default function DinosaurGame() {
  return (
    <div className="w-[800px] h-[400px]">
      <Application width={800} height={400} backgroundColor={"#ffffff"}>
        <PixiContainer />
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

const PixiContainer = () => {
  const treeRefs = [
    useRef<Sprite>(null),
    useRef<Sprite>(null),
    useRef<Sprite>(null),
    useRef<Sprite>(null),
  ];
  const [playerJumping, setPlayerJumping] = useState(false);
  const playerRef = useRef<Sprite | null>(null);
  const [gapArray, setGapArray] = useState([800]);
  const { app } = useApplication();

  const gameY = app.screen.height - 180;
  let i = 0;
  useEffect(() => {
    for (let i = 0; i < 200; i++) {
      setGapArray((prev) => {
        const topElement = prev[prev.length - 1];
        // 150 is the base spacing guaranteed, with a variation of randomness of 0 - 200 added onto it
        prev.push(topElement + 150 + Math.random() * 200);
        return prev;
      });
    }
  }, [gapArray]);

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
    if (playerRef.current && playerRef.current.y <= gameY) {
      playerRef.current.y = Math.max(
        playerRef.current.y,
        playerRef.current.y + gravity
      );
    }
  });
  const keysDown = (e: KeyboardEvent) => {
    console.log(e.key);
    if (e.key == " " && playerJumping == false && playerRef.current) {
      // spacebar pressed
      playerRef.current.y += gravity;
      playerRef.current.y -= 60;
    }
  };
  const jumpPower = 10;
  const gravity = 0.5;

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
