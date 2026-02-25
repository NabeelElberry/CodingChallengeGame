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

// Extend Pixi objects for @pixi/react
extend({ Container, Graphics, Sprite, Text });

export default function DinosaurGame({
  setGameWon,
  gameStatus,
  gameInformation,
  answerOrder,
}: gameWonInterface) {
  return (
    <div
      className="w-[800px] h-[400px]"
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid rgba(102,98,255,0.45)",
        boxShadow:
          "0 0 28px rgba(102,98,255,0.3), 0 0 56px rgba(102,98,255,0.12)",
      }}
    >
      <Application width={800} height={400} backgroundColor={"#0d0b1a"}>
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
    // Load asset only once
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

const SmallTree = ({ x, y, width, height, ref }: xyInterface) => {
  const [texture, setTexture] = useState(Texture.EMPTY);

  useEffect(() => {
    // Load asset only once
    if (texture === Texture.EMPTY) {
      Assets.load("/src/assets/treepng.png").then((result) =>
        setTexture(result),
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

const PixiContainer = ({
  setGameWon,
  gameStatus,
  gameInformation,
  answerOrder,
}: gameWonInterface) => {
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

  // FIXED: Use a useRef for player jumping status to avoid stale closures in useTick
  const isJumpingRef = useRef(false);
  const playerRef = useRef<Sprite | null>(null);

  // FIXED: Use refs for props that change to ensure useTick and collision logic have the latest values
  const gameInfoRef = useRef(gameInformation);
  const answerOrderRef = useRef(answerOrder);

  // Update refs when props change (e.g., when a new round starts)
  useEffect(() => {
    gameInfoRef.current = gameInformation;
    answerOrderRef.current = answerOrder;
  }, [gameInformation, answerOrder]);

  const [gapArray, setGapArray] = useState<number[]>([]);
  const { app } = useApplication();
  const [velocityY, setVelocity] = useState(0);
  const [loading, setLoading] = useState(true);

  const jumpPower = -3;
  const gravity = 0.05;
  const gameY = (app?.screen?.height ?? 400) - 180;

  // NOTE: When using useTick, mutable values accessed within should be refs or defined outside the component
  // if they don't need to be reactive. Since these need to be updated, they're defined outside as local vars.
  let indexOfTree = 3;
  let totalTrees = 0;

  const treeDimensions = [50, 50];

  useEffect(() => {
    console.log("game information", gameInformation);

    // Initialize tree values based on the incoming answerOrder
    for (let i = 0; i < 4; i++) {
      treeValueRef[i].current = answerOrder[i];
    }

    setGapArray(() => {
      const newArray: number[] = [];
      for (let i = 0; i < 200; i++) {
        const topElement = newArray[newArray.length - 1] ?? 0;
        newArray.push(topElement + 20 + Math.random() * 200);
      }
      // console.log("Array: ", newArray);
      return newArray;
    });

    const keysDown = (e: KeyboardEvent) => {
      // FIXED: Use the ref to check jumping status
      if (e.key == " " && isJumpingRef.current === false && playerRef.current) {
        // 1. Update the mutable ref immediately
        isJumpingRef.current = true;

        // 2. Set velocity state to start the jump
        setVelocity(jumpPower);
      }
    };

    const keysUp = (e: KeyboardEvent) => {
      // console.log(e.key); // Keyup is not critical for this game's logic
    };

    window.addEventListener("keydown", keysDown);
    window.addEventListener("keyup", keysUp);
    setLoading(false);

    return () => {
      window.removeEventListener("keydown", keysDown);
      window.removeEventListener("keyup", keysUp);
    };
  }, [answerOrder, gameInformation]); // Added dependencies to reset setup on new round

  useTick((time) => {
    const dx = time.deltaTime * 5;

    // --- Tree Movement and Respawn ---
    treeContainerRefs.forEach((ref, index) => {
      if (ref.current) {
        ref.current.x -= dx;

        if (ref.current.x <= 0) {
          // Respawn the tree with new horizontal position
          const nextGap = gapArray[totalTrees] || 0;
          ref.current.x += app.screen.width + nextGap;

          // Assign new answer value from the updated answerOrder
          const newLetter = answerOrderRef.current[indexOfTree]; // Use ref for current answerOrder
          treeValueRef[index].current = newLetter;

          // Mutate Pixi.Text instance to display the new letter
          if (treeTextRefs[index].current) {
            treeTextRefs[index].current.text = newLetter;
          }

          indexOfTree += 1;
          totalTrees += 1;
        }
      }
    });

    // --- Player Jump and Gravity Logic ---
    if (playerRef.current) {
      // Use the ref to check jumping status for movement
      if (isJumpingRef.current) {
        playerRef.current.y += velocityY;
        setVelocity((prev) => prev + gravity);
      }

      const isGrounded = playerRef.current.y > gameY;

      if (isGrounded) {
        // FIXED: Set the ref back to false when grounded
        isJumpingRef.current = false;
        playerRef.current.y = gameY;
      }

      // --- Collision Detection ---
      treeContainerRefs.forEach((treeRef, index) => {
        if (
          playerRef.current &&
          treeRef.current &&
          checkForAABB(playerRef.current, treeRef.current)
        ) {
          // Check collision against the most current game information using refs
          if (
            answerToNumber(treeValueRef[index].current!) ==
            gameInfoRef.current.correctAnswer
          ) {
            // console.log("Game Won");
            // Only call setGameWon if the game hasn't already been won for this round
            if (!gameStatus) {
              setGameWon();
            }
          }
        }
      });
    }
  });

  return !loading ? (
    <pixiContainer>
      {/* Ground Line */}
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.lineStyle(2, 0x6662ff, 1);
          g.moveTo(0, gameY + 50);
          g.lineTo(app.screen.width, gameY + 50);
        }}
      />

      <Player x={10} y={gameY} width={50} height={50} ref={playerRef} />

      {treeContainerRefs.map((ref, index) => {
        return (
          <pixiContainer
            ref={ref}
            key={index}
            x={900 + index * 200}
            y={gameY} // Align tree containers to the ground level
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
              style={{ fill: "#ffffff", fontSize: 36, fontWeight: "bold" }}
            />
          </pixiContainer>
        );
      })}
    </pixiContainer>
  ) : (
    <pixiContainer></pixiContainer>
  );
};
