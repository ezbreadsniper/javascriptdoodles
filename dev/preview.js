import { d as generateCharacter } from "/src/core.js";
import { r as renderer, drawHeadInto } from "/src/renderer.js";
import { applyMood } from "/src/mood.js";

/**
 * Dev-only page: renders a still grid of heads with chosen features forced,
 * so a new feature can be screenshotted on many different faces at once.
 *
 *   /dev/preview.html?from=1&count=15&beard=full&headwear=beanie
 *   &mood=love&moodAmount=1&yaw=0.2&columns=5&time=1.2
 *
 * Any feature category id (eye, nose, mouth, hair, headwear, eyewear, beard,
 * brow, cheek, collar, mark, extras) can be forced by name.
 */
const FEATURES = ["eye", "nose", "mouth", "hair", "headwear", "eyewear", "beard", "brow", "cheek", "collar", "mark", "extras", "piercing"];
const params = new URLSearchParams(location.search);
const from = Number(params.get("from") ?? 1);
const count = Number(params.get("count") ?? 15);
const columns = Number(params.get("columns") ?? 5);
const forced = Object.fromEntries(FEATURES.filter((id) => params.has(id)).map((id) => [id, params.get(id)]));
const mood = params.has("mood")
  ? { id: params.get("mood"), amount: Number(params.get("moodAmount") ?? 1), side: 1 }
  : null;
const time = Number(params.get("time") ?? 0);
const pose = {
  yaw: Number(params.get("yaw") ?? 0),
  pitch: Number(params.get("pitch") ?? 0),
  roll: Number(params.get("roll") ?? 0),
};

const canvas = document.getElementById("preview");
const ctx = canvas.getContext("2d");
const ratio = Math.min(window.devicePixelRatio || 1, 2);
const width = innerWidth;
const height = innerHeight;
canvas.width = width * ratio;
canvas.height = height * ratio;
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
renderer.makeSheet(ctx, width, height, from, ratio).done();

const rows = Math.ceil(count / columns);
const cellWidth = width / columns;
const cellHeight = height / rows;
const mass = Math.min(cellWidth * 0.26, cellHeight * 0.22);
for (let index = 0; index < count; index++) {
  const base = generateCharacter(from + index);
  const character = { ...base, features: { ...base.features, ...forced } };
  const state = applyMood(
    { pose, gazeX: 0, gazeY: 0, lids: 0, awake: 0, mouth: 0, time },
    mood,
  );
  drawHeadInto(
    ctx,
    character,
    {
      cx: (index % columns + 0.5) * cellWidth,
      cy: (Math.floor(index / columns) + 0.45) * cellHeight,
      mass,
    },
    state,
  );
}
document.title = "ready";
