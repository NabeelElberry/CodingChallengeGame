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
import { createRef, useEffect, useRef, useState, type RefObject } from "react";
import { checkForAABB, checkForAABBNoObject } from "../Utils/pixiutils";
import type { xyInterface } from "../Utils/interfaces";
import { JsonInput } from "@mantine/core";

extend({ Container, Graphics, Sprite });
export default function SpaceInvadersGame() {
  return (
    <div className="w-[800px] h-[400px]">
      <Application width={800} height={800} backgroundColor={"#ffffff"}>
        <PixiContainer />
      </Application>
    </div>
  );
}

const PixiContainer = () => {
  const containerRef = useRef<Container>(null);
  const playerRef = useRef<Sprite>(null);

  // const bulletsRef = useRef<{ sprite: Sprite; active: boolean }[]>([]);
  let bulletsArray: { sprite: Sprite; active: boolean }[] = [];
  const enemyBulletArray = useRef<{ sprite: Sprite; active: boolean }[]>([]);
  // const enemyBulletsRef = useRef<{ sprite: Sprite }[]>([]);
  const [bulletTexture, setBulletTexture] = useState(Texture.EMPTY);
  const [enemyTexture, setEnemyTexture] = useState(Texture.EMPTY);
  const spaceshipDimensions = { width: 50, height: 50 };
  const bulletDimensions = { width: 30, height: 30 };
  const enemyDimensions = { width: 50, height: 50 };
  const enemyHit = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ];

  const enemyFireTimes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const enemyFireTimeCooldownMS = 1000; // 1 second
  const playerFireTimeCooldownMS = 500; // half a second
  const playerFireTimes: number[] = [];
  const enemyRefArray = useRef<{ sprite: Sprite; active: boolean }[]>([]);
  const refArray = useRef([false, false, false, false]); // 0 = W, 1 = A, 2 = S, 3 = D
  const { app } = useApplication();

  useEffect(() => {
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
  }, [bulletTexture, enemyTexture]);

  // enemy array logic
  useEffect(() => {
    // reset enemies each time textures load
    // this code is for strict mode
    enemyRefArray.current.forEach(({ sprite }) => {
      containerRef.current?.removeChild(sprite);
    });
    enemyRefArray.current = []; // fully clear the array
    if (!bulletTexture || !enemyTexture) return;
    enemyHit.forEach((_, index) => {
      const sprite = Sprite.from(enemyTexture);
      sprite.width = enemyDimensions.width;
      sprite.height = enemyDimensions.height;
      sprite.x = (index % 5) * 150 + 50; // two rows
      sprite.y = index > 4 ? 80 : 20; // two rows
      enemyRefArray.current.push({ sprite: sprite, active: true });
      containerRef.current?.addChild(sprite);
    });

    return () => {
      bulletsArray = [];
      window.removeEventListener("keyup", keysUp);
      window.removeEventListener("keydown", keysDown);
    };
  }, [bulletTexture, enemyTexture]);

  const keysUp = (e: KeyboardEvent) => {
    if (e.key == "a") {
      console.log("A released");
      refArray.current[1] = false;
    }
    if (e.key == "d") {
      console.log("D released");
      refArray.current[3] = false;
    }
    if (e.key == "s") {
      console.log("S released");
      refArray.current[2] = false;
    }
    if (e.key == "w") {
      console.log("W released");
      refArray.current[0] = false;
    }
  };
  const keysDown = (e: KeyboardEvent) => {
    if (e.key == "a") {
      console.log("A pressed");
      refArray.current[1] = true;
    }
    if (e.key == "d") {
      console.log("D pressed");
      refArray.current[3] = true;
    }
    if (e.key == "s") {
      console.log("S pressed");
      refArray.current[2] = true;
    }
    if (e.key == "w") {
      console.log("W pressed");
      refArray.current[0] = true;
    }

    if (e.key == " " && playerRef.current) {
      if (
        // cooldown for shooting
        playerFireTimes.length == 0 ||
        performance.now() - playerFireTimes[playerFireTimes.length - 1] >=
          playerFireTimeCooldownMS
      ) {
        console.log("Adding bullet");
        const bullet = Sprite.from(bulletTexture);
        bullet.x = playerRef.current!.x + 10;
        bullet.y = playerRef.current!.y - 20;
        bullet.width = bulletDimensions.width;
        bullet.height = bulletDimensions.height;
        containerRef.current?.addChild(bullet);
        bulletsArray.push({
          sprite: bullet,
          active: true,
        });
        playerFireTimes.push(performance.now());
      }
    }
  };

  let birdXVelocity = 0.5;
  const bulletVelocity = 10;
  useTick((time) => {
    const dt = time.deltaTime;

    const velocity = dt * 5;
    // controls for player

    refArray.current.forEach((keyPressedBool, index) => {
      if (playerRef.current?.destroyed) return;
      if (keyPressedBool && playerRef.current) {
        const currX = playerRef.current.x;
        const currY = playerRef.current.y;
        if (index == 0 && currY > 0) {
          playerRef.current.y -= velocity;
        } else if (index == 1 && currX > 0) {
          playerRef.current.x -= velocity;
        } else if (index == 2 && currY < app.canvas.height) {
          playerRef.current.y += velocity;
        } else if (index == 3 && currX < app.canvas.width) {
          playerRef.current.x += velocity;
        }
      }
    });

    // collision logic
    bulletsArray.forEach((bullet, indexBullet) => {
      bullet.sprite.y -= dt * bulletVelocity; // bullet movement

      console.log;
      if (bullet.sprite.y < -50) {
        // goes offscreen remove it
        containerRef.current?.removeChild(bullet.sprite);
        bullet.active = false;
        // bulletsArray.splice(indexBullet, 1);
      }

      for (
        let indexEnemy = 0;
        indexEnemy < enemyRefArray.current.length;
        indexEnemy++
      ) {
        const enemy = enemyRefArray.current[indexEnemy];
        if (
          checkForAABBNoObject(
            { x: bullet.sprite.x, y: bullet.sprite.y },
            bulletDimensions,
            {
              x: enemy.sprite.x,
              y: enemy.sprite.y,
            },
            enemyDimensions
          ) &&
          enemy.active &&
          bullet.active
        ) {
          containerRef.current?.removeChild(bullet.sprite);
          containerRef.current?.removeChild(enemy.sprite);
          console.log(`Hit bird ${indexEnemy}`);
          enemyHit[indexEnemy] = true;
          enemy.active = false;
          bulletsArray[indexBullet].active = false;
          // bulletsArray.splice(indexBullet, 1);
          break;
        }
      }
    });

    let minX = Infinity;
    let maxX = -Infinity;

    enemyBulletArray.current.forEach((item) => {
      const bullet = item.sprite;
      bullet.y += dt * bulletVelocity;
      if (playerRef.current?.destroyed) return;

      if (
        checkForAABBNoObject(
          { x: bullet.x, y: bullet.y },
          bulletDimensions,
          { x: playerRef.current!.x, y: playerRef.current!.y },
          { width: playerRef.current!.width, height: playerRef.current!.height }
        )
      ) {
        console.log("Player hit!");
        playerRef.current?.destroy();
        return;
      }
    });

    // want a enemy to shoot if there's nothing under them
    // check first row, add 5 to the current index and see if it's active, if not then shoot
    // top row includes up to index 4
    // bottom row includes up to index 9
    // 10 enemies total, so we're going to need to check from range 0-4, which is the max number that is listed false and min
    // then the max and min of the second row, then min and max each of those values
    enemyRefArray.current.forEach((enemy, index) => {
      if (enemy.active) {
        const currTime = performance.now();
        if (index >= 5) {
          if (
            enemyFireTimes[index] == 0 ||
            currTime - enemyFireTimes[index] >= enemyFireTimeCooldownMS
          ) {
            // bottom row shooting
            const sprite = Sprite.from(bulletTexture);
            sprite.width = bulletDimensions.width;
            sprite.height = bulletDimensions.height;
            sprite.x = enemy.sprite.x; // two rows
            sprite.y = enemy.sprite.y; // two rows
            enemyBulletArray.current.push({ sprite: sprite, active: true });
            containerRef.current?.addChild(sprite);

            enemyFireTimes[index] =
              performance.now() + (Math.random() * 6 - 2) * 1000;
            return;
          }
        }
        if (index <= 4 && enemyRefArray.current[index + 5].active == false) {
          if (
            enemyFireTimes[index] == 0 ||
            currTime - enemyFireTimes[index] >= enemyFireTimeCooldownMS
          ) {
            const sprite = Sprite.from(bulletTexture);
            sprite.width = bulletDimensions.width;
            sprite.height = bulletDimensions.height;
            sprite.x = enemy.sprite.x; // two rows
            sprite.y = enemy.sprite.y; // two rows
            enemyBulletArray.current.push({ sprite: sprite, active: true });
            containerRef.current?.addChild(sprite);

            enemyFireTimes[index] = performance.now();
            return;
          }
        }
      }

      if (enemy.sprite.x < minX) minX = enemy.sprite.x;
      if (enemy.sprite.x > maxX) maxX = enemy.sprite.x;
    });

    if (maxX >= app.screen.width - enemyDimensions.width || minX <= 0) {
      birdXVelocity *= -1;
    }

    enemyRefArray.current.forEach((enemy) => {
      enemy.sprite.x += birdXVelocity;
    });
  });

  window.addEventListener("keyup", keysUp);
  window.addEventListener("keydown", keysDown);
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

interface EnemyInterface {
  x: number;
  y: number;
  width: number;
  height: number;
  ref: RefObject<Sprite | null>;
  leftAnchor?: boolean;
}

const Enemy = ({ x, y, width, height, ref, leftAnchor }: EnemyInterface) => {
  const [texture, setTexture] = useState(Texture.EMPTY);
  useEffect(() => {
    if (texture === Texture.EMPTY) {
      Assets.load("/src/assets/bird.png").then((result) => setTexture(result));
    }
  }, [texture]);

  return (
    <pixiSprite
      texture={texture}
      width={40}
      height={30}
      x={x}
      y={y}
      ref={ref}
    />
  );
};
