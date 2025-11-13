import {
  Assets,
  FederatedPointerEvent,
  Sprite,
  Texture,
  type FederatedEventHandler,
} from "pixi.js";

import { useEffect, useRef, useState, type RefObject } from "react";

import { useApplication, useTick } from "@pixi/react";

interface types {
  xIn: number;
  yIn: number;
  moveSpeed: number;
  spinAmount: number;
  start: "RIGHT" | "LEFT";
  onCollide?: () => {};
  ref: RefObject<Sprite | null>;
  paused: boolean;
  isBig: boolean;
}

export function BunnySprite({
  xIn,
  yIn,
  moveSpeed,
  spinAmount,
  start,
  onCollide,
  ref,
  paused,
  isBig,
}: types) {
  const [texture, setTexture] = useState(Texture.EMPTY);
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [x, setX] = useState(xIn);
  const [y, setY] = useState(yIn);
  const [followMouse, setFollowMouse] = useState(false);
  const { app } = useApplication();
  const [directionMovingH, setDirectionMovingH] = useState<"RIGHT" | "LEFT">(
    start
  );
  const [directionMovingV, setDirectionMovingV] = useState<"UP" | "DOWN">("UP");

  useEffect(() => {
    if (texture === Texture.EMPTY) {
      Assets.load("https://pixijs.com/assets/bunny.png").then((result) =>
        setTexture(result)
      );
    }
  }, [texture]);

  useTick(() => {
    if (paused) return;

    setRotation(rotation + spinAmount);
    if (x >= app.canvas.width - 0.2) {
      // console.log("Hit right boundary");
      setDirectionMovingH("LEFT");
    }
    if (x <= 0.2) {
      // console.log("Hit left boundary");
      setDirectionMovingH("RIGHT");
    }
    if (y >= app.canvas.height - 0.2) {
      setDirectionMovingV("DOWN");
    }
    if (y <= 0.2) {
      setDirectionMovingV("UP");
    }
    const max = 5;
    const min = 0.1;
    if (!followMouse) {
      if (directionMovingH == "RIGHT") {
        // console.log("Going right");
        setX(x + Math.random() * (max - min) + min);
      }
      if (directionMovingH == "LEFT") {
        // console.log("Going left");
        setX(x - (Math.random() * (max - min) + min));
      }
      if (directionMovingV == "UP") {
        // console.log("Going up");
        setY(y + Math.random() * (max - min) + min);
      }
      if (directionMovingV == "DOWN") {
        setY(y - (Math.random() * (max - min) + min));
      }
    }
  });

  const pointerMove = (event: FederatedPointerEvent) => {
    if (!followMouse) return;
    const x = event.global.x;
    const y = event.global.y;
    setX(x);
    setY(y);
    console.log(`Pointer at x: ${x}, y: ${y}`);
  };

  const getSprite = (event: FederatedPointerEvent) => {
    setFollowMouse(true);
    const x = event.global.x;
    const y = event.global.y;
    setX(x);
    setY(y);
  };

  const leaveSprite = (event: FederatedPointerEvent) => {
    setFollowMouse(false);
    const x = event.global.x;
    const y = event.global.y;
    setX(x);
    setY(y);
  };

  return (
    <pixiSprite
      ref={ref}
      anchor={0.5}
      eventMode={"static"}
      onClick={(_: any) => setIsActive(!isActive)}
      onPointerOver={(_: any) => setIsHovered(true)}
      onPointerOut={(_: any) => setIsHovered(false)}
      scale={isBig ? 10 : 1}
      texture={texture}
      x={x}
      y={y}
      rotation={rotation}
      interactive={true}
      onPointerMove={(event: FederatedPointerEvent) => pointerMove(event)}
      onPointerDown={(event: FederatedPointerEvent) => getSprite(event)}
      onPointerUp={(event: FederatedPointerEvent) => leaveSprite(event)}
      
    />
  );
}
