import type { Object3D } from "three";

export const TILE_TOP = 0.34;
export const TILE_PRESS_DEPTH = 0.14;
export type TileContact = { index: number; weight: number };
export type TileSpring = { offset: number; velocity: number };

/** Substeps keep the button stable even after a slow render frame. */
export function stepTileSpring(s: TileSpring, load: number, dt: number) {
  let remaining = Math.min(Math.max(dt, 0), 0.1);
  const target = -TILE_PRESS_DEPTH * Math.min(1, Math.max(0, load)) || 0;
  while (remaining > 0) {
    const h = Math.min(remaining, 1 / 120);
    s.velocity += ((target - s.offset) * 260 - s.velocity * 25) * h;
    s.offset += s.velocity * h;
    remaining -= h;
  }
  if (Math.abs(s.offset - target) < 0.0001 && Math.abs(s.velocity) < 0.001) {
    s.offset = target;
    s.velocity = 0;
  }
}

export function loadTileButtons(buttons: Object3D[], pawns: Object3D[]) {
  const loads = new Float32Array(buttons.length);
  for (const pawn of pawns) {
    if (!pawn) continue;
    for (const c of (pawn.userData.tileContacts ?? []) as TileContact[]) {
      if (c.index >= 0 && c.index < loads.length) loads[c.index] += c.weight;
    }
  }
  buttons.forEach((button, i) => button.userData.setLoad?.(loads[i]));
}

/** Called once after pawn motion and tile springs; no accumulated vertical drift. */
export function supportPawns(buttons: Object3D[], pawns: Object3D[]) {
  for (const pawn of pawns) {
    if (!pawn) continue;
    pawn.position.y -= pawn.userData.supportOffset ?? 0;
    const offset = ((pawn.userData.tileContacts ?? []) as TileContact[]).reduce(
      (sum, c) => sum + (buttons[c.index]?.userData.pressOffset ?? 0) * c.weight, 0,
    );
    pawn.position.y += offset;
    pawn.userData.supportOffset = offset;
  }
}
