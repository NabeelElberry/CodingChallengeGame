import type { Sprite } from "pixi.js";
import type { RefObject } from "react";

export interface xyInterface {
  x: number;
  y: number;
  ref: RefObject<Sprite | null>;
  width: number;
  height: number;
}

export interface gameWonInterface {
  setGameWon: () => void;
  gameStatus: boolean;
  gameInformation: Question;
  answerOrder: string;
}

export interface Question {
  correctAnswer: number;
  answerChoices: string[];
  questionText: string;
}
