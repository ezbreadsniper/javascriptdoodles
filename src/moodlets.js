import { n as projectFieldPoint } from "./field.js";
import { yawnOpenness } from "./mood.js";

/**
 * The marks a mood leaves on and around a head: blush on the cheeks, and a
 * moodlet — a small doodled sign — floating beside the skull. Everything is
 * drawn with the head's own pen, so a heart or a question mark wobbles and
 * boils exactly like the face it belongs to.
 *
 * Coordinates are head units with y pointing down, as inside the renderer's
 * portrait transform.
 */
const HEART_RED = "rgb(214,76,94)";
const SWEAT_BLUE = "rgb(126,178,222)";
const STAR_GOLD = "rgb(232,186,62)";
const INK_WIDTH = 0.026;
const BLUSH_MOODS = new Set(["shy", "love"]);

const overshoot = (t) => {
  const c = 2.2;
  const x = Math.min(1, Math.max(0, t)) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};

const place = (at, scale) => (x, y) => ({ x: at.x + x * scale, y: at.y + y * scale });

function heartOutline(point, size, samples = 28) {
  const outline = [];
  for (let index = 0; index < samples; index++) {
    const t = (index / samples) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    outline.push(point((x / 17) * size, (-y / 17) * size));
  }
  return outline;
}

function starOutline(point, size, turn) {
  const outline = [];
  for (let index = 0; index < 10; index++) {
    const angle = turn + (index / 10) * Math.PI * 2 - Math.PI / 2;
    const radius = index % 2 ? size * 0.45 : size;
    outline.push(point(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  return outline;
}

function drawExclamation(pen, point, palette) {
  pen.stroke([point(0, -0.36), point(0.01, -0.06)], {
    trace: "moodlet-bang",
    w: INK_WIDTH * 1.9,
    colour: palette.ink,
    pointed: 0.35,
  });
  pen.dot(point(0.005, 0.1), 0.045, palette.ink, { trace: "moodlet-bang-dot" });
}

function drawQuestion(pen, point, palette) {
  pen.stroke(
    [
      point(-0.15, -0.22),
      point(-0.08, -0.35),
      point(0.06, -0.37),
      point(0.15, -0.26),
      point(0.1, -0.13),
      point(0.01, -0.06),
      point(0, 0.02),
    ],
    { trace: "moodlet-query", w: INK_WIDTH * 1.4, colour: palette.ink, pointed: 0.5 },
  );
  pen.dot(point(0, 0.14), 0.04, palette.ink, { trace: "moodlet-query-dot" });
}

function drawSleep(pen, at, scale, time, palette) {
  for (let index = 0; index < 3; index++) {
    const phase = (time * 0.45 + index / 3) % 1;
    const size = (0.07 + phase * 0.09) * scale;
    const x = at.x + (phase * 0.34 + Math.sin(phase * 5 + index) * 0.04) * scale;
    const y = at.y - phase * 0.6 * scale;
    const fade = Math.sin(phase * Math.PI);
    pen.stroke(
      [
        { x: x - size, y: y - size },
        { x: x + size, y: y - size },
        { x: x - size, y: y + size },
        { x: x + size, y: y + size },
      ],
      {
        trace: `moodlet-z${index}`,
        w: INK_WIDTH * 1.1,
        colour: palette.ink,
        coverage: 0.85 * fade,
        pointed: 0.3,
        square: true,
      },
    );
  }
}

function drawHeart(pen, point, time) {
  const beat = 1 + 0.12 * Math.max(0, Math.sin(time * 7));
  const outline = heartOutline(point, 0.2 * beat);
  pen.surface(outline, { colour: HEART_RED, trace: "moodlet-heart", wobble: 0.004 });
  pen.stroke(outline, { trace: "moodlet-heart-edge", w: INK_WIDTH * 0.8, closed: true, coverage: 0.7 });
}

function drawSweat(pen, point) {
  const drop = [
    point(0, -0.18),
    point(0.07, -0.02),
    point(0.08, 0.07),
    point(0, 0.13),
    point(-0.08, 0.07),
    point(-0.07, -0.02),
  ];
  pen.surface(drop, { colour: SWEAT_BLUE, trace: "moodlet-sweat", wobble: 0.003 });
  pen.stroke(drop, { trace: "moodlet-sweat-edge", w: INK_WIDTH * 0.7, closed: true, coverage: 0.6 });
}

/** The cross-shaped vein: four curved ticks whose points face the centre. */
function drawAnger(pen, point, time) {
  const throb = 1 + 0.1 * Math.max(0, Math.sin(time * 9));
  const polar = (radius, angle) =>
    point(Math.cos(angle) * radius * throb, Math.sin(angle) * radius * throb);
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    const angle = quadrant * (Math.PI / 2) + Math.PI / 4;
    pen.stroke([polar(0.26, angle - 0.5), polar(0.1, angle), polar(0.26, angle + 0.5)], {
      trace: `moodlet-vein${quadrant}`,
      w: INK_WIDTH * 1.7,
      colour: HEART_RED,
      pointed: 0.35,
    });
  }
}

function drawOrbitingStars(pen, crown, scale, time) {
  for (let index = 0; index < 3; index++) {
    const angle = time * 3.2 + (index / 3) * Math.PI * 2;
    const depth = Math.sin(angle);
    const centre = {
      x: crown.x + Math.cos(angle) * 0.55 * scale,
      y: crown.y + depth * 0.12 * scale,
    };
    const size = (0.07 + 0.025 * depth) * scale;
    const outline = starOutline((x, y) => ({ x: centre.x + x, y: centre.y + y }), size, angle);
    pen.surface(outline, { colour: STAR_GOLD, trace: `moodlet-orbit${index}`, square: true, dry: true });
    pen.stroke(outline, {
      trace: `moodlet-orbit-edge${index}`,
      w: INK_WIDTH * 0.6,
      closed: true,
      square: true,
      coverage: 0.7,
    });
  }
}

function drawNoteHead(pen, point, trace, colour, coverage) {
  pen.dot(point(0, 0), 0.062, colour, { trace, coverage, stretch: 1.35, turn: -0.45 });
}

/** One quaver (a stem with a flag) or a beamed pair, rising and fading. */
function drawNote(pen, point, beamed, index, colour, coverage) {
  const stem = { w: INK_WIDTH * 0.95, colour, coverage, pointed: 0.2, singleLayer: true };
  const heads = beamed ? [0, 0.19] : [0];
  heads.forEach((x, part) => {
    const at = (dx, dy) => point(x + dx, dy - part * 0.04);
    drawNoteHead(pen, at, `moodlet-note${index}-${part}`, colour, coverage);
    pen.stroke([at(0.068, -0.01), at(0.07, -0.3)], { ...stem, trace: `moodlet-stem${index}-${part}` });
  });
  if (beamed) {
    pen.stroke([point(0.07, -0.3), point(0.26, -0.34)], {
      ...stem,
      trace: `moodlet-beam${index}`,
      w: INK_WIDTH * 1.9,
      square: true,
    });
    return;
  }
  pen.stroke([point(0.07, -0.3), point(0.15, -0.23), point(0.17, -0.13)], {
    ...stem,
    trace: `moodlet-flag${index}`,
    w: INK_WIDTH * 1.2,
    pointed: 0.7,
  });
}

function drawTune(pen, at, side, amount, time, palette) {
  for (let index = 0; index < 2; index++) {
    const phase = (time * 0.32 + index * 0.5) % 1;
    const lift = Math.sin(phase * Math.PI);
    const x = at.x + side * (phase * 0.28 + index * 0.08) + Math.sin(phase * 7 + index * 2) * 0.05;
    const y = at.y - phase * 0.55;
    const scale = overshoot(amount) * (0.75 + 0.3 * lift);
    drawNote(pen, place({ x, y }, scale), index === 1, index, palette.ink, 0.95 * amount * lift ** 0.6);
  }
}

function drawYawnTear(pen, field, layout, side, open) {
  const corner = projectFieldPoint(side * layout.eyeU * 1.36, layout.eyeV - 0.1, field);
  if (corner.nz < 0.2 || open < 0.35) return;
  const size = 0.05 * Math.min(1, (open - 0.35) / 0.4);
  const drop = [
    corner.to(0, size * 1.5),
    corner.to(size * 0.9, -size * 0.2),
    corner.to(0, -size),
    corner.to(-size * 0.9, -size * 0.2),
  ];
  pen.surface(drop, { colour: SWEAT_BLUE, trace: "moodlet-tear", wobble: 0.002 });
  pen.stroke(drop, { trace: "moodlet-tear-edge", w: INK_WIDTH * 0.55, closed: true, coverage: 0.55 });
}

function drawBlush(pen, field, layout, amount, palette) {
  const v = layout.eyeV - (layout.eyeV - layout.mouthV) * 0.42;
  for (const side of [-1, 1]) {
    const cheek = projectFieldPoint(side * layout.eyeU * 1.08, v, field);
    if (cheek.nz < 0.15) continue;
    pen.dot(cheek.to(0, 0), 0.1, palette.accent, {
      trace: `blush-wash${side}`,
      coverage: 0.4 * amount,
      stretch: 1.5,
      field: cheek,
      noHem: true,
    });
    for (let stroke = -1; stroke <= 1; stroke++) {
      pen.stroke([cheek.to(stroke * 0.07 - 0.035, 0.045), cheek.to(stroke * 0.07 + 0.035, -0.045)], {
        trace: `blush${side}${stroke}`,
        w: INK_WIDTH * 0.7,
        colour: palette.accent,
        coverage: 0.9 * amount,
        singleLayer: true,
        pointed: 0.5,
      });
    }
  }
}

/** Blush and moodlet for one head. `mood` is `{ id, amount, side }` or null. */
export function drawMoodMarks(pen, field, layout, mood, palette, time) {
  if (mood?.id === "yawn") return drawYawnTear(pen, field, layout, mood.side, yawnOpenness(mood));
  if (!mood || mood.amount < 0.05) return;
  const { id, amount, side } = mood;
  if (BLUSH_MOODS.has(id)) drawBlush(pen, field, layout, amount, palette);

  const crownY = -(field.head.ry * 1.08 + 0.12);
  const scale = overshoot(amount);
  const bob = Math.sin(time * 2.6) * 0.03;
  const beside = { x: side * 0.9, y: crownY + 0.25 + bob };
  const point = place(beside, scale);

  switch (id) {
    case "startled":
      return drawExclamation(pen, point, palette);
    case "curious":
      return drawQuestion(pen, point, palette);
    case "sleepy":
      return drawSleep(pen, { x: side * 0.7, y: crownY + 0.3 }, amount, time, palette);
    case "love":
      return drawHeart(pen, place({ x: beside.x, y: beside.y - Math.sin(time * 1.6) * 0.04 }, scale), time);
    case "shy":
      return drawSweat(pen, place({ x: -side * 0.78, y: crownY + 0.55 }, scale));
    case "annoyed":
      return drawAnger(pen, point, time);
    case "dizzy":
      return drawOrbitingStars(pen, { x: 0, y: crownY + 0.08 }, scale, time);
    case "hum":
      return drawTune(pen, { x: side * 0.78, y: crownY + 0.62 }, side, amount, time, palette);
  }
}
