import { Application, extend, useTick } from "@pixi/react";

import { Container, Graphics, Rectangle, Sprite } from "pixi.js";

import { BunnySprite } from "./BunnySprite";
import { useEffect, useRef, useState } from "react";
import { checkForAABB } from "../Utils/pixiutils";

extend({ Container, Graphics, Sprite });

export default function TestPixiGame() {
  return (
    <Application width={100} height={100} backgroundColor={"#ffffff"}>
      <PixiContainer />
    </Application>
  );
}

const PixiContainer = () => {
  const spinMax = 0.01;
  const moveSpeed = 0.2;
  const bunnyRef = useRef<Sprite>(null);

  const bunnyRefTwo = useRef<Sprite>(null);
  const bunnyRefThree = useRef<Sprite>(null);

  const rectRef = useRef<Graphics>(null);
  const [paused, setPaused] = useState(false);
  const [bunnyOneSmall, setBunnyOneSmall] = useState(false);
  const [bunnyTwoSmall, setBunnyTwoSmall] = useState(false);
  const [bunnyThreeSmall, setBunnyThreeSmall] = useState(false);
  useTick(() => {
    // console.log(bunnyRef.current?.x);
    console.log(checkForAABB(bunnyRef.current, rectRef.current));
    const collideDetected = checkForAABB(bunnyRef.current, rectRef.current);
    const collideTwoDetected = checkForAABB(
      bunnyRefTwo.current,
      rectRef.current
    );
    const collideThreeDetected = checkForAABB(
      bunnyRefThree.current,
      rectRef.current
    );
    if (bunnyRef.current && collideDetected) {
      setBunnyOneSmall(true);
    } else {
      setBunnyOneSmall(false);
    }
    if (bunnyRefTwo.current && collideTwoDetected) {
      setBunnyTwoSmall(true);
    } else {
      setBunnyTwoSmall(false);
    }
    if (bunnyRefThree.current && collideThreeDetected) {
      setBunnyThreeSmall(true);
    } else {
      setBunnyThreeSmall(false);
    }
  });
  return (
    <pixiContainer>
      <pixiGraphics
        ref={rectRef}
        draw={(graphics) => {
          graphics.clear();
          graphics.setFillStyle({ color: "red" });
          graphics.rect(500, 270, 150, 100);
          graphics.fill("#000000");
        }}
        eventMode="static"
      />
      <BunnySprite
        key={1}
        xIn={200}
        yIn={200}
        moveSpeed={Math.random() * (moveSpeed - 0.1) + 0.1}
        spinAmount={Math.random() * (spinMax - 0.1) + 0.1}
        start={"RIGHT"}
        ref={bunnyRefTwo}
        paused={paused}
        isBig={bunnyOneSmall}
      />
      <BunnySprite
        key={2}
        xIn={200}
        yIn={200}
        moveSpeed={Math.random() * (moveSpeed - 0.1) + 0.1}
        spinAmount={Math.random() * (spinMax - 0.1) + 0.1}
        start={"RIGHT"}
        ref={bunnyRefThree}
        paused={paused}
        isBig={bunnyTwoSmall}
      />
      <BunnySprite
        key={3}
        xIn={200}
        yIn={200}
        moveSpeed={Math.random() * (moveSpeed - 0.1) + 0.1}
        spinAmount={Math.random() * (spinMax - 0.1) + 0.1}
        start={"RIGHT"}
        ref={bunnyRef}
        paused={paused}
        isBig={bunnyThreeSmall}
      />
    </pixiContainer>
  );
};
