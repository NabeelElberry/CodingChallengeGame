import { Application, extend, useApplication, useTick } from "@pixi/react";

import {
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Assets,
  Texture,
  Text,
} from "pixi.js";

import { BunnySprite } from "../BunnySprite";
import { useEffect, useRef, useState, type RefObject } from "react";
import { checkForAABB } from "../Utils/pixiutils";
import type { xyInterface } from "../Utils/interfaces";
import { JsonInput } from "@mantine/core";

extend({ Container, Graphics, Sprite, Text });

export default function DragAndDropGame() {
  return (
    <div className="w-[800px] h-[400px]">
      <Application width={800} height={400} backgroundColor={"#ffffff"}>
        <PixiContainer />
      </Application>
    </div>
  );
}

const PixiContainer = () => {
  // const [answerIntersecting, setAnswerIntersecting] = useState(-1);
  // const [answerPressed, setAnswerPressed] = useState(false);

  let answerPressed = false;
  let answerIntersecting = -1;
  const keysDown = (e: KeyboardEvent) => {
    if (e.key == " " && answerIntersecting >= 0) {
      // spacebar pressed
      console.log(`Spacebar pressed on ${answerIntersecting}`);
      answerPressed = true;
    }
  };

  window.addEventListener("keydown", keysDown);
  const { app } = useApplication();
  const arr = ["A", "B", "C", "D"];
  const choiceRefs = [
    useRef<Container>(null),
    useRef<Container>(null),
    useRef<Container>(null),
    useRef<Container>(null),
  ];
  const lineRef = useRef<Graphics>(null);
  const answerSpeed = 15;
  useTick((time) => {
    if (answerPressed) return;

    const dx = time.deltaTime * answerSpeed;

    choiceRefs.forEach((ref, index) => {
      if (ref.current) {
        ref.current.x -= dx;
        if (ref.current.x <= 0) {
          ref.current.x += app.screen.width + 200;
        }

        if (checkForAABB(ref.current, lineRef.current) == true) {
          console.log(`Overlap for box ${index}`);
          answerIntersecting = index;
        }
      }
    });

    let isAnyOverlapping = false;
    choiceRefs.forEach((ref) => {
      if (ref.current) {
        if (checkForAABB(ref.current, lineRef.current)) {
          isAnyOverlapping = true;
        }
      }
    });

    if (!isAnyOverlapping) {
      console.log("Setting answer intersecting to -1");
      answerIntersecting = -1;
    }
  });

  return (
    <pixiContainer>
      {arr.map((num, index) => (
        <Choice
          key={index}
          ref={choiceRefs[index]}
          num={num}
          x={index * 200 + 20}
          y={150}
        />
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
}

const Choice = ({ num, x, y, ref }: num) => {
  const { app } = useApplication();
  const rectRef = useRef<Graphics>(null);

  const rectW = 150;
  const rectH = 100;
  return (
    <pixiContainer ref={ref} x={x} y={y}>
      <pixiGraphics
        x={0}
        y={0}
        ref={rectRef}
        draw={(graphics) => {
          graphics.clear();
          graphics.setFillStyle({ color: "red" });
          graphics.roundRect(0, 0, rectW, rectH);
          graphics.fill("#ffff2f");
        }}
        eventMode="static"
      />
      <pixiText
        x={rectW / 2}
        y={rectH / 2}
        anchor={0.5}
        text={num}
        style={{ fill: "#000000", fontSize: 36 }}
      />
    </pixiContainer>
  );
};
