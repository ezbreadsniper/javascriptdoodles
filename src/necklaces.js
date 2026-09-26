import { j as seeded } from "./core.js";
import { c as rotate, d as surfacePoint, f as project, l as rotation } from "./cloud.js";
import { metalFor } from "./extras.js";
import { d as oklch, u as css } from "./palette.js";

/**
 * Necklaces: jewellery worn over whatever top the collar drew. They hang in
 * the same body frame the collars use (a ring around the base of the neck
 * that turns a little with the head), so they sit on the neckline and swing
 * with the chest, and they are drawn right after the collar so the chin,
 * beard and hair still fall in front of them.
 */

const LABEL_Y = 1.68;
const CLEARANCE = LABEL_Y - 0.17;
const TURN = Math.PI * 2;
const tone = (l, c, h) => css(oklch(l, c, h));
const DARK_SKIN = 0.3;
const PEARL = { base: tone(0.95, 0.014, 85), shine: tone(0.995, 0.004, 90) };
const CORD = tone(0.55, 0.08, 60);
const TOOTH = tone(0.91, 0.045, 85);
// Velvet: black, wine and teal. Black drops out on very dark skin, where it would vanish.
const VELVET = [tone(0.27, 0.02, 280), tone(0.42, 0.14, 15), tone(0.44, 0.08, 205)];
// Bead sets as [odd beads, front bead, even beads]: wood and amber, wood and turquoise, painted.
const BEADS = [
  [tone(0.52, 0.08, 55), tone(0.74, 0.14, 75), tone(0.6, 0.15, 30)],
  [tone(0.52, 0.08, 55), tone(0.66, 0.11, 185), tone(0.9, 0.03, 90)],
  [tone(0.68, 0.14, 30), tone(0.82, 0.13, 88), tone(0.66, 0.1, 200)],
];

/** The knit collar's widest point (its lower edge) as a multiple of the neck, as `head.js` builds it. */
function rollWidth({ height, widening, wide }) {
  const tall = Math.max(0, height - 0.16);
  return (1.28 + tall * 1.3) * wide * (1 + 0.34 * (0.12 + (widening - 1) * 1.6 + tall * 1.4));
}

/** The collar's body frame, rebuilt for the plain neckline every top shares. */
function neckFrame(field, outline, neckWidth, params, collar) {
  const { head, pose, F } = field;
  const ry = head.ry;
  let chin = -Infinity;
  for (const p of outline) if (p.y > chin) chin = p.y;
  let sum = 0;
  let count = 0;
  for (const p of outline) if (p.y >= chin - ry * 0.06) (sum += p.x), count++;
  const shift = (count ? sum / count : 0) * 0.35;
  const side = surfacePoint(0.3, -1.22, head);
  const neck = Math.abs(side.x) * neckWidth;
  const halfNeck = Math.abs(project(side, F).x) * neckWidth;
  const top = surfacePoint(0, -1.22, head);
  const centre = { x: 0, y: Math.min(top.y - ry * 0.06, top.y - ry * params.deep), z: 0 };
  const radius = neck * 1.6 * params.wide;
  const turn = rotation({ yaw: pose.yaw * 0.3 + params.fit, pitch: pose.pitch * 0.15, roll: pose.roll * 0.32 });
  let drop = 0;
  const at = (t, r = 0, out = 0) => {
    const a = rotate(turn, { x: Math.sin(t) * (radius + out), y: r, z: Math.cos(t) * (radius * 0.7 + out) });
    const o = project({ x: centre.x + a.x, y: centre.y + a.y, z: centre.z + a.z }, F);
    return { x: o.x + shift, y: o.y + drop };
  };
  // A hoodie's neckline scoops lower, so jewellery settles onto its front.
  drop = Math.max(0, chin + ry * 0.1 - at(0).y) + (collar === `hoodie` ? ry * 0.045 : 0);
  // Over a knit roll a strand lies on the roll, so it shows across the roll's width.
  const column = collar === `knit` ? halfNeck * Math.max(1, rollWidth(params)) : halfNeck;
  return { at, ry, radius, neck, halfNeck, column, chin, shift };
}

/** How much further than `from` the front may hang (up to `want`) above the name label. */
function reach(frame, from, want, least = 0) {
  const start = frame.at(0, from).y;
  const step = (frame.at(0, from - 0.1).y - start) / 0.1;
  const room = step > 1e-3 ? (CLEARANCE - start) / step : want;
  return Math.max(least, Math.min(want, room));
}

/**
 * A strand lying round the neck: `lift` is how high the ends ride up the
 * neck, `sag` how far the front hangs below the neckline (both in ry), `tuck`
 * pulls the ends in to the neck and `vee` > 0 turns the U into a weighted V.
 */
function drape(frame, { lift = 0.05, sag = 0.08, tuck = 0.34, wide = 1, span = 1.42, vee = 0, steps = 48 }) {
  const { ry, radius } = frame;
  const points = [];
  for (let k = 0; k <= steps; k++) {
    const t = -span + (2 * span * k) / steps;
    const round = Math.cos(t) ** 2;
    const hang = round * (1 - vee) + (1 - Math.abs(t) / span) * vee;
    points.push(frame.at(t, ry * (lift - (lift + sag) * hang), radius * ((wide - 1) * round - tuck * (1 - round))));
  }
  return points;
}

/** True where a bead would sit beside the neck above the neckline, i.e. behind it. */
function behindNeck(frame, p, size) {
  return Math.abs(p.x - frame.shift) > frame.column - size * 0.4 && p.y < frame.at(0, 0).y - size;
}

/** The part of a strand that shows: its ends are cut where they pass behind the neck. */
function worn(frame, path) {
  let from = 0;
  let to = path.length - 1;
  while (from < to && behindNeck(frame, path[from], 0)) from++;
  while (to > from && behindNeck(frame, path[to], 0)) to--;
  return path.slice(from, to + 1);
}

/** Points every `gap` along a path, each with its heading. */
function spaced(path, gap, offset = gap / 2) {
  const out = [];
  let need = offset;
  for (let k = 1; k < path.length; k++) {
    const a = path[k - 1];
    const b = path[k];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d < 1e-6) continue;
    let used = 0;
    while (need <= d - used) {
      used += need;
      const v = used / d;
      out.push({ x: a.x + (b.x - a.x) * v, y: a.y + (b.y - a.y) * v, dx: (b.x - a.x) / d, dy: (b.y - a.y) / d });
      need = gap;
    }
    need -= d - used;
  }
  return out;
}

/** Beads threaded symmetrically out from the front: [centre, then pairs by distance]. */
function threaded(path, gap) {
  const mid = Math.floor(path.length / 2);
  const right = spaced(path.slice(mid), gap, 0);
  const left = spaced(path.slice(0, mid + 1).reverse(), gap, 0);
  const out = [{ ...right[0], step: 0 }];
  for (let k = 1; k < Math.max(left.length, right.length); k++) {
    if (left[k]) out.push({ ...left[k], step: k });
    if (right[k]) out.push({ ...right[k], step: k });
  }
  return out;
}

function ring(centre, rx, ry = rx, steps = 12) {
  const points = [];
  for (let k = 0; k < steps; k++) {
    const a = (TURN * k) / steps;
    points.push({ x: centre.x + Math.cos(a) * rx, y: centre.y + Math.sin(a) * ry });
  }
  return points;
}

function teardrop(centre, radius) {
  return ring(centre, radius).map((p) => {
    const rise = centre.y - p.y;
    if (rise <= 0) return p;
    return { x: centre.x + (p.x - centre.x) * (1 - (rise / radius) * 0.7), y: centre.y - rise * 1.35 };
  });
}

function lightness(colour) {
  const [r, g, b] = (String(colour).match(/\d+/g) ?? [255, 255, 255]).map((v) => Number(v) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function inked(palette, trace, w, extra = {}) {
  return { trace, w, wobble: 0.003, colour: palette.ink, ...extra };
}

/** A metal line: ink edge with the metal laid down its middle. */
function wire(pen, path, trace, w, metal, palette) {
  pen.stroke(path, inked(palette, `${trace}-ink`, w, { singleLayer: !0, coverage: 0.9 }));
  pen.stroke(path, { trace, w: w * 0.5, wobble: 0.002, colour: metal.base, singleLayer: !0 });
}

function bead(pen, centre, radius, colour, palette, trace, shine = palette.blank) {
  pen.dot(centre, radius + 0.008, palette.ink, { trace: `${trace}-rim`, coverage: 0.92, noHem: !0 });
  pen.dot(centre, radius, colour, { trace, noHem: !0 });
  pen.dot({ x: centre.x - radius * 0.35, y: centre.y - radius * 0.38 }, radius * 0.3, shine, {
    trace: `${trace}-shine`,
    coverage: 0.85,
    noHem: !0,
  });
}

/** The original chain: open ink links over a thread of metal, sometimes with a coloured drop. */
function chain(pen, frame, look) {
  const { ry } = frame;
  const { palette, params, metal } = look;
  const path = drape(frame, { lift: 0.05, sag: 0.08 });
  const shows = worn(frame, path);
  pen.stroke(shows, { trace: `chain-metal`, w: 0.015, wobble: 0.002, colour: metal.base, coverage: 0.8, singleLayer: !0 });
  for (const [k, l] of spaced(shows, 0.034, 0.034).entries()) {
    const along = k % 2 === 0 ? 0.021 : 0.015;
    const across = k % 2 === 0 ? 0.012 : 0.003;
    const oval = [];
    for (let s = 0; s < 8; s++) {
      const a = (TURN * s) / 8;
      const u = Math.cos(a) * along;
      const v = Math.sin(a) * across;
      oval.push({ x: l.x + l.dx * u - l.dy * v, y: l.y + l.dy * u + l.dx * v });
    }
    pen.stroke(oval, inked(palette, `chain${k}`, 0.0075, { closed: !0, coverage: 0.9, singleLayer: !0 }));
  }
  if (params.crooked <= -0.02) return;
  const centre = path[24];
  const size = Math.min(ry * 0.045, reach(frame, ry * -0.08, ry * 0.09) * 0.5);
  const hang = { x: centre.x, y: centre.y + size * 1.25 };
  const shape = params.opening > 0.265 ? teardrop(hang, size) : ring(hang, size);
  pen.stroke(ring({ x: centre.x, y: centre.y + size * 0.1 }, size * 0.28, size * 0.28, 8), {
    ...inked(palette, `pendant-bail`, 0.008, { closed: !0 }),
  });
  pen.surface(shape, { colour: palette.fabric, trace: `pendant`, wobble: 0.002 });
  pen.stroke(shape, inked(palette, `pendant`, 0.013, { closed: !0 }));
  pen.dot({ x: hang.x - size * 0.3, y: hang.y - size * 0.25 }, size * 0.18, palette.blank, { trace: `pendant-shine`, coverage: 0.8 });
}

/** A short, even strand of pearls hugging the base of the neck. */
function pearls(pen, frame, look) {
  const { palette } = look;
  const sag = reach(frame, 0, frame.ry * 0.09, frame.ry * 0.04) / frame.ry;
  const path = drape(frame, { lift: 0.04, sag, tuck: 0.3, wide: 1.1 });
  const size = 0.022;
  for (const [k, p] of threaded(path, size * 2.3).entries())
    behindNeck(frame, p, size) || bead(pen, p, size, PEARL.base, palette, `pearl${k}`, PEARL.shine);
}

/** A velvet band snug round the neck itself, with a little metal heart. */
function choker(pen, frame, look) {
  const { palette, metal, rng, dark } = look;
  const { ry, chin, shift, halfNeck } = frame;
  const choices = dark ? VELVET.slice(1) : VELVET;
  const colour = choices[Math.floor(rng.n() * choices.length)];
  const middle = frame.at(0, 0).x;
  const top = chin + Math.max(ry * 0.03, (frame.at(0, 0).y - chin) * 0.3);
  const thick = 0.04;
  const edge = (y, bow) => {
    const points = [];
    for (let k = 0; k <= 10; k++) {
      const x = shift - halfNeck + (2 * halfNeck * k) / 10;
      const v = Math.max(0, 1 - ((x - middle) / (halfNeck * 1.25)) ** 2);
      points.push({ x, y: y + bow * v });
    }
    return points;
  };
  const upper = edge(top, 0.012);
  const lower = edge(top + thick, 0.014);
  pen.surface([...upper, ...lower.slice().reverse()], { colour, trace: `choker`, wobble: 0.002, dry: !0 });
  pen.stroke(upper, inked(palette, `choker-top`, 0.012));
  pen.stroke(lower, inked(palette, `choker-bottom`, 0.014));
  const hook = { x: middle, y: top + thick + 0.014 };
  const size = 0.026;
  const heart = [];
  for (let k = 0; k < 16; k++) {
    const a = (TURN * k) / 16;
    heart.push({
      x: hook.x + size * 1.05 * Math.sin(a) ** 3,
      y: hook.y + size * 0.4 - size * (0.8 * Math.cos(a) - 0.3 * Math.cos(2 * a) - 0.12 * Math.cos(3 * a)),
    });
  }
  pen.surface(heart, { colour: metal.base, trace: `choker-heart`, wobble: 0.001, dry: !0 });
  pen.stroke(heart, inked(palette, `choker-heart`, 0.009, { closed: !0 }));
}

/** Chunky wooden and painted beads on a long loop, the biggest at the front. */
function beads(pen, frame, look) {
  const { palette, rng } = look;
  const { ry } = frame;
  const colours = BEADS[Math.floor(rng.n() * BEADS.length)];
  const sag = reach(frame, 0, ry * 0.11, ry * 0.05) / ry;
  const path = drape(frame, { lift: 0.03, sag, tuck: 0.25, wide: 1.15 });
  for (const p of threaded(path, 0.062)) {
    const size = p.step === 0 ? 0.04 : 0.03;
    const colour = p.step === 0 ? colours[1] : colours[p.step % 2 === 0 ? 2 : 0];
    if (!behindNeck(frame, p, size)) bead(pen, p, size, colour, palette, `bead${p.step}${Math.sign(p.x - path[24].x)}`);
  }
}

/** Two or three fine chains at different lengths, the longest carrying a coin. */
function layered(pen, frame, look) {
  const { palette, metal, rng } = look;
  const { ry } = frame;
  const deepest = reach(frame, 0, ry * 0.2, ry * 0.1) / ry;
  const strands = rng.n() < 0.5 ? [0.03, deepest] : [0.02, (0.02 + deepest) / 2 + 0.01, deepest];
  let last = null;
  for (const [k, sag] of strands.entries()) {
    const path = drape(frame, { lift: 0.05, sag, tuck: 0.34 - k * 0.02, vee: k * 0.15 });
    wire(pen, worn(frame, path), `layer${k}`, 0.02, metal, palette);
    last = path;
  }
  const hang = last[Math.floor(last.length / 2)];
  const coin = { x: hang.x, y: hang.y + 0.028 };
  pen.dot(coin, 0.034, palette.ink, { trace: `coin-rim`, coverage: 0.92, noHem: !0 });
  pen.dot(coin, 0.026, metal.base, { trace: `coin`, noHem: !0 });
  pen.dot({ x: coin.x - 0.007, y: coin.y - 0.007 }, 0.007, metal.shine, { trace: `coin-shine`, noHem: !0 });
}

/**
 * A fat crescent moon: a disc with an offset bite taken from its upper right,
 * hung from its upper horn so it tilts the way a real one does.
 */
function moon(pen, at, size, look) {
  const { palette, metal } = look;
  const facing = -Math.PI / 5;
  const off = size * 0.5;
  const bite = size * 0.85;
  const meet = (off * off + size * size - bite * bite) / (2 * off);
  const outerHalf = Math.acos(meet / size);
  const innerHalf = Math.atan2(Math.sqrt(size * size - meet * meet), meet - off);
  const shape = [];
  for (let k = 0; k <= 16; k++) {
    const a = facing + outerHalf + ((TURN - 2 * outerHalf) * k) / 16;
    shape.push({ x: Math.cos(a) * size, y: Math.sin(a) * size });
  }
  for (let k = 1; k < 12; k++) {
    const a = facing - innerHalf - ((TURN - 2 * innerHalf) * k) / 12;
    shape.push({ x: Math.cos(facing) * off + Math.cos(a) * bite, y: Math.sin(facing) * off + Math.sin(a) * bite });
  }
  const horn = shape.reduce((top, p) => (p.y < top.y ? p : top));
  const hook = { x: at.x, y: at.y + size * 0.25 };
  const placed = shape.map((p) => ({ x: p.x - horn.x + hook.x, y: p.y - horn.y + hook.y }));
  pen.stroke(ring({ x: at.x, y: at.y + size * 0.12 }, size * 0.16, size * 0.16, 8), inked(palette, `moon-bail`, 0.008, { closed: !0 }));
  pen.surface(placed, { colour: metal.base, trace: `moon`, wobble: 0.001, dry: !0 });
  pen.stroke(placed, inked(palette, `moon`, 0.011, { closed: !0 }));
}

/** A curved fang, point down, bound to the cord with a metal cap. */
function tooth(pen, at, size, look) {
  const { palette, metal } = look;
  const left = [];
  const right = [];
  for (let k = 0; k <= 8; k++) {
    const v = k / 8;
    const half = size * 0.5 * (1 - v) ** 0.75;
    const lean = size * 0.35 * v * v;
    left.push({ x: at.x - half + lean, y: at.y + size * 0.2 + v * size * 1.5 });
    right.push({ x: at.x + half + lean, y: at.y + size * 0.2 + v * size * 1.5 });
  }
  const fang = [...left, ...right.reverse()];
  pen.surface(fang, { colour: TOOTH, trace: `tooth`, wobble: 0.001, dry: !0 });
  pen.stroke(fang, inked(palette, `tooth`, 0.01, { closed: !0 }));
  pen.stroke(
    left.slice(2, 7).map((p, k) => ({ x: p.x + size * (0.2 - k * 0.012), y: p.y })),
    inked(palette, `tooth-shade`, 0.006, { coverage: 0.5, singleLayer: !0 }),
  );
  const cap = [
    { x: at.x - size * 0.5, y: at.y },
    { x: at.x + size * 0.5, y: at.y },
    { x: at.x + size * 0.55, y: at.y + size * 0.32 },
    { x: at.x - size * 0.55, y: at.y + size * 0.32 },
  ];
  pen.surface(cap, { colour: metal.base, trace: `tooth-cap`, wobble: 0.001, dry: !0, square: !0 });
  pen.stroke(cap, inked(palette, `tooth-cap`, 0.008, { closed: !0, square: !0 }));
}

/** A leather cord pulled into a V by its charm: a moon or a shark's tooth. */
function cord(pen, frame, look) {
  const { palette, rng } = look;
  const { ry } = frame;
  const size = 0.055;
  const sag = Math.max(0.02, (reach(frame, 0, ry * 0.15, ry * 0.07) - size * 1.2) / ry);
  const path = drape(frame, { lift: 0.05, sag, tuck: 0.34, vee: 0.55 });
  wire(pen, worn(frame, path), `cord`, 0.024, { base: CORD }, palette);
  const at = path[Math.floor(path.length / 2)];
  if (rng.n() < 0.5) moon(pen, at, size, look);
  else tooth(pen, at, size * 1.2, look);
}

const NECKLACES = { chain, pearls, choker, beads, layered, cord };

function drawNecklace(pen, field, outline, id, character, palette, neckWidth, params) {
  const draw = NECKLACES[id];
  if (!draw || !outline?.length) return;
  const frame = neckFrame(field, outline, neckWidth, params, character.features.collar);
  draw(pen, frame, {
    palette,
    params,
    metal: metalFor(character, palette),
    rng: seeded(character.seed, `necklace-look`),
    dark: lightness(palette.skin) < DARK_SKIN,
  });
}

export { drawNecklace };
