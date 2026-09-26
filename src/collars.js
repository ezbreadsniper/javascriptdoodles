import { d as oklch, u as rgbOf } from "./palette.js";

const FRONT = 1.86;
const LABEL_Y = 1.68;
const CLEARANCE = LABEL_Y - 0.17;
// The hard floor: LABEL_Y is the top of the name label, keep a hair above it.
const FLOOR = LABEL_Y - 0.06;
const TURN = Math.PI * 2;

const SHIRT_COLLARS = new Set([`shirt`, `bowtie`, `tie`, `sweater`]);

function onBody(kit, u, r, lift = 0) {
  return kit.at(u / (kit.radius + lift), r, lift);
}

function reach(kit, from, want, least = 0) {
  const start = kit.at(0, from).y;
  const step = (kit.at(0, from - 0.1).y - start) / 0.1;
  const room = step > 1e-3 ? (CLEARANCE - start) / step : want;
  const hard = step > 1e-3 ? (FLOOR - start) / step : want;
  return Math.min(hard, Math.max(least, Math.min(want, room)));
}

function measure(kit) {
  const base = kit.at(0, 0);
  return {
    base,
    neck: Math.max(kit.neck * 2, 0.24),
    tall: Math.min(0.32, Math.max(0.2, base.y - kit.chin)),
    // On the few long-necked heads whose neck already ends past CLEARANCE,
    // garments still get a sliver of room, but never past the label's top.
    room: Math.max(CLEARANCE - base.y, Math.min(0.07, FLOOR - base.y)),
  };
}

function inked(kit, trace, w, extra = {}) {
  return { trace, w, wobble: 0.003, colour: kit.palette.ink, ...extra };
}

function toOklch(css) {
  const [r, g, b] = (String(css).match(/[\d.]+/g) ?? [0, 0, 0]).slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const z = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    c: Math.hypot(a, z),
    h: ((Math.atan2(z, a) * 180) / Math.PI + 360) % 360,
  };
}

function tint(css, lightness, chroma) {
  return rgbOf(oklch(lightness, chroma, toOklch(css).h));
}

function ring(centre, radius, steps = 10) {
  return oval(centre, radius, radius, steps);
}

function oval(centre, rx, ry, steps = 14) {
  const points = [];
  for (let k = 0; k < steps; k++) {
    const a = (TURN * k) / steps;
    points.push({ x: centre.x + Math.cos(a) * rx, y: centre.y + Math.sin(a) * ry });
  }
  return points;
}

function roundBox(centre, rx, ry, power = 4, steps = 28) {
  const points = [];
  for (let k = 0; k < steps; k++) {
    const a = (TURN * k) / steps;
    const c = Math.cos(a);
    const s = Math.sin(a);
    points.push({
      x: centre.x + rx * Math.sign(c) * Math.abs(c) ** (2 / power),
      y: centre.y + ry * Math.sign(s) * Math.abs(s) ** (2 / power),
    });
  }
  return points;
}

function teardrop(centre, radius) {
  return ring(centre, radius, 12).map((p) => {
    const rise = centre.y - p.y;
    if (rise <= 0) return p;
    return { x: centre.x + (p.x - centre.x) * (1 - (rise / radius) * 0.7), y: centre.y - rise * 1.35 };
  });
}

function bezier(a, b, c, d, steps = 14) {
  const points = [];
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const u = 1 - t;
    points.push({
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
    });
  }
  return points;
}

function between(a, b, v) {
  return { x: a.x + (b.x - a.x) * v, y: a.y + (b.y - a.y) * v };
}

/**
 * A stable 0..1 number per character (and per `salt`), taken from the collar's
 * own seeded params so a garment keeps its colour through every redraw.
 */
function roll(params, salt = 0) {
  const x = Math.sin(params.fit * 131.7 + params.crooked * 977.3 + params.opening * 53.1 + salt * 17.9) * 43758.5453;
  return x - Math.floor(x);
}

/** One colour from a weighted list of `[lightness, chroma, hue, weight]`. */
function pickTone(tones, v) {
  let left = v * tones.reduce((sum, tone) => sum + (tone[3] ?? 1), 0);
  for (const tone of tones) {
    left -= tone[3] ?? 1;
    if (left < 0) return tone;
  }
  return tones[tones.length - 1];
}

function toneCss([l, c, h], shift = 0) {
  return rgbOf(oklch(Math.max(0.15, Math.min(0.97, l + shift)), c, h));
}

function toneOf(css) {
  const { l, c, h } = toOklch(css);
  return [l, c, h];
}

function inside(point, polygon) {
  let hit = !1;
  for (let k = 0, j = polygon.length - 1; k < polygon.length; j = k++) {
    const a = polygon[k];
    const b = polygon[j];
    if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

// Tie and bow-tie silks: mid tones, so the ink outline still draws the shape
// on the white shirt and the colour never sinks into a deep skin tone.
const SILKS = [
  [0.55, 0.17, 25, 1.2],
  [0.5, 0.13, 262, 1.2],
  [0.74, 0.13, 82],
  [0.58, 0.1, 195],
  [0.5, 0.11, 330, 0.8],
  [0.55, 0.1, 150, 0.8],
  [0.45, 0.13, 15, 0.8],
];

// Crew-neck sweaters: navy, bottle green, burgundy, mustard, camel, heather.
const KNITWEAR = [
  [0.42, 0.09, 262, 1.3],
  [0.47, 0.09, 155],
  [0.45, 0.12, 15],
  [0.74, 0.13, 82],
  [0.68, 0.07, 65],
  [0.62, 0.012, 260],
  [0.55, 0.12, 250, 0.7],
];

/**
 * The shirt-based garments dress the plain shirt first: a crisp pale shirt
 * collar, with the tie, bow or sweater colour carried in `garment`.
 */
function tailor(id, palette, params) {
  const tones = id === `sweater` ? KNITWEAR : SILKS;
  if (id !== `tie` && id !== `bowtie` && id !== `sweater`) return { palette, params };
  return {
    palette: {
      ...palette,
      garment: toneCss(pickTone(tones, roll(params, 4))),
      cloth: tint(palette.cloth, 0.965, 0.012),
      clothDeep: tint(palette.cloth, 0.88, 0.02),
      clothDark: !1,
    },
    params:
      id === `tie`
        ? params
        : { ...params, point: params.point * (id === `sweater` ? 0.9 : 0.72), height: params.height * 0.7 },
  };
}

// Hoodie cottons: heather grey most of all, then navy, forest, maroon,
// mustard, dusty pink and sky.
const HOODIES = [
  [0.74, 0.008, 260, 1.5],
  [0.44, 0.08, 262],
  [0.52, 0.08, 152, 0.8],
  [0.47, 0.11, 18, 0.8],
  [0.77, 0.12, 82, 0.8],
  [0.78, 0.06, 5, 0.7],
  [0.72, 0.08, 235, 0.8],
];

/**
 * Hoodie with the hood down: a soft, wide hood bunched up behind the neck,
 * its thick front edge running round the neck into a U, and two drawstrings
 * with dark tips hanging from the bottom of the U.
 */
function hoodie(kit) {
  const { params, palette, ry } = kit;
  const { base } = measure(kit);
  const tone = pickTone(HOODIES, roll(params, 8));
  const cloth = toneCss(tone);
  const deep = toneCss(tone, -0.17);
  const neck = kit.radius * 0.95;
  const up = Math.max(0.12, (base.y - kit.chin) / riseScale(kit));
  // The hood is about as wide as the jaw and bunches up behind the neck to
  // chin height, so its two soft shoulders show either side of the jaw.
  const wide = Math.max(0.24, Math.min(0.36, ry * 0.34));
  const crown = up + 0.03;
  const sag = 0.055;
  const band = Math.max(0.045, Math.min(0.065, wide * 0.18));
  const at = (u, r) => chest(kit, u, r, 5);
  const hood = [];
  for (let k = 0; k <= 28; k++) {
    const s = -1 + (2 * k) / 28;
    const shoulder = Math.sqrt(Math.max(0, 1 - s * s));
    hood.push(at(s * wide, -0.02 + crown * shoulder ** 0.55 * (1 - 0.18 * s * s)));
  }
  for (let k = 1; k < 8; k++) hood.push(at(wide * (1 - (2 * k) / 8), -0.03));
  const hollow = [];
  for (let k = 0; k <= 16; k++) {
    const s = -1 + (2 * k) / 16;
    hollow.push(at(s * neck * 1.45, crown * 0.8 * Math.sqrt(1 - s * s) ** 0.6 - 0.01));
  }
  const curve = (half, drop, rise) => {
    const points = [];
    for (let k = 0; k <= 16; k++) {
      const s = -1 + (2 * k) / 16;
      points.push(at(s * half, rise * s * s - drop * (1 - s * s)));
    }
    return points;
  };
  const inner = curve(neck * 1.1, sag, crown * 0.42);
  const outer = curve(neck * 1.1 + band * 1.5, sag + band, crown * 0.42 + band * 0.1);
  const strings = (pen) => {
    for (const side of [-1, 1]) {
      const start = at(side * neck * 0.32, -sag - band * 0.55);
      const length = Math.min(Math.max(0.06, Math.min(0.2, LABEL_Y - 0.12 - start.y)), FLOOR - 0.04 - start.y);
      const end = { x: start.x + side * 0.012, y: start.y + length };
      const path = bezier(
        start,
        { x: start.x - side * 0.02, y: start.y + length * 0.35 },
        { x: end.x + side * 0.01, y: start.y + length * 0.65 },
        end,
        10,
      );
      pen.stroke(path, inked(kit, `hood-string${side}`, 0.032));
      pen.stroke(path.slice(1, -1), { trace: `hood-cord${side}`, w: 0.013, wobble: 0.002, colour: palette.blank, singleLayer: !0 });
      pen.surface(roundBox({ x: end.x, y: end.y + 0.016 }, 0.017, 0.027, 3, 14), { colour: palette.ink, trace: `hood-tip${side}` });
    }
  };
  return {
    hem: kit.arc(-FRONT, FRONT),
    back: (pen) => {
      kit.fill(pen, hood, cloth, `hood`);
      pen.stroke(hood.slice(0, 29), inked(kit, `hood`, 0.024));
      kit.fill(pen, [...hollow, ...curve(neck * 1.45, 0.01, 0).reverse()], deep, `hood-hollow`);
      pen.stroke(hollow, inked(kit, `hood-hollow`, 0.016, { coverage: 0.7 }));
      // A soft fold on each side where the hood's fabric bunches.
      for (const side of [-1, 1])
        pen.stroke(
          bezier(
            at(side * neck * 1.7, crown * 0.62),
            at(side * wide * 0.5, crown * 0.6),
            at(side * wide * 0.72, crown * 0.36),
            at(side * wide * 0.8, crown * 0.12),
            8,
          ),
          inked(kit, `hood-fold${side}`, 0.013, { coverage: 0.55, singleLayer: !0 }),
        );
    },
    front: (pen) => {
      kit.fill(pen, [...outer, ...inner.slice().reverse()], cloth, `hood-rim`);
      pen.stroke(outer, inked(kit, `hood-rim`, 0.024));
      pen.stroke(inner, inked(kit, `hood-neckline`, 0.02));
      strings(pen);
    },
  };
}

// Two-colour block-stripe knits: [main l, c, h, weight, stripe]. Mid tones,
// so the ink outline still carries the shape on every skin tone.
const SCARF_KNITS = [
  [0.56, 0.17, 27, 1.2, [0.93, 0.03, 90]],
  [0.76, 0.13, 82, 1, [0.42, 0.09, 262]],
  [0.58, 0.09, 200, 1, [0.93, 0.03, 90]],
  [0.52, 0.09, 152, 1, [0.8, 0.13, 88]],
  [0.5, 0.12, 15, 0.8, [0.86, 0.05, 10]],
  [0.64, 0.012, 260, 0.8, [0.84, 0.14, 95]],
  [0.52, 0.14, 258, 1, [0.72, 0.14, 45]],
];

/** How far the page moves per unit of `r` in `kit.at`, measured at the front. */
function riseScale(kit) {
  return Math.max(0.3, (kit.at(0, 0).y - kit.at(0, 0.1).y) / 0.1);
}

/**
 * One turn of a wrapped scarf seen from the front: its top and bottom edges
 * round the neck, closed at each side by the round end where it turns away.
 */
function wrapBand(kit, top, bottom, lift, sag = 0, span = 1.5708) {
  const edge = (r, from, to) => {
    const points = [];
    for (let k = 0; k <= 18; k++) {
      const t = from + ((to - from) * k) / 18;
      points.push(kit.at(t, r - sag * Math.cos(t) ** 2, lift));
    }
    return points;
  };
  const upper = edge(top, -span, span);
  const lower = edge(bottom, span, -span);
  const cap = (a, b, outward) => {
    const mid = between(a, b, 0.5);
    const radius = Math.hypot(b.x - a.x, b.y - a.y) / 2 || 1e-3;
    const along = { x: (b.x - a.x) / (2 * radius), y: (b.y - a.y) / (2 * radius) };
    const points = [];
    for (let k = 1; k < 7; k++) {
      const f = (Math.PI * k) / 7;
      const out = Math.sin(f) * radius * 0.8;
      points.push({
        x: mid.x - along.x * Math.cos(f) * radius + outward * Math.abs(along.y) * out,
        y: mid.y - along.y * Math.cos(f) * radius,
      });
    }
    return points;
  };
  return [...upper, ...cap(upper[upper.length - 1], lower[0], 1), ...lower, ...cap(lower[lower.length - 1], upper[0], -1)];
}

/** The part of a `wrapBand` between two angles round the neck. */
function wrapBlock(kit, top, bottom, lift, sag, from, to) {
  const points = [];
  for (let k = 0; k <= 5; k++) {
    const t = from + ((to - from) * k) / 5;
    points.push(kit.at(t, top - sag * Math.cos(t) ** 2, lift));
  }
  for (let k = 5; k >= 0; k--) {
    const t = from + ((to - from) * k) / 5;
    points.push(kit.at(t, bottom - sag * Math.cos(t) ** 2, lift));
  }
  return points;
}

/**
 * One loose end of a scarf: a thick, slightly swaying band that hangs from
 * `root` along `angle` (0 is straight down), with two stripe blocks near the
 * end and a short fringe.
 */
function scarfEnd(pen, kit, { root, angle, length, width, main, stripe, name }) {
  const dir = { x: Math.sin(angle), y: Math.cos(angle) };
  const side = { x: dir.y, y: -dir.x };
  const sway = length * 0.08 * Math.sign(angle || 1);
  const tip = { x: root.x + dir.x * length, y: root.y + dir.y * length };
  const path = bezier(
    root,
    { x: root.x + dir.x * length * 0.35 - side.x * sway, y: root.y + dir.y * length * 0.35 - side.y * sway },
    { x: root.x + dir.x * length * 0.7 + side.x * sway, y: root.y + dir.y * length * 0.7 + side.y * sway },
    tip,
    12,
  );
  const edge = (s, v) => {
    const k = Math.round(v * (path.length - 1));
    const half = (width / 2) * (1 + 0.1 * v);
    return { x: path[k].x + side.x * s * half, y: path[k].y + side.y * s * half };
  };
  const strip = (from, to) => {
    const points = [];
    for (let k = 0; k <= 4; k++) points.push(edge(1, from + ((to - from) * k) / 4));
    for (let k = 4; k >= 0; k--) points.push(edge(-1, from + ((to - from) * k) / 4));
    return points;
  };
  const outline = strip(0, 1);
  kit.fill(pen, outline, main, name);
  for (const [k, [from, to]] of [[0.46, 0.6], [0.7, 0.84]].entries()) kit.fill(pen, strip(from, to), stripe, `${name}-stripe${k}`);
  pen.stroke([...strip(0, 1).slice(0, 5)], inked(kit, `${name}-l`, 0.019));
  pen.stroke([...strip(0, 1).slice(5)], inked(kit, `${name}-r`, 0.019));
  const tipL = edge(1, 1);
  const tipR = edge(-1, 1);
  pen.stroke([tipL, tipR], inked(kit, `${name}-tip`, 0.017));
  for (let k = 0; k < 5; k++) {
    const at = between(tipL, tipR, 0.1 + k * 0.2);
    pen.stroke([at, { x: at.x + dir.x * 0.032, y: at.y + dir.y * 0.032 }], inked(kit, `${name}-fringe${k}`, 0.012, { singleLayer: !0 }));
  }
}

/**
 * Chunky knit scarf: wrapped twice round the neck and tucked up under the
 * jaw, wider than the neck on both sides, with two striped ends hanging from
 * a loose knot to one side of the front.
 */
function scarf(kit) {
  const { params } = kit;
  const { base } = measure(kit);
  const [l, c, h, , stripeTone] = pickTone(SCARF_KNITS, roll(params, 6));
  const main = toneCss([l, c, h]);
  const shade = toneCss([l, c, h], -0.14);
  const stripe = toneCss(stripeTone);
  const unit = riseScale(kit);
  const chinR = Math.max(0.12, (base.y - kit.chin) / unit);
  const thick = Math.max(0.085, Math.min(0.125, chinR * 0.5));
  const top1 = chinR + thick * 0.3;
  const bottom1 = top1 - thick;
  const top2 = bottom1 + thick * 0.28;
  const bottom2 = top2 - thick * 1.06;
  const half = Math.max(0.2, Math.min(0.28, kit.radius * 1.9));
  const lift1 = half - kit.radius;
  const lift2 = half * 1.08 - kit.radius;
  const side = roll(params, 7) < 0.5 ? -1 : 1;
  // The outer turn hangs a little looser, dipping at the front.
  const droop = thick * 0.45;
  const knotT = side * 0.42;
  const knotAt = kit.at(knotT, bottom2 + thick * 0.4 - droop * Math.cos(knotT) ** 2, lift2 + 0.01);
  const width = thick * unit * 1.05;
  // The long end hangs nearly straight; when the name label is close it
  // swings out to the side instead of turning into a stub.
  const room = Math.max(LABEL_Y - 0.1 - knotAt.y, Math.min(0.12, FLOOR - knotAt.y)) - 0.03;
  const want = 0.25;
  const angle = Math.min(1, Math.max(0.06, Math.acos(Math.max(-1, Math.min(1, room / want)))));
  const length = Math.max(0.07, Math.min(want, room / Math.cos(angle)));
  const stripes = (pen, top, bottom, lift, sag, name, phase) => {
    const period = 0.34 / (kit.radius + lift);
    for (let t = -1.5708 + phase * period; t < 1.5708; t += period) {
      const from = Math.max(-1.5708, t);
      const to = Math.min(1.5708, t + period * 0.4);
      if (to - from > 0.05) kit.fill(pen, wrapBlock(kit, top, bottom, lift, sag, from, to), stripe, `${name}${Math.round(t * 10)}`);
    }
  };
  const band = (pen, top, bottom, lift, sag, name, phase) => {
    const shape = wrapBand(kit, top, bottom, lift, sag);
    kit.fill(pen, shape, main, name);
    stripes(pen, top, bottom, lift, sag, `${name}-stripe`, phase);
    const rib = [];
    for (let k = 0; k <= 16; k++) {
      const t = -1.35 + (2.7 * k) / 16;
      rib.push(kit.at(t, (top + bottom) / 2 - sag * Math.cos(t) ** 2, lift + thick * 0.3));
    }
    pen.stroke(rib, {
      trace: `${name}-rib`,
      w: 0.012,
      wobble: 0.003,
      colour: shade,
      coverage: 0.7,
      singleLayer: !0,
    });
    pen.stroke(shape, inked(kit, name, 0.021, { closed: !0 }));
  };
  const knot = roundBox(knotAt, width * 0.78, width * 0.62, 2.4, 20);
  return {
    hem: kit.arc(-FRONT, FRONT, (top1 + bottom1) / 2),
    back: (pen) => {
      const rim = [...kit.arc(-1.5708, -4.7124, top1, lift1, 20), ...kit.arc(1.5708, -1.5708, top1, lift1, 20)];
      kit.fill(pen, rim, shade, `scarf-back`);
      pen.stroke(kit.arc(1.5708, 4.7124, top1, lift1, 16), inked(kit, `scarf-back`, 0.02));
    },
    front: (pen) => {
      const common = { width, main, stripe };
      const shortRoot = { x: knotAt.x + side * width * 0.35, y: knotAt.y };
      scarfEnd(pen, kit, { ...common, root: shortRoot, angle: side * Math.min(1.05, angle + 0.34), length: length * 0.74, name: `scarf-end-short` });
      scarfEnd(pen, kit, { ...common, root: knotAt, angle: side * angle, length, name: `scarf-end` });
      band(pen, top1, bottom1, lift1, 0, `scarf-wrap`, 0.3);
      band(pen, top2, bottom2, lift2, droop, `scarf-wrap2`, 0.75);
      kit.fill(pen, knot, main, `scarf-knot`);
      pen.stroke(
        bezier(
          { x: knotAt.x - side * width * 0.55, y: knotAt.y - width * 0.28 },
          { x: knotAt.x - side * width * 0.05, y: knotAt.y - width * 0.3 },
          { x: knotAt.x + side * width * 0.2, y: knotAt.y + width * 0.05 },
          { x: knotAt.x + side * width * 0.12, y: knotAt.y + width * 0.55 },
          8,
        ),
        inked(kit, `scarf-knot-fold`, 0.013, { coverage: 0.7, singleLayer: !0 }),
      );
      pen.stroke(knot, inked(kit, `scarf-knot`, 0.02, { closed: !0 }));
    },
  };
}

function chain(kit) {
  const { ry, palette, params } = kit;
  const hem = kit.arc(-FRONT, FRONT);
  const path = [];
  for (let k = 0; k <= 48; k++) {
    const t = -1.42 + (2.84 * k) / 48;
    const hang = Math.cos(t) ** 2;
    path.push(kit.at(t, ry * (0.05 - 0.13 * hang), -kit.radius * 0.34 * (1 - hang)));
  }
  const links = [];
  let travelled = 0;
  for (let k = 1; k < path.length; k++) {
    const a = path[k - 1];
    const b = path[k];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    travelled += d;
    if (travelled < 0.034) continue;
    travelled = 0;
    links.push({ x: b.x, y: b.y, dx: (b.x - a.x) / d, dy: (b.y - a.y) / d });
  }
  const hasPendant = params.crooked > -0.02;
  const drop = params.opening > 0.265;
  return {
    hem,
    back: () => {},
    front: (pen) => {
      pen.stroke(hem, inked(kit, `collar`, 0.022, { wobble: 0.004 }));
      for (const [k, l] of links.entries()) {
        const along = k % 2 === 0 ? 0.021 : 0.015;
        const across = k % 2 === 0 ? 0.012 : 0.003;
        const oval = [];
        for (let s = 0; s < 8; s++) {
          const a = (TURN * s) / 8;
          const u = Math.cos(a) * along;
          const v = Math.sin(a) * across;
          oval.push({ x: l.x + l.dx * u - l.dy * v, y: l.y + l.dy * u + l.dx * v });
        }
        pen.stroke(oval, inked(kit, `chain${k}`, 0.0075, { closed: !0, coverage: 0.9, singleLayer: !0 }));
      }
      if (!hasPendant) return;
      const centre = path[24];
      const size = Math.min(ry * 0.045, reach(kit, ry * -0.08, ry * 0.09) * 0.5);
      const hang = { x: centre.x, y: centre.y + size * 1.25 };
      const shape = drop ? teardrop(hang, size) : ring(hang, size, 12);
      pen.stroke(ring({ x: centre.x, y: centre.y + size * 0.1 }, size * 0.28, 8), inked(kit, `pendant-bail`, 0.008, { closed: !0 }));
      pen.surface(shape, { colour: palette.fabric, trace: `pendant`, wobble: 0.002 });
      pen.stroke(shape, inked(kit, `pendant`, 0.013, { closed: !0 }));
      pen.dot({ x: hang.x - size * 0.3, y: hang.y - size * 0.25 }, size * 0.18, palette.blank, { trace: `pendant-shine`, coverage: 0.8 });
    },
  };
}

function tie(kit, { depth }) {
  const { palette, params } = kit;
  const { neck, tall } = measure(kit);
  const colour = palette.garment;
  const light = toneCss(toneOf(colour), 0.2);
  const knotTop = onBody(kit, 0, 0.004, 0.01);
  const knotR = -Math.min(neck * 0.42, depth * 1.1);
  const knotLow = onBody(kit, 0, knotR, 0.01);
  const hang = reach(kit, -depth * 1.15, Math.max(tall * 1.3, 0.16), 0.08);
  const tipR = -depth * 1.15 - hang;
  const centreAt = (v) => onBody(kit, 0, knotR + neck * 0.08 + (tipR - knotR - neck * 0.08) * v, 0.01);
  const width = (v) => neck * (0.15 + 0.125 * Math.min(1, v / 0.85));
  const edge = (side) => {
    const points = [];
    for (let k = 0; k <= 6; k++) {
      const v = (0.86 * k) / 6;
      const c = centreAt(v);
      points.push({ x: c.x + side * width(v), y: c.y });
    }
    return points;
  };
  const blade = [...edge(-1), centreAt(1), ...edge(1).reverse()];
  const knot = [
    { x: knotTop.x - neck * 0.225, y: knotTop.y },
    { x: knotTop.x + neck * 0.225, y: knotTop.y },
    { x: knotLow.x + neck * 0.15, y: knotLow.y },
    { x: knotLow.x - neck * 0.15, y: knotLow.y },
  ];
  const striped = params.opening > 0.25 && hang > tall * 1.1;
  return {
    blade: (pen) => {
      pen.surface(blade, { colour, trace: `tie`, wobble: 0.002 });
      if (striped)
        for (const [k, v] of [0.3, 0.5, 0.7].entries()) {
          const c = centreAt(v);
          const w = width(v) * 0.9;
          pen.stroke(
            [
              { x: c.x - w, y: c.y + w * 0.5 },
              { x: c.x + w, y: c.y - w * 0.5 },
            ],
            { trace: `tie-stripe${k}`, w: 0.014, wobble: 0.002, colour: light, singleLayer: !0 },
          );
        }
      pen.stroke(blade, inked(kit, `tie`, 0.02, { closed: !0 }));
    },
    knot: (pen) => {
      pen.surface(knot, { colour, trace: `tie-knot`, wobble: 0.002 });
      pen.stroke(knot, inked(kit, `tie-knot`, 0.02, { closed: !0 }));
    },
  };
}

/**
 * Bow tie: two flared wings pinched into a small knot, a fold line on each
 * wing, and now and then white polka dots.
 */
function bowtie(kit, { depth }) {
  const { palette, params } = kit;
  const { neck } = measure(kit);
  const centre = onBody(kit, 0, -depth * 0.28, 0.012);
  const wide = neck * 0.78;
  const high = wide * 0.36;
  const colour = palette.garment;
  const deep = toneCss(toneOf(colour), -0.12);
  const dotted = roll(params, 5) < 0.35;
  const at = (u, v) => ({ x: centre.x + u * wide, y: centre.y + v * high });
  const wing = (side) => {
    const points = [at(side * 0.14, -0.38), at(side * 0.6, -0.8), at(side * 0.97, -1)];
    for (let k = 1; k < 6; k++) {
      const v = -1 + (2 * k) / 6;
      points.push(at(side * (0.97 - 0.1 * (1 - v * v)), v));
    }
    points.push(at(side * 0.97, 1), at(side * 0.6, 0.8), at(side * 0.14, 0.38));
    return points;
  };
  const knot = roundBox(centre, wide * 0.16, high * 0.52, 3, 18);
  return (pen) => {
    for (const side of [-1, 1]) {
      const shape = wing(side);
      pen.surface(shape, { colour, trace: `bow${side}`, wobble: 0.002 });
      if (dotted)
        for (const [k, [u, v]] of [[0.42, -0.3], [0.7, 0.35], [0.8, -0.55], [0.5, 0.45]].entries())
          pen.dot(at(side * u, v), 0.011, palette.blank, { trace: `bow-dot${side}${k}`, noHem: !0 });
      pen.stroke([...shape, shape[0]], inked(kit, `bow${side}`, 0.019));
      pen.stroke(
        [at(side * 0.2, 0.05), at(side * 0.55, 0.3)],
        inked(kit, `bow-crease${side}`, 0.011, { coverage: 0.6, singleLayer: !0 }),
      );
    }
    pen.surface(knot, { colour: deep, trace: `bow-knot`, wobble: 0.002 });
    pen.stroke(knot, inked(kit, `bow-knot`, 0.017, { closed: !0 }));
  };
}

/**
 * Crew-neck sweater over a shirt: a ribbed band in the sweater colour round
 * the base of the neck, drawn before the shirt's collar points so they lie
 * out over it.
 */
function crewBand(kit, { depth }) {
  const { palette, params } = kit;
  const collar = 0.055 + params.height * 0.12;
  const top = (t) => -Math.max(collar * 0.5, depth * 0.5) * (0.25 + 0.75 * Math.cos(t) ** 2);
  const band = Math.max(0.04, Math.min(0.06, measure(kit).room * 0.4));
  const lift = kit.radius * 0.3;
  const edge = (from, to, drop, out) => {
    const points = [];
    for (let k = 0; k <= 20; k++) {
      const t = from + ((to - from) * k) / 20;
      points.push(kit.at(t, top(t) - drop, lift + out));
    }
    return points;
  };
  const upper = edge(-FRONT, FRONT, 0, 0);
  const lower = edge(FRONT, -FRONT, band, band * 0.7);
  const shade = toneCss(toneOf(palette.garment), -0.14);
  return (pen) => {
    kit.fill(pen, [...upper, ...lower], palette.garment, `crew`);
    for (let k = 0; k < 15; k++) {
      const t = -1.62 + (3.24 * (k + 0.5)) / 15;
      pen.stroke([kit.at(t, top(t) - band * 0.2, lift + band * 0.14), kit.at(t, top(t) - band * 0.8, lift + band * 0.56)], {
        trace: `crew-rib${k}`,
        w: 0.011,
        wobble: 0.002,
        colour: shade,
        singleLayer: !0,
      });
    }
    pen.stroke(upper, inked(kit, `crew-top`, 0.02));
    pen.stroke(lower, inked(kit, `crew-foot`, 0.02));
  };
}

function shirtTrim(id, kit, opening) {
  if (id !== `tie` && id !== `bowtie` && id !== `sweater`) return null;
  const { spread, depth } = opening;
  const placket = [
    kit.at(-spread * 0.95, 0),
    kit.at(spread * 0.95, 0),
    kit.at(spread * 0.8, -depth),
    kit.at(0, -depth * 1.15),
    kit.at(-spread * 0.8, -depth),
  ];
  const under = (pen) => kit.fill(pen, placket, kit.palette.cloth, `placket`);
  if (id === `sweater`) return { under, over: crewBand(kit, opening) };
  if (id === `tie`) {
    const knotted = tie(kit, opening);
    return { under: (pen) => (under(pen), knotted.blade(pen)), over: knotted.knot };
  }
  return { under, over: bowtie(kit, opening) };
}


/**
 * A point on the chest, `u` to the side of the middle and `r` up (negative:
 * down). The neck's own ring at that height is scaled out sideways, so wide
 * garments turn with the body like the collars do, and curve with the same
 * gentle smile without sliding up or down the page on a pitched head.
 */
function chest(kit, u, r, grow = 3) {
  const t = Math.max(-1.5, Math.min(1.5, u / (kit.radius * grow)));
  const p = kit.at(t, r);
  const centre = between(kit.at(-Math.PI / 2, r), kit.at(Math.PI / 2, r), 0.5);
  return { x: centre.x + (p.x - centre.x) * grow, y: centre.y + (p.y - centre.y) * Math.min(grow, 1.6) };
}

/** How far a chest garment may spread either side of the neck. */
function shoulders(kit, scale = 1) {
  return Math.max(0.17, Math.min(0.34, kit.radius * 2.3)) * scale;
}

// Navy is the classic marinière; red and near-black stripes turn up now and then.
const BRETON_STRIPES = [
  [0.38, 0.1, 262, 3],
  [0.54, 0.17, 27, 1.3],
  [0.3, 0.02, 280, 0.8],
];

/**
 * Breton top: a wide, nearly straight boat neckline and a few thick stripes
 * below it that widen a little towards the shoulders and simply stop, so the
 * paper reads as the white shirt.
 */
function breton(kit) {
  const { params } = kit;
  const { room } = measure(kit);
  const wide = shoulders(kit, 0.95);
  const line = (half, drop, sag, steps = 16) => {
    const points = [];
    for (let k = 0; k <= steps; k++) {
      const s = -1 + (2 * k) / steps;
      points.push(chest(kit, s * half, -drop - sag * (1 - s * s), 6));
    }
    return points;
  };
  const hem = line(wide, 0, 0.028, 20);
  const stripe = toneCss(pickTone(BRETON_STRIPES, roll(params, 1)));
  const gap = Math.max(0.042, Math.min(0.064, room / 3));
  const count = 3;
  return {
    hem,
    back: () => {},
    front: (pen) => {
      for (let k = 1; k <= count; k++) {
        const stripeLine = line(wide * (0.97 + k * 0.09), gap * k - 0.008, 0.006);
        const lowest = Math.max(...stripeLine.map((p) => p.y));
        if (lowest > (k === 1 ? FLOOR : CLEARANCE + 0.03)) break;
        pen.stroke(stripeLine, {
          trace: `breton-stripe${k}`,
          w: 0.034,
          wobble: 0.003,
          colour: stripe,
          coverage: 0.95,
          pointed: 0.5,
        });
      }
      pen.stroke(hem, inked(kit, `collar`, 0.022, { wobble: 0.004 }));
    },
  };
}

// Loud but friendly grounds, each with a pale print and a second print colour.
const CAMP_PRINTS = [
  [0.7, 0.11, 200, 1, [0.95, 0.03, 90], [0.82, 0.14, 88]],
  [0.68, 0.14, 35, 1, [0.95, 0.03, 90], [0.62, 0.12, 150]],
  [0.82, 0.14, 92, 0.8, [0.97, 0.02, 90], [0.6, 0.17, 27]],
  [0.6, 0.12, 152, 1, [0.95, 0.03, 90], [0.72, 0.14, 40]],
  [0.72, 0.11, 350, 0.9, [0.96, 0.02, 90], [0.8, 0.13, 95]],
  [0.58, 0.17, 25, 0.8, [0.96, 0.02, 90], [0.82, 0.13, 92]],
];

/**
 * Hawaiian camp collar: an open V of skin with two broad, flat lapels lying
 * out over the chest, dotted with a tiny two-colour print.
 */
function hawaiian(kit) {
  const { params, palette } = kit;
  const { room } = measure(kit);
  const [l, c, h, , paleTone, popTone] = pickTone(CAMP_PRINTS, roll(params, 3));
  const ground = toneCss([l, c, h]);
  const groundDeep = toneCss([l, c, h], -0.14);
  const pale = toneCss(paleTone);
  const pop = toneCss(popTone);
  const { base } = measure(kit);
  // A camp collar lies flat and wide over the shoulders, only a short V deep.
  const drop = Math.min(Math.max(0.08, room * 0.7), 0.19, Math.max(0.04, FLOOR - base.y));
  const wide = shoulders(kit, 1.35);
  const neck = kit.radius * 0.75;
  const at = (u, r) => chest(kit, u, r, 4);
  const vee = [at(-neck, 0.012), at(0, -drop), at(neck, 0.012)];
  const hem = [...kit.arc(-FRONT, -0.75, 0, 0, 8), kit.at(0, -drop * 0.98), ...kit.arc(0.75, FRONT, 0, 0, 8)];
  // Each lapel in (u, r) on the chest: up the neck side, out along the
  // shoulder, down to a blunt point, and back in to the bottom of the V.
  const lapelPlan = [
    [neck * 0.9, 0.022],
    [wide * 0.7, 0.028],
    [wide, -drop * 0.3],
    [wide * 0.62, -drop * 0.62],
    [wide * 0.06, -drop * 0.97],
  ];
  const lapel = (side) => lapelPlan.map(([u, r]) => at(side * u, r));
  // The print is laid out on the cloth itself, so it travels with the lapel.
  const spots = [];
  const plan = lapelPlan.map(([x, y]) => ({ x, y }));
  const step = Math.max(0.034, wide * 0.19);
  for (let row = 0, y = 0.02; y > -drop; y -= step * 0.85, row++)
    for (let x = (row % 2) * step * 0.5; x < wide; x += step) {
      const spot = { x: x + (roll(params, row * 7 + x * 40) - 0.5) * step * 0.35, y };
      if (inside(spot, plan)) spots.push({ ...spot, pop: roll(params, row * 13 + x * 71) > 0.66 });
    }
  return {
    hem,
    back: (pen) => {
      kit.fill(pen, [...kit.arc(-1.5708, -4.7124, 0, 0, 20), ...kit.arc(1.5708, -1.5708, -drop * 0.22, 0, 20)], groundDeep, `collar-base`);
      pen.stroke(kit.arc(1.74, 4.5432, 0, 0, 14), inked(kit, `collar-back`, 0.02, { coverage: 0.8 }));
    },
    front: (pen) => {
      pen.surface(vee, { colour: palette.skin, dry: !0 });
      for (const side of [-1, 1]) {
        const shape = lapel(side);
        kit.fill(pen, shape, ground, `camp${side}`);
        for (const [k, spot] of spots.entries())
          pen.dot(at(side * spot.x, spot.y), spot.pop ? 0.015 : 0.012, spot.pop ? pop : pale, {
            trace: `camp-dot${side}${k}`,
            noHem: !0,
          });
        pen.stroke([...shape, shape[0]], inked(kit, `camp${side}`, 0.02, { square: !0 }));
      }
      pen.stroke([vee[0], vee[1], vee[2]], inked(kit, `camp-vee`, 0.016, { coverage: 0.5, singleLayer: !0 }));
    },
  };
}

// Blazer cloths: navy, charcoal, camel, bottle green, burgundy, tweed brown.
const BLAZERS = [
  [0.4, 0.07, 262, 1.4],
  [0.42, 0.012, 270, 1],
  [0.66, 0.07, 68, 0.9],
  [0.45, 0.07, 160, 0.7],
  [0.42, 0.1, 18, 0.6],
  [0.52, 0.05, 55, 0.7],
];

/**
 * Blazer over a crew-neck tee: the tee's round neckline, and the jacket's
 * long notched lapels framing it in a steep V down to the top button.
 */
function blazer(kit) {
  const { params, palette } = kit;
  const { base, room } = measure(kit);
  const tone = pickTone(BLAZERS, roll(params, 9));
  const cloth = toneCss(tone);
  const seam = tone[0] < 0.5 ? toneCss(tone, 0.2) : toneCss(tone, -0.2);
  const drop = Math.min(Math.max(0.12, room * 0.95), 0.3, Math.max(0.04, FLOOR - base.y - 0.02));
  const neck = kit.radius * 0.95;
  const wide = Math.max(neck * 1.15 + 0.08, shoulders(kit, 0.7));
  const at = (u, r) => chest(kit, u, r, 4);
  const hem = kit.arc(-FRONT, FRONT);
  // One lapel in (u, r): collar along the shoulder, the notch, the lapel's
  // peak, its long outer edge down to the button, and the roll line back up.
  const plan = [
    [neck * 1.15, 0.03],
    [neck * 1.15 + (wide - neck * 1.15) * 0.45, 0.03],
    [neck * 1.1 + (wide - neck * 1.1) * 0.6, -drop * 0.16],
    [neck * 1.1 + (wide - neck * 1.1) * 0.45, -drop * 0.24],
    [wide, -drop * 0.32],
    [0.012, -drop],
    [neck * 0.6, -drop * 0.3],
  ];
  const lapel = (side) => plan.map(([u, r]) => at(side * u, r));
  return {
    hem,
    back: (pen) => {
      kit.fill(pen, [...kit.arc(-1.5708, -4.7124, 0.03, 0, 20), ...kit.arc(1.5708, -1.5708, -0.01, 0, 20)], toneCss(tone, -0.1), `collar-base`);
    },
    front: (pen) => {
      pen.stroke(hem, inked(kit, `collar`, 0.022, { wobble: 0.004 }));
      for (const side of [-1, 1]) {
        const shape = lapel(side);
        kit.fill(pen, shape, cloth, `lapel${side}`);
        pen.stroke([shape[1], shape[2], shape[3]], { trace: `lapel-notch${side}`, w: 0.012, wobble: 0.002, colour: seam, singleLayer: !0 });
        pen.stroke([...shape, shape[0]], inked(kit, `lapel${side}`, 0.02, { square: !0 }));
      }
      pen.dot(at(0, -drop - 0.02), 0.017, palette.ink, { trace: `blazer-button` });
    },
  };
}

const WORN = { hoodie, scarf, chain, breton, hawaiian, blazer };

function wornCollar(id, kit) {
  return WORN[id]?.(kit) ?? null;
}

export { SHIRT_COLLARS, shirtTrim, tailor, wornCollar };
