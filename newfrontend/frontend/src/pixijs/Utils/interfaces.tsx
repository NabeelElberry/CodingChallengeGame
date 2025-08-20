import type { Sprite } from "pixi.js";
import type { RefObject } from "react";

export interface xyInterface {
  x: number;
  y: number;
  ref: RefObject<Sprite | null>;
  width: number;
  height: number;
}
