import { Application, extend, useApplication, useTick } from "@pixi/react";
import { Container, Graphics, Sprite, Assets, Texture, Text } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import {
  answerToNumber,
  checkForAABBNoObject,
  generateAnswerChoice,
} from "../Utils/pixiutils";
import type { gameWonInterface, xyInterface } from "../Utils/interfaces";

extend({ Container, Graphics, Sprite });

export default function SpaceInvadersGame({
  setGameWon,
  gameStatus,
  gameInformation,
  answerOrder,
}: gameWonInterface) {
  return (
    <div
      className="w-[800px] h-[800px]"
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid rgba(102,98,255,0.45)",
        boxShadow:
          "0 0 28px rgba(102,98,255,0.3), 0 0 56px rgba(102,98,255,0.12)",
      }}
    >
      <Application width={800} height={800} backgroundColor={"#0d0b1a"}>
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
  const containerRef = useRef<Container>(null);
  const playerRef = useRef<Sprite>(null);

  // keep bullets in a stable ref
  const bulletsRef = useRef<{ sprite: Sprite; active: boolean }[]>([]);
  const enemyBulletArray = useRef<{ sprite: Sprite; active: boolean }[]>([]);
  const enemyRefArray = useRef<
    { sprite: Container; active: boolean; letter: string }[]
  >([]);

  // handling text over the birds

  const [bulletTexture, setBulletTexture] = useState(Texture.EMPTY);
  const [enemyTexture, setEnemyTexture] = useState(Texture.EMPTY);

  const spaceshipDimensions = { width: 50, height: 50 };
  const bulletDimensions = { width: 30, height: 30 };
  const enemyDimensions = { width: 50, height: 50 };

  const totalEnemies = 12;
  let correctAnswerEnemiesKilled = 0;
  const correctEnemiesTotal = useRef(0);
  const enemyHit = Array(totalEnemies).fill(false);
  const enemyFireTimes = Array(totalEnemies).fill(0);
  const enemyFireTimeCooldownMS = 1000;
  const playerFireTimeCooldownMS = 500;
  const playerFireTimes: number[] = [];
  const bulletVelocity = 10;

  const refArray = useRef([false, false, false, false]); // W A S D
  const { app } = useApplication();

  const [texturesLoaded, setTexturesLoaded] = useState(false);
  let totalEnemiesKilled = 0;

  useEffect(() => {
    console.log("game information", gameInformation);
    if (bulletTexture === Texture.EMPTY) {
      Assets.load("/src/assets/shot.png").then((result) =>
        setBulletTexture(result)
      );
    }
    if (enemyTexture === Texture.EMPTY) {
      Assets.load("/src/assets/bird.png").then((result) =>
        setEnemyTexture(result)
      );
    }
    setTexturesLoaded(true);

    enemyRefArray.current.forEach(({ sprite }) => {
      containerRef.current?.removeChild(sprite);
    });
    enemyRefArray.current = [];

    if (!bulletTexture || !enemyTexture) return;

    enemyHit.forEach((_, index) => {
      const container = new Container();
      const sprite = Sprite.from(enemyTexture);
      const chosenLetter = answerOrder[index];
      const text = new Text({ text: chosenLetter, style: { fill: "#ffffff", fontSize: 18, fontWeight: "bold" } });
      container.width = enemyDimensions.width;
      container.height = enemyDimensions.height;
      container.x = (index % (totalEnemies / 2)) * 100 + 50;
      container.y = index > totalEnemies / 2 - 1 ? 80 : 20;

      console.log(
        `Chosen Letter: ${answerToNumber(chosenLetter)}, correct answer: ${
          gameInformation.correctAnswer
        }`
      );
      if (answerToNumber(chosenLetter) === gameInformation.correctAnswer) {
        console.log("Add to it");
        correctEnemiesTotal.current += 1;
      }
      // console.log(`Index: ${index}, X: ${container.x}, y: ${container.y}`);

      sprite.width = enemyDimensions.width;
      sprite.height = enemyDimensions.height;

      text.width = enemyDimensions.width;
      text.height = enemyDimensions.height;

      container.addChild(sprite);
      container.addChild(text);

      enemyRefArray.current.push({
        sprite: container,
        active: true,
        letter: answerOrder[index],
      });
      containerRef.current?.addChild(container);
    });
  }, []);

  // FIX 2: proper event listener registration/cleanup
  useEffect(() => {
    const keysDown = (e: KeyboardEvent) => {
      if (e.key === "a") refArray.current[1] = true;
      if (e.key === "d") refArray.current[3] = true;
      if (e.key === "s") refArray.current[2] = true;
      if (e.key === "w") refArray.current[0] = true;

      if (e.key === " " && playerRef.current) {
        if (
          playerFireTimes.length === 0 ||
          performance.now() - playerFireTimes[playerFireTimes.length - 1] >=
            playerFireTimeCooldownMS
        ) {
          const bullet = Sprite.from(bulletTexture);
          bullet.x = playerRef.current!.x + 10;
          bullet.y = playerRef.current!.y - 20;
          bullet.width = bulletDimensions.width;
          bullet.height = bulletDimensions.height;
          containerRef.current?.addChild(bullet);
          bulletsRef.current.push({ sprite: bullet, active: true });
          playerFireTimes.push(performance.now());
        }
      }
    };

    const keysUp = (e: KeyboardEvent) => {
      if (e.key === "a") refArray.current[1] = false;
      if (e.key === "d") refArray.current[3] = false;
      if (e.key === "s") refArray.current[2] = false;
      if (e.key === "w") refArray.current[0] = false;
    };

    window.addEventListener("keydown", keysDown);
    window.addEventListener("keyup", keysUp);

    return () => {
      window.removeEventListener("keydown", keysDown);
      window.removeEventListener("keyup", keysUp);
    };
  }, [bulletTexture]);

  let birdXVelocity = 0.5;

  useTick((time) => {
    const dt = time.deltaTime;
    const velocity = dt * 5;

    // game won condition
    if (
      correctAnswerEnemiesKilled == correctEnemiesTotal.current &&
      correctAnswerEnemiesKilled != 0
    ) {
      console.log("Game won");
      setGameWon();
    }

    // Player movement
    refArray.current.forEach((pressed, index) => {
      if (!pressed || !playerRef.current || playerRef.current.destroyed) return;
      const currX = playerRef.current.x;
      const currY = playerRef.current.y;
      if (index === 0 && currY > 0) playerRef.current.y -= velocity;
      if (index === 1 && currX > 0) playerRef.current.x -= velocity;
      if (index === 2 && currY < app.canvas.height)
        playerRef.current.y += velocity;
      if (index === 3 && currX < app.canvas.width)
        playerRef.current.x += velocity;
    });

    // Bullets update
    bulletsRef.current.forEach((bullet) => {
      if (!bullet.active) return;
      bullet.sprite.y -= dt * bulletVelocity;
      if (bullet.sprite.y < -50) {
        containerRef.current?.removeChild(bullet.sprite);
        bullet.active = false;
      }
      enemyRefArray.current.forEach((enemy, indexEnemy) => {
        if (
          checkForAABBNoObject(
            { x: bullet.sprite.x, y: bullet.sprite.y },
            bulletDimensions,
            { x: enemy.sprite.x, y: enemy.sprite.y },
            enemyDimensions
          ) &&
          enemy.active &&
          bullet.active
        ) {
          containerRef.current?.removeChild(bullet.sprite);
          containerRef.current?.removeChild(enemy.sprite);
          enemyHit[indexEnemy] = true;
          enemy.active = false;
          bullet.active = false;
          if (answerToNumber(enemy.letter) == gameInformation.correctAnswer) {
            correctAnswerEnemiesKilled += 1;
            console.log("Correct enemy hit");
            console.log(
              `Total numbers of enemies killed: ${correctAnswerEnemiesKilled}, total correct enemies: ${correctEnemiesTotal.current}`
            );
          }
          totalEnemiesKilled++;
        }
      });
    });

    // if (totalEnemiesKilled === totalEnemies) {
    //   if (!gameStatus) setGameWon();
    // }

    // Enemy bullets
    enemyBulletArray.current.forEach((item) => {
      const bullet = item.sprite;
      bullet.y += dt * bulletVelocity;
      // if (
      //   playerRef.current &&
      //   checkForAABBNoObject(
      //     { x: bullet.x, y: bullet.y },
      //     bulletDimensions,
      //     { x: playerRef.current.x, y: playerRef.current.y },
      //     {
      //       width: playerRef.current.width,
      //       height: playerRef.current.height,
      //     }
      //   )
      // ) {
      //   playerRef.current?.destroy();
      //   if (!gameStatus) setGameWon();
      // }
    });

    // Enemy movement + shooting
    let minX = Infinity;
    let maxX = -Infinity;

    enemyRefArray.current.forEach((enemy, index) => {
      if (enemy.active) {
        const currTime = performance.now();

        // prevent top row from shooting as long as an enemy is under it
        if (
          (index >= totalEnemies / 2 ||
            (index <= totalEnemies / 2 &&
              !enemyRefArray.current[index + totalEnemies / 2].active)) &&
          (enemyFireTimes[index] === 0 ||
            currTime - enemyFireTimes[index] >= enemyFireTimeCooldownMS)
        ) {
          const sprite = Sprite.from(bulletTexture);
          sprite.width = bulletDimensions.width;
          sprite.height = bulletDimensions.height;
          sprite.x = enemy.sprite.x;
          sprite.y = enemy.sprite.y;
          enemyBulletArray.current.push({ sprite, active: true });
          containerRef.current?.addChild(sprite);
          enemyFireTimes[index] = performance.now();
        }

        // dynamically adjust bounds
        if (enemy.sprite.x < minX) minX = enemy.sprite.x;
        if (enemy.sprite.x > maxX) maxX = enemy.sprite.x;
      }
    });

    if (maxX >= app.screen.width - enemyDimensions.width || minX <= 0) {
      birdXVelocity *= -1;
    }
    enemyRefArray.current.forEach((enemy) => {
      enemy.sprite.x += birdXVelocity;
    });
  });

  return (
    <pixiContainer ref={containerRef}>
      <Spaceship
        width={spaceshipDimensions.width}
        height={spaceshipDimensions.height}
        x={400}
        y={700}
        ref={playerRef}
      />
    </pixiContainer>
  );
};

const Spaceship = ({ x, y, width, height, ref }: xyInterface) => {
  const [texture, setTexture] = useState(Texture.EMPTY);

  useEffect(() => {
    if (texture === Texture.EMPTY) {
      Assets.load("/src/assets/spaceship.png").then((result) =>
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
