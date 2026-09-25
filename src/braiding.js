import {
  paintBob,
  paintBobBehind,
  SWEPT_BOX_BRAIDS_BOB,
} from "./swept-box-braids.js";
import {
  paintFeedInGhanaBraids,
  paintFeedInGhanaBraidsBehind,
} from "./feed-in-ghana-braids.js";
import { paintStraightBackCornrows } from "./straight-back-cornrows.js";

/**
 * Braided hairstyles, keyed by the `features.hair` id that selects them.
 *
 * Each entry supplies what to draw behind the head and what to draw in front of
 * it. `renderer` already splits the portrait into those two layers for the native
 * hair, so these hook into the same seam rather than introducing a second one.
 * `side` is the extra side room the portrait needs beyond the head itself, in
 * the same units `space` uses.
 */
export const braiding = {
  straightbacks: {
    label: `Straight-backs`,
    front: paintStraightBackCornrows,
    side: 1.32,
  },
  ghanabraids: {
    label: `Ghana braids`,
    back: paintFeedInGhanaBraidsBehind,
    front: paintFeedInGhanaBraids,
    side: 1.5,
  },
  sweptbob: {
    label: `Swept bob`,
    back: paintBobBehind(SWEPT_BOX_BRAIDS_BOB),
    front: paintBob(SWEPT_BOX_BRAIDS_BOB),
    side: 1.84,
  },
};

export const isBraidedHairstyle = (id) => Object.hasOwn(braiding, id);

/** The braided layer that belongs behind the head, if this style has one. */
export function drawBraidsBack(pen, field, character, palette) {
  const style = braiding[character.features.hair];
  if (!style?.back) return;
  style.back({ pen, field, character, palette });
}

/** The braided layer that belongs in front of the head. */
export function drawBraidsFront(pen, field, character, palette) {
  const style = braiding[character.features.hair];
  if (!style?.front) return;
  style.front({ pen, field, character, palette });
}

/** Extra side room a braided style needs, or 0 when it is not one. */
export function braidingSpace(character) {
  return braiding[character.features.hair]?.side ?? 0;
}
