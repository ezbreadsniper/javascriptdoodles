import { j as seeded } from "./core.js";
import { n as e } from "./field.js";
import { a as drawEar } from "./head.js";
import { d as oklch, u as css } from "./palette.js";
var t = 0.024;
const TAU = Math.PI * 2;
const tone = (l, c, h) => css(oklch(l, c, h));
const GOLD = { base: tone(0.8, 0.11, 85), shine: tone(0.97, 0.03, 95) };
const SILVER = { base: tone(0.83, 0.012, 250), shine: tone(0.98, 0.005, 250) };
const DARK_SKIN = 0.3;
const BLOOMS = [
  { petal: tone(0.7, 0.16, 32), heart: tone(0.87, 0.15, 92) },
  { petal: tone(0.87, 0.16, 95), heart: tone(0.55, 0.13, 45) },
  { petal: tone(0.75, 0.15, 355), heart: tone(0.87, 0.15, 92) },
];
const LEAF = tone(0.64, 0.13, 140);
const CANDY = [tone(0.66, 0.19, 22), tone(0.68, 0.17, 335), tone(0.72, 0.15, 255)];
const EAR_SIZE = 0.13;
/** `head.js` stops drawing an ear once it has turned this far away. */
const EAR_GONE = -0.15;
const EAR_ITEMS = new Set([`earring`, `studs`, `hoops`, `flower`]);
const HATS = new Set([`hat`, `cap`, `beanie`, `backcap`, `flatcap`, `bucketcap`, `headphones`]);
const MOUSTACHES = new Set([`moustache`, `handlebar`, `walrus`, `stubblemoustache`]);

const add = (a, b, k = 1) => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const unit = (v) => {
  let length = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / length, y: v.y / length };
};
const turn = (v) => ({ x: -v.y, y: v.x });
const pickFrom = (character, name, list) =>
  list[Math.floor(seeded(character.seed, name).n() * list.length)];
const fill = (colour, trace, extra) => ({ colour, trace, wobble: 0.002, dry: !0, ...extra });
const outlined = (colour, trace, w) => ({ trace, w, wobble: 0.002, colour, closed: !0 });

function lightness(colour) {
  let [r, g, b] = (colour.match(/\d+/g) ?? [255, 255, 255]).map((v) => Number(v) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function metalFor(character, palette) {
  if (palette && lightness(palette.skin) < DARK_SKIN) return SILVER;
  return pickFrom(character, `jewellery`, [GOLD, SILVER]);
}

function loop(centre, across, up, rx, ry, steps = 20, from = 0, to = TAU) {
  let points = [];
  for (let i = 0; i <= steps; i++) {
    let a = from + ((to - from) * i) / steps;
    points.push(add(add(centre, across, Math.cos(a) * rx), up, Math.sin(a) * ry));
  }
  return points;
}

function circle(centre, radius, steps = 18) {
  return loop(centre, { x: 1, y: 0 }, { x: 0, y: 1 }, radius, radius, steps);
}

function inside(point, polygon) {
  let hit = !1;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let a = polygon[i],
      b = polygon[j];
    a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x &&
      (hit = !hit);
  }
  return hit;
}

function outsideHead(pen, outline, draw) {
  let ctx = pen.ctx;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-10, -10, 20, 20);
  ctx.moveTo(outline[0].x, outline[0].y);
  for (let point of outline) ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.clip(`evenodd`);
  draw();
  ctx.restore();
}

function studs(pen, ears, metal, palette) {
  for (let [index, ear] of ears.entries()) {
    if (ear.nz < -0.1) continue;
    let at = ear.to(0, -0.08, 0.06);
    pen.dot(at, 0.058, palette.ink, { trace: `stud-rim${index}`, coverage: 0.9, noHem: !0 });
    pen.dot(at, 0.044, metal.base, { trace: `stud${index}`, noHem: !0 });
    pen.dot(add(at, { x: -0.014, y: -0.015 }), 0.015, metal.shine, {
      trace: `stud-shine${index}`,
      noHem: !0,
    });
  }
}

/**
 * A hoop swinging from each lobe. On an ear turning away it hangs behind the
 * head's outline, so it slips out of sight with the ear instead of popping.
 */
function hoops(pen, ears, metal, palette, time, glasses, outline) {
  let hang = glasses ? -0.122 : -0.1;
  for (let [index, ear] of ears.entries()) {
    if (ear.nz < EAR_GONE) continue;
    let sway = Math.sin(time * 1.7 + index * 2.1) * 0.07,
      down = { x: Math.sin(sway), y: Math.cos(sway) },
      across = turn(down),
      radius = 0.11,
      centre = add(ear.to(0, hang, 0.055), down, radius * 0.9),
      ring = loop(centre, across, down, radius * 0.8, radius, 22),
      shine = loop(centre, across, down, radius * 0.8, radius, 6, 3.5, 4.3),
      draw = () => {
        pen.stroke(ring, {
          ...outlined(palette.ink, `hoop-ink${index}`, t * 1.45),
          coverage: 0.9,
          singleLayer: !0,
        });
        pen.stroke(ring, { ...outlined(metal.base, `hoop${index}`, t * 0.75), singleLayer: !0 });
        pen.stroke(shine, {
          trace: `hoop-shine${index}`,
          w: t * 0.3,
          wobble: 0.001,
          colour: metal.shine,
          coverage: 0.9,
          singleLayer: !0,
        });
      };
    ear.nz < 0 && outline ? outsideHead(pen, outline, draw) : draw();
  }
}

const PETAL = 0.084;
const PETAL_REACH = 0.105;
const BLOOM = PETAL + PETAL_REACH;

function bloom(pen, centre, up, out, colours, palette, spin) {
  let leafDir = unit(add(up, out, 1.1)),
    leafBase = add(centre, leafDir, 0.11),
    leaf = [
      leafBase,
      add(add(leafBase, leafDir, 0.08), turn(leafDir), 0.042),
      add(leafBase, leafDir, 0.18),
      add(add(leafBase, leafDir, 0.08), turn(leafDir), -0.042),
    ],
    vein = [add(leafBase, leafDir, 0.02), add(leafBase, leafDir, 0.13)],
    petals = [],
    heart = circle(centre, 0.05, 14),
    edge = (trace, w) => ({ ...outlined(palette.ink, trace, t * w), coverage: 0.9 });
  for (let i = 0; i < 5; i++) {
    let a = spin + (i / 5) * TAU;
    petals.push(circle(add(centre, { x: Math.cos(a), y: Math.sin(a) }, PETAL_REACH), PETAL, 16));
  }
  pen.surface(leaf, fill(LEAF, `flower-leaf`));
  pen.stroke(leaf, edge(`flower-leaf-edge`, 0.75));
  pen.stroke(vein, { trace: `flower-vein`, w: t * 0.4, wobble: 0.002, colour: palette.ink, coverage: 0.6 });
  petals.forEach((petal, i) => pen.surface(petal, fill(colours.petal, `petal${i}`)));
  petals.forEach((petal, i) => pen.stroke(petal, edge(`petal-edge${i}`, 0.85)));
  pen.surface(heart, fill(colours.heart, `flower-heart`));
  pen.stroke(heart, edge(`flower-heart-edge`, 0.7));
}

/** How far the head outline reaches toward `side` around height `y`. */
function reach(outline, y, side) {
  let far = null;
  for (let point of outline)
    Math.abs(point.y - y) < 0.05 && (far === null || side * point.x > side * far) && (far = point.x);
  return far;
}

/**
 * Where a flower tucked behind the ear shows: just above the ear, most of it
 * past the head's silhouette. With glasses it rides higher, clear of the
 * arm that rests on the ear.
 */
function flowerSpot(ear, outline, glasses) {
  let side = ear.x >= 0 ? 1 : -1,
    top = ear.to(0, EAR_SIZE * 0.8, 0),
    y = top.y - BLOOM * (glasses ? 0.95 : 0.45),
    edge = reach(outline, y, side) ?? top.x;
  return { x: edge + side * BLOOM * 0.4, y };
}

/** Draws only where `area` (a closed path) overlaps the outside of the head. */
function outsideHeadWithin(pen, outline, area, draw) {
  let ctx = pen.ctx;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(area[0].x, area[0].y);
  for (let point of area) ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.clip();
  outsideHead(pen, outline, draw);
  ctx.restore();
}

/**
 * A five-petal flower tucked behind one ear. It always sits behind the head's
 * silhouette, so it peeks out the same way whichever way the head turns, and
 * the ear is drawn back over it where they overlap.
 */
function flower(pen, ears, side, character, palette, outline) {
  if (!outline) return;
  let ear = ears[side < 0 ? 0 : 1],
    centre = flowerSpot(ear, outline, character.features.eyewear !== `none`),
    colours = pickFrom(character, `flower`, BLOOMS),
    spin = seeded(character.seed, `flower-spin`).n() * TAU,
    up = unit(ear.ey),
    out = { x: side, y: 0 };
  outsideHead(pen, outline, () => bloom(pen, centre, up, out, colours, palette, spin));
  outsideHeadWithin(pen, outline, circle(centre, BLOOM * 1.4, 24), () =>
    drawEar(pen, ear, EAR_SIZE, palette, side, outline),
  );
}

/** How far the jaw has dropped, in head units: 0 for a closed mouth. */
function gape(mouth) {
  if (mouth.state === `closed`) return 0;
  let ys = mouth.outline.map(([, y]) => y);
  return (Math.max(...ys) - Math.min(...ys)) * mouth.high * mouth.extend;
}

/** How far a ray from `from` runs before it leaves the head outline. */
function exitDistance(from, dir, outline, limit) {
  for (let d = 0; d <= limit; d += 0.01) if (!inside(add(from, dir, d), outline)) return d;
  return limit;
}

/** A thick candy stripe winding out from the middle of the disc. */
function swirl(centre, radius, turns, spin, start) {
  let points = [];
  for (let i = 0; i <= 40; i++) {
    let s = i / 40,
      a = start + spin * s * TAU * turns,
      r = radius * (0.08 + s * 0.8);
    points.push({ x: centre.x + Math.cos(a) * r, y: centre.y + Math.sin(a) * r });
  }
  return points;
}

/** How steeply the stick leaves the mouth, below level, in radians. */
const STICK_TILT = 0.62;

/**
 * A swirl lollipop with its stick clamped in one corner of the mouth and the
 * candy out past the jaw. The candy hangs from where the corner rests, so
 * talking only pivots the stick in the lips; a wide-open mouth (startled,
 * yawning, a loud word) lets the stick sag.
 */
function lollipop(pen, character, side, palette, scene) {
  let { mouth, mouthAt: frame, outline } = scene;
  if (!mouth || !frame || !outline || frame.nz < 0.25) return;
  if (MOUSTACHES.has(character.features.beard)) return;
  let [cornerX, cornerY] = mouth.angle[side < 0 ? 0 : 1],
    corner = frame.to(cornerX * mouth.wide, -cornerY * mouth.high * mouth.extend),
    rest = frame.to(side * mouth.wide * 0.5, 0),
    origin = frame.to(0, 0),
    radius = Math.min(0.17, Math.max(0.14, character.head.rx * 0.21)),
    sag = Math.min(1, Math.max(0, (gape(mouth) - 0.12) / 0.14)) * 0.5,
    aim = frame.to(side * Math.cos(STICK_TILT + sag), -Math.sin(STICK_TILT + sag)),
    out = unit({ x: aim.x - origin.x, y: aim.y - origin.y }),
    centre = add(rest, out, exitDistance(rest, out, outline, 0.9) + radius * 0.55),
    dir = unit({ x: centre.x - corner.x, y: centre.y - corner.y }),
    stick = [add(corner, dir, -0.012), add(centre, dir, -radius * 0.4)],
    disc = circle(centre, radius, 26),
    candy = pickFrom(character, `candy`, CANDY),
    start = seeded(character.seed, `lolly-spin`).n() * TAU,
    rod = { wobble: 0.002, singleLayer: !0 };
  pen.stroke(stick, { ...rod, trace: `lolly-stick-ink`, w: t * 1.9, colour: palette.ink, pointed: 0.2 });
  pen.stroke(stick, { ...rod, trace: `lolly-stick`, w: t * 0.95, colour: palette.blank, pointed: 0.1 });
  pen.surface(disc, fill(candy, `lolly`, { wobble: 0.003 }));
  pen.stroke(swirl(centre, radius, 1.7, -side, start), {
    ...rod,
    trace: `lolly-swirl`,
    w: radius * 0.2,
    colour: palette.blank,
    pointed: 0.5,
    coverage: 0.95,
  });
  pen.stroke(disc, { ...outlined(palette.ink, `lolly-edge`, t * 1.05), coverage: 0.95 });
  pen.stroke(loop(centre, { x: 1, y: 0 }, { x: 0, y: 1 }, radius * 0.72, radius * 0.72, 5, 3.7, 4.5), {
    ...rod,
    trace: `lolly-glint`,
    w: t * 0.45,
    colour: palette.blank,
    pointed: 0.9,
  });
}

function n(n, r, i, a, o, s, c, scene = {}) {
  if (scene.headphones && EAR_ITEMS.has(a)) return;
  switch (a) {
    case `none`:
      return;
    case `earring`:
      for (let [e, r] of o.entries()) {
        if (r.nz < -0.1) continue;
        let i = r.to(0, -0.11, 0.02),
          a = 0.04,
          o = [];
        for (let e = 0; e < 14; e++) {
          let t = (e / 14) * 6.2832;
          o.push({
            x: i.x + Math.cos(t) * a,
            y: i.y + a * 1.1 + Math.sin(t) * a,
          });
        }
        (n.stroke(o, {
          trace: `earring${e}`,
          w: t * 0.7,
          wobble: 0.003,
          colour: c.accent,
          closed: !0,
          coverage: 0.95,
        }),
          n.dot(i, 0.012, c.ink, { coverage: 0.7, trace: `extrasFoot${e}` }));
      }
      return;
    case `plaster`: {
      let a = i.layout,
        o = e(
          s * Math.min(0.88, a.eyeU + 0.3),
          a.eyeV * 0.2 + a.mouthV * 0.8,
          r,
        );
      if (o.nz < 0.15) return;
      let l = 0.14,
        u = (e, r) => {
          let i = Math.cos(e),
            a = Math.sin(e),
            s = [
              [-0.14, -0.14 * 0.28],
              [l, -0.14 * 0.28],
              [l, l * 0.28],
              [-0.14, l * 0.28],
            ].map(([e, t]) => o.to(e * i - t * a, -(e * a + t * i)));
          (n.surface(s, {
            colour: c.plaster,
            trace: `plaster${r}`,
            wobble: 0.003,
            square: !0,
            dry: !0,
          }),
            n.stroke(s, {
              trace: `plaster-edge${r}`,
              w: t * 0.6,
              wobble: 0.003,
              colour: c.ink,
              closed: !0,
              coverage: 0.6,
              square: !0,
            }));
        };
      (u(0.7, 0), u(-0.75, 1));
      return;
    }
    case `studs`:
      studs(n, o, metalFor(i, c), c);
      return;
    case `hoops`:
      hoops(n, o, metalFor(i, c), c, scene.time ?? 0, i.features.eyewear !== `none`, scene.outline);
      return;
    case `flower`:
      HATS.has(i.features.headwear) || flower(n, o, -s, i, c, scene.outline);
      return;
    case `lollipop`:
      lollipop(n, i, s, c, scene);
      return;
  }
}
export { n as t, metalFor };
