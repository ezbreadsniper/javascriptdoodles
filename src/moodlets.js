import { n as projectFieldPoint } from "./field.js";
import { sneezeStage, winkClosure, yawnOpenness } from "./mood.js";

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
const BLUSH_MOODS = new Set(["shy", "love", "giggle"]);

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

/**
 * Lettering (a "?", a "!", a "hic!") often lands on hair, so it gets a
 * letterer's knockout: a paper-coloured margin laid under all of the ink
 * first. On the paper itself it disappears; on a dark afro it lifts the mark
 * clear. Marks are strokes `{ points, style }` or dots `{ at, radius, trace }`.
 */
function lettered(pen, palette, marks, coverage = 1) {
  const margin = INK_WIDTH * 1.1;
  for (const mark of marks) {
    const knockout = { trace: `${mark.trace ?? mark.style.trace}-knockout`, coverage: 0.92 * coverage };
    if (mark.at) pen.dot(mark.at, mark.radius + margin * 0.55, palette.blank, { ...knockout, noHem: true });
    else pen.stroke(mark.points, { ...mark.style, ...knockout, colour: palette.blank, w: mark.style.w + margin * 2, singleLayer: true });
  }
  for (const mark of marks) {
    if (mark.at) pen.dot(mark.at, mark.radius, palette.ink, { trace: mark.trace, coverage });
    else pen.stroke(mark.points, { ...mark.style, colour: palette.ink, coverage: (mark.style.coverage ?? 1) * coverage });
  }
}

function drawExclamation(pen, point, palette) {
  lettered(pen, palette, [
    {
      points: [point(0, -0.36), point(0.01, -0.06)],
      style: { trace: "moodlet-bang", w: INK_WIDTH * 1.9, pointed: 0.35 },
    },
    { at: point(0.005, 0.1), radius: 0.045, trace: "moodlet-bang-dot" },
  ]);
}

function drawQuestion(pen, point, palette) {
  lettered(pen, palette, [
    {
      points: [
        point(-0.15, -0.22),
        point(-0.08, -0.35),
        point(0.06, -0.37),
        point(0.15, -0.26),
        point(0.1, -0.13),
        point(0.01, -0.06),
        point(0, 0.02),
      ],
      style: { trace: "moodlet-query", w: INK_WIDTH * 1.4, pointed: 0.5 },
    },
    { at: point(0, 0.14), radius: 0.04, trace: "moodlet-query-dot" },
  ]);
}

function drawSleep(pen, at, scale, time, palette) {
  for (let index = 0; index < 3; index++) {
    const phase = (time * 0.45 + index / 3) % 1;
    const size = (0.07 + phase * 0.09) * scale;
    const x = at.x + (phase * 0.34 + Math.sin(phase * 5 + index) * 0.04) * scale;
    const y = at.y - phase * 0.6 * scale;
    const fade = Math.sin(phase * Math.PI);
    const zed = [
      { x: x - size, y: y - size },
      { x: x + size, y: y - size },
      { x: x - size, y: y + size },
      { x: x + size, y: y + size },
    ];
    lettered(
      pen,
      palette,
      [{ points: zed, style: { trace: `moodlet-z${index}`, w: INK_WIDTH * 1.1, coverage: 0.85, pointed: 0.3, square: true } }],
      fade,
    );
  }
}

function drawHeart(pen, point, time) {
  const beat = 1 + 0.12 * Math.max(0, Math.sin(time * 7));
  const outline = heartOutline(point, 0.2 * beat);
  pen.surface(outline, { colour: HEART_RED, trace: "moodlet-heart", wobble: 0.004 });
  pen.stroke(outline, { trace: "moodlet-heart-edge", w: INK_WIDTH * 0.8, closed: true, coverage: 0.7 });
}

/** A sweat drop with a firm edge and a glint, so it still reads over blue or dark hair. */
function drawSweat(pen, point, palette) {
  const drop = [
    point(0, -0.18),
    point(0.07, -0.02),
    point(0.08, 0.07),
    point(0, 0.13),
    point(-0.08, 0.07),
    point(-0.07, -0.02),
  ];
  pen.surface(drop, { colour: SWEAT_BLUE, trace: "moodlet-sweat", wobble: 0.003 });
  pen.stroke(drop, { trace: "moodlet-sweat-edge", w: INK_WIDTH * 0.8, closed: true, coverage: 0.85 });
  pen.stroke([point(-0.035, 0.07), point(-0.04, 0.02), point(-0.025, -0.03)], {
    trace: "moodlet-sweat-glint",
    w: INK_WIDTH * 0.75,
    colour: palette.blank,
    coverage: 0.95,
    singleLayer: true,
  });
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
    const size = (0.1 + 0.03 * depth) * scale;
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

/** Laughter shaking off the sides of the head: a pair of arcs at each temple, jittering. */
function drawLaughMarks(pen, field, amount, time, palette) {
  const reach = field.head.rx + 0.06;
  const marks = [];
  for (const side of [-1, 1]) {
    const jitter = Math.sin(time * 23 + side) * 0.02;
    for (let ring = 0; ring < 2; ring++) {
      const radius = 0.16 + ring * 0.12;
      const arc = [];
      for (let step = 0; step <= 6; step++) {
        const angle = (step / 6 - 0.5) * (1 - ring * 0.2) - side * 0.35;
        arc.push({
          x: side * (reach + jitter + Math.cos(angle) * radius),
          y: -0.32 + Math.sin(angle) * radius * side,
        });
      }
      marks.push({
        points: arc,
        style: { trace: `moodlet-laugh${side}${ring}`, w: INK_WIDTH * (1.3 - ring * 0.25), coverage: 0.9, pointed: 0.6 },
      });
    }
  }
  lettered(pen, palette, marks, amount);
}

/**
 * The "choo": spray lines and droplets fanning out from the nose, drawn only
 * once they have cleared the face, so the burst leaves the head sideways.
 */
function drawSneezeSpray(pen, field, layout, side, burst, grow, palette) {
  const nose = projectFieldPoint(0, layout.zones.nose.v - 0.06, field);
  if (nose.nz < 0.1 || burst < 0.05) return;
  const edge = Math.max(0.1, field.head.rx * 0.92 - side * nose.x);
  const ray = (angle, distance) => ({
    x: nose.x + side * Math.cos(angle) * distance,
    y: nose.y + Math.sin(angle) * distance,
  });
  const reach = 0.12 + 0.24 * grow;
  const lines = [];
  for (let line = 0; line < 5; line++) {
    const angle = -0.55 + line * 0.3;
    const start = edge / Math.cos(angle) + 0.03 + 0.04 * (line % 2);
    const length = reach * (line % 2 ? 0.7 : 1);
    lines.push({
      points: [ray(angle, start), ray(angle, start + length)],
      style: { trace: `moodlet-spray${line}`, w: INK_WIDTH * 1.15, coverage: 0.9, pointed: 0.8 },
    });
  }
  lettered(pen, palette, lines, burst);
  for (let drop = 0; drop < 6; drop++) {
    const angle = -0.6 + ((drop * 0.618) % 1) * 1.3;
    const distance = edge / Math.cos(angle) + 0.08 + reach * (0.5 + 0.6 * ((drop * 0.37) % 1));
    pen.dot(ray(angle, distance), 0.024 + 0.012 * (drop % 3), SWEAT_BLUE, {
      trace: `moodlet-droplet${drop}`,
      coverage: 0.95 * burst,
    });
  }
}

function sparkleOutline(point, size) {
  const outline = [];
  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
    const radius = index % 2 ? size * 0.26 : size * (index % 4 ? 0.72 : 1);
    outline.push(point(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  return outline;
}

/** A four-pointed twinkle: the "ting!" of a wink or a smug grin. */
function drawSparkle(pen, point, size, trace, coverage) {
  if (size < 0.01) return;
  const outline = sparkleOutline(point, size);
  pen.surface(outline, { colour: STAR_GOLD, trace, wobble: 0.003, coverage: 0.95 * coverage });
  pen.stroke(outline, { trace: `${trace}-edge`, w: INK_WIDTH * 0.75, closed: true, coverage: 0.85 * coverage });
}

function drawWinkSparkle(pen, field, layout, side, closed, time) {
  const corner = projectFieldPoint(side * layout.eyeU * 1.9, layout.eyeV + 0.22, field);
  if (closed < 0.6) return;
  const pop = overshoot((closed - 0.6) / 0.4) * (1 + 0.08 * Math.sin(time * 9));
  drawSparkle(pen, place({ x: corner.x + side * 0.1, y: corner.y - 0.1 }, 1), 0.18 * pop, "moodlet-wink", 1);
}

function drawProudSparkles(pen, crownY, side, amount, time) {
  const spots = [
    { x: 0.82, y: crownY + 0.34, size: 0.27 },
    { x: 0.52, y: crownY + 0.0, size: 0.16 },
    { x: 1.08, y: crownY + 0.72, size: 0.13 },
  ];
  spots.forEach((spot, index) => {
    const twinkle = 0.7 + 0.3 * Math.sin(time * 4 + index * 2.1);
    const point = place({ x: side * spot.x, y: spot.y }, 1);
    drawSparkle(pen, point, spot.size * twinkle * overshoot(amount), `moodlet-proud${index}`, amount);
  });
}

const BULB_YELLOW = "rgb(250,222,110)";

/** The bright idea: a bulb with a coiled filament, a screw cap and a few rays. */
function drawLightbulb(pen, point, amount, time, palette) {
  const glass = [];
  for (let step = 0; step <= 20; step++) {
    const angle = Math.PI * (0.72 + (step / 20) * 1.56);
    glass.push(point(Math.cos(angle) * 0.17, -0.06 + Math.sin(angle) * 0.17));
  }
  const bulb = [point(0.075, 0.15), ...glass.reverse(), point(-0.075, 0.15)];
  pen.surface(bulb, { colour: BULB_YELLOW, trace: "moodlet-bulb", wobble: 0.003, coverage: 0.95 });
  pen.stroke(bulb, { trace: "moodlet-bulb-edge", w: INK_WIDTH, closed: true });
  pen.stroke([point(-0.04, 0.12), point(-0.03, 0.02), point(-0.01, -0.04), point(0.01, 0.02), point(0.03, -0.04), point(0.04, 0.02), point(0.04, 0.12)], {
    trace: "moodlet-filament",
    w: INK_WIDTH * 0.6,
    coverage: 0.7,
    singleLayer: true,
  });
  for (let thread = 0; thread < 2; thread++) {
    pen.stroke([point(-0.08, 0.19 + thread * 0.05), point(0.08, 0.18 + thread * 0.05)], {
      trace: `moodlet-cap${thread}`,
      w: INK_WIDTH * 0.95,
      square: true,
    });
  }
  pen.stroke([point(-0.03, 0.26), point(0.03, 0.26)], { trace: "moodlet-cap-tip", w: INK_WIDTH * 1.2 });
  const glow = 0.8 + 0.2 * Math.sin(time * 8);
  for (let ray = 0; ray < 5; ray++) {
    const angle = -Math.PI / 2 + (ray / 4 - 0.5) * 2.3;
    const from = 0.24;
    const to = from + 0.1 * glow * amount;
    pen.stroke(
      [point(Math.cos(angle) * from, -0.06 + Math.sin(angle) * from), point(Math.cos(angle) * to, -0.06 + Math.sin(angle) * to)],
      { trace: `moodlet-ray${ray}`, w: INK_WIDTH * 1.1, colour: palette.ink, pointed: 0.4, coverage: 0.9 },
    );
  }
}

/** "Pbbbt": spit sprays off the tip of the tongue towards whoever asked for it. */
function drawRaspberry(pen, field, layout, side, amount, time, palette) {
  const mouth = projectFieldPoint(0, layout.mouthV, field);
  if (mouth.nz < 0.1) return;
  const tip = { x: 0.04 * side, y: 0.16 };
  const at = (angle, distance) => mouth.to(tip.x + side * Math.cos(angle) * distance, -(tip.y + Math.sin(angle) * distance));
  const rattle = 0.015 * Math.sin(time * 40);
  for (let line = 0; line < 3; line++) {
    const angle = 0.05 + line * 0.38;
    const from = 0.1 + rattle + (line % 2) * 0.03;
    pen.stroke([at(angle, from), at(angle + 0.06, from + 0.07), at(angle + 0.1, from + 0.13)], {
      trace: `moodlet-pbbt${line}`,
      w: INK_WIDTH * 0.8,
      colour: palette.ink,
      coverage: 0.85 * amount,
      pointed: 0.9,
      singleLayer: true,
    });
  }
  for (let drop = 0; drop < 4; drop++) {
    const spot = at(0.1 + drop * 0.27 + rattle * 4, 0.3 + (drop % 2) * 0.06);
    pen.dot(spot, 0.022 + 0.009 * ((drop + 1) % 2), SWEAT_BLUE, { trace: `moodlet-spit${drop}`, coverage: 0.95 * amount });
  }
}

/** Green with envy: a tangled grumble of a scribble hanging in the air. */
const ENVY_GREEN = "rgb(92,138,84)";
function drawGrumble(pen, point, amount) {
  const scribble = [];
  const turns = 3.2;
  for (let step = 0; step <= 60; step++) {
    const t = (step / 60) * turns * Math.PI * 2;
    scribble.push(point(Math.cos(t) * 0.19 + Math.cos(t * 2.7 + 1) * 0.07, Math.sin(t) * 0.12 + Math.sin(t * 3.3) * 0.05));
  }
  pen.stroke(scribble, { trace: "moodlet-grumble", w: INK_WIDTH * 1.05, colour: ENVY_GREEN, coverage: 0.95 * amount, pointed: 0.6 });
}

/** A hiccup, lettered by hand: "hic!", popping out beside the head with each jolt. */
function drawHiccup(pen, point, since, palette) {
  const show = Math.min(1, Math.max(0, 1 - (since - 0.55) / 0.35));
  if (show <= 0) return;
  const pop = overshoot(Math.min(1, since / 0.14));
  const at = (x, y) => point(x * pop, y * pop);
  const letter = (trace, w = INK_WIDTH * 1.25) => ({ trace, w, pointed: 0.35 });
  lettered(
    pen,
    palette,
    [
      { points: [at(-0.2, -0.13), at(-0.22, 0.1)], style: letter("moodlet-hic-h") },
      { points: [at(-0.215, 0.02), at(-0.17, -0.03), at(-0.12, 0), at(-0.12, 0.1)], style: letter("moodlet-hic-h2") },
      { points: [at(-0.03, -0.02), at(-0.04, 0.1)], style: letter("moodlet-hic-i") },
      { at: at(-0.025, -0.1), radius: 0.028 * pop, trace: "moodlet-hic-dot" },
      { points: [at(0.14, -0.01), at(0.07, -0.02), at(0.05, 0.05), at(0.08, 0.1), at(0.15, 0.09)], style: letter("moodlet-hic-c") },
      { points: [at(0.25, -0.14), at(0.245, 0.04)], style: letter("moodlet-hic-bang", INK_WIDTH * 1.4) },
      { at: at(0.245, 0.1), radius: 0.03 * pop, trace: "moodlet-hic-bang-dot" },
    ],
    0.95 * show,
  );
}

/** "Phew": a puff of breath let out sideways past the jaw, with a couple of speed lines. */
function drawPuff(pen, field, layout, side, amount, palette) {
  const mouth = projectFieldPoint(0, layout.mouthV, field);
  if (mouth.nz < 0.1) return;
  const centre = { x: mouth.x + side * (field.head.rx * 0.8 + 0.12 * amount), y: mouth.y + 0.12 };
  const cloud = [];
  const lobes = [
    [0, -0.07, 0.09],
    [side * 0.09, 0, 0.08],
    [0, 0.06, 0.08],
    [-side * 0.07, 0, 0.07],
  ];
  for (let step = 0; step < 32; step++) {
    const angle = (step / 32) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let radius = 0;
    for (const [lx, ly, size] of lobes) {
      const toward = lx * dx + ly * dy;
      radius = Math.max(radius, toward + Math.sqrt(Math.max(0, size * size - (lx * lx + ly * ly - toward * toward))));
    }
    cloud.push({ x: centre.x + dx * radius * amount, y: centre.y + dy * radius * amount });
  }
  pen.surface(cloud, { colour: palette.blank, trace: "moodlet-puff", wobble: 0.003, coverage: 0.9 });
  pen.stroke(cloud, { trace: "moodlet-puff-edge", w: INK_WIDTH * 0.9, closed: true, colour: palette.ink, coverage: 0.85 });
  for (let line = 0; line < 2; line++) {
    const from = { x: mouth.x + side * 0.14, y: mouth.y + 0.01 + line * 0.06 };
    const to = { x: centre.x - side * 0.13, y: centre.y - 0.05 + line * 0.08 };
    pen.stroke([from, to], {
      trace: `moodlet-breath${line}`,
      w: INK_WIDTH * 0.75,
      colour: palette.ink,
      coverage: 0.75 * amount,
      singleLayer: true,
    });
  }
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
      return drawSweat(pen, place({ x: -side * 0.78, y: crownY + 0.55 }, scale), palette);
    case "annoyed":
      return drawAnger(pen, point, time);
    case "dizzy":
      return drawOrbitingStars(pen, { x: 0, y: crownY + 0.08 }, scale, time);
    case "hum":
      return drawTune(pen, { x: side * 0.78, y: crownY + 0.62 }, side, amount, time, palette);
    case "giggle":
      return drawLaughMarks(pen, field, amount, time, palette);
    case "sneeze": {
      const { burst } = sneezeStage(mood);
      const grow = mood.phase === undefined ? 1 : Math.min(1, Math.max(0, (mood.phase - 0.6) / 0.07));
      return drawSneezeSpray(pen, field, layout, side, burst * amount, grow, palette);
    }
    case "wink":
      return drawWinkSparkle(pen, field, layout, side, winkClosure(mood), time);
    case "proud":
      return drawProudSparkles(pen, crownY, side, amount, time);
    case "idea":
      return drawLightbulb(pen, place({ x: side * 0.95, y: crownY + 0.2 + bob }, scale), amount, time, palette);
    case "raspberry":
      return drawRaspberry(pen, field, layout, side, amount, time, palette);
    case "jealous":
      return drawGrumble(pen, place({ x: -side * 0.9, y: crownY + 0.3 + bob }, scale), amount);
    case "hiccup":
      return drawHiccup(pen, place({ x: side * 0.95, y: crownY + 0.62 }, 1), mood.since ?? 0.3, palette);
    case "phew":
      return drawPuff(pen, field, layout, side, amount, palette);
  }
}
