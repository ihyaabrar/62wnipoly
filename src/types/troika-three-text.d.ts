// troika-three-text tidak menyertakan "types" di package.json; deklarasi minimal untuk yang dipakai.
declare module "troika-three-text" {
  import { Mesh } from "three";
  export class Text extends Mesh {
    text: string;
    font: string;
    fontSize: number;
    color: string | number;
    anchorX: number | "left" | "center" | "right";
    anchorY: number | "top" | "middle" | "bottom";
    textAlign: "left" | "center" | "right" | "justify";
    maxWidth: number;
    lineHeight: number | "normal";
    letterSpacing: number;
    outlineWidth: number | string;
    outlineColor: string | number;
    sdfGlyphSize: number;
    sync(callback?: () => void): void;
    dispose(): void;
  }
}
