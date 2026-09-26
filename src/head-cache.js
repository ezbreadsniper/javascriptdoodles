import { drawHeadInto, headBeat } from "./renderer.js";

/**
 * Each head on the sheet keeps its own bitmap and is only redrawn when
 * something about it visibly changed: it turned, looked elsewhere, blinked,
 * babbled, or its pen line boiled onto the next beat. A resting sheet then
 * costs one `drawImage` per head instead of thousands of pen strokes.
 *
 * Everything the renderer paints is plain source-over, which composites the
 * same whether it lands on the paper directly or on a transparent layer that
 * is stamped onto the paper afterwards.
 */
const POSE_EPSILON = 0.0015;
const GAZE_EPSILON = 0.008;
const LIDS_EPSILON = 0.02;
const AWAKE_EPSILON = 0.008;
const MOUTH_EPSILON = 0.02;
const MOOD_EPSILON = 0.01;
/** One-shot moods (a sneeze, a wink, a hiccup) animate along their phase. */
const PHASE_EPSILON = 0.02;
const REGION_PAD = 0.1;
/**
 * Moving heads are drawn "on twos", as hand-drawn animation is: each head
 * repaints on alternate frames, half the sheet on even frames and half on odd.
 */
const FRAMES_PER_DRAWING = 2;

const differs = (a, b, epsilon) => Math.abs((a ?? 0) - (b ?? 0)) > epsilon;

function moodChanged(previous, next) {
  if (!previous && !next) return false;
  if (!previous || !next || previous.id !== next.id) return true;
  return differs(previous.amount, next.amount, MOOD_EPSILON) || differs(previous.phase, next.phase, PHASE_EPSILON);
}

function stateChanged(previous, next) {
  return (
    differs(previous.pose.yaw, next.pose.yaw, POSE_EPSILON) ||
    differs(previous.pose.pitch, next.pose.pitch, POSE_EPSILON) ||
    differs(previous.pose.roll, next.pose.roll, POSE_EPSILON) ||
    differs(previous.gazeX, next.gazeX, GAZE_EPSILON) ||
    differs(previous.gazeY, next.gazeY, GAZE_EPSILON) ||
    differs(previous.lids, next.lids, LIDS_EPSILON) ||
    differs(previous.awake, next.awake, AWAKE_EPSILON) ||
    differs(previous.mouth, next.mouth, MOUTH_EPSILON) ||
    differs(previous.wink, next.wink, LIDS_EPSILON) ||
    moodChanged(previous.mood, next.mood)
  );
}

function regionFor(cell, pixelRatio) {
  const padX = cell.w * REGION_PAD;
  const padY = cell.h * REGION_PAD;
  const left = Math.floor((cell.cx - cell.w / 2 - padX) * pixelRatio) / pixelRatio;
  const top = Math.floor((cell.cy - cell.h * 0.5 - padY) * pixelRatio) / pixelRatio;
  const width = Math.ceil((cell.w + padX * 2) * pixelRatio) / pixelRatio;
  const height = Math.ceil((cell.h * 1.06 + padY * 2) * pixelRatio) / pixelRatio;
  return { left, top, width, height };
}

function createLayer(region, pixelRatio) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(region.width * pixelRatio);
  canvas.height = Math.round(region.height * pixelRatio);
  const ctx = canvas.getContext("2d");
  return { canvas, ctx };
}

export function createHeadCache() {
  let layers = new Map();
  let frame = 0;

  function paint(layer, character, placement, state, pixelRatio) {
    const { ctx, canvas, region } = layer;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, -region.left * pixelRatio, -region.top * pixelRatio);
    drawHeadInto(ctx, character, placement, state);
    layer.state = state;
    layer.beat = headBeat(character, state.time ?? 0);
  }

  return {
    /** Forget every bitmap, e.g. after a resize or a new sheet. */
    reset() {
      layers = new Map();
    },

    /** Advance the drawing clock; call once per animation frame. */
    nextFrame() {
      frame++;
    },

    /** Draw one sheet head onto `target`, repainting its layer only if it changed. */
    draw(target, cell, character, placement, state, pixelRatio) {
      const key = cell.seed;
      let layer = layers.get(key);
      if (!layer || layer.character !== character || layer.mass !== placement.mass) {
        const region = regionFor(cell, pixelRatio);
        layer = {
          ...createLayer(region, pixelRatio),
          region,
          character,
          mass: placement.mass,
          slot: layers.size % FRAMES_PER_DRAWING,
        };
        layers.set(key, layer);
        paint(layer, character, placement, state, pixelRatio);
      } else if (
        frame % FRAMES_PER_DRAWING === layer.slot &&
        (headBeat(character, state.time ?? 0) !== layer.beat || stateChanged(layer.state, state))
      ) {
        paint(layer, character, placement, state, pixelRatio);
      }
      const { region, canvas } = layer;
      target.drawImage(canvas, region.left, region.top, region.width, region.height);
    },
  };
}
