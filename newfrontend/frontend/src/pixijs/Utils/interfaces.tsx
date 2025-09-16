import type { Sprite } from "pixi.js";
import type { Dispatch, RefObject, SetStateAction } from "react";

export interface xyInterface {
  x: number;
  y: number;
  ref: RefObject<Sprite | null>;
  width: number;
  height: number;
}

export interface gameWonInterface {
  gameWonFunction: Dispatch<SetStateAction<boolean>>;
}

export interface gameState {
  gameWon: boolean;
  setGameWon: Dispatch<SetStateAction<boolean>>;
}
