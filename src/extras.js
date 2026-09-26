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
const CANDY = [tone(0.62, 0.2, 12), tone(0.68, 0.18, 340), tone(0.68, 0.15, 250)];
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
const angleOf = (v) => Math.atan2(v.y, v.x);
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

/** How steeply the stick leaves the mouth, below level, in radians (about 35°). */
const STICK_TILT = 0.6;

/** How far apart the lips are, in head units: 0 for a closed mouth. */
function gape(mouth) {
  if (mouth.state === `closed`) return 0;
  let ys = mouth.outline.map(([, y]) => y);
  return (Math.max(...ys) - Math.min(...ys)) * mouth.high * mouth.extend;
}

/** The head's own rim shading (as `head.js` paints it), for skin added past the outline. */
function headShade(pen, field, palette) {
  let { rx, ry } = field.head,
    x = -field.pose.yaw * rx * 0.9 - rx * 0.25,
    y = -ry * 0.35,
    shade = pen.ctx.createRadialGradient(x, y, rx * 0.2, x * 0.4, y * 0.2, Math.max(rx, ry) * 1.55);
  shade.addColorStop(0, `rgba(0,0,0,0)`);
  shade.addColorStop(0.62, `rgba(0,0,0,0)`);
  shade.addColorStop(1, palette.shadow);
  return shade;
}

function within(pen, area, draw) {
  let ctx = pen.ctx;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(area[0].x, area[0].y);
  for (let point of area) ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.clip();
  draw();
  ctx.restore();
}

/**
 * The cheek puffed out by the candy ball. Where the cheek is on the
 * silhouette the bump pushes the outline out: skin over the old contour and
 * a new contour round the bump. Inside the face it is a curved bulge line.
 */
function puffedCheek(pen, field, centre, radius, outward, palette, outline) {
  let bump = circle(centre, radius, 28),
    facing = angleOf(outward),
    rim = loop(centre, { x: 1, y: 0 }, { x: 0, y: 1 }, radius, radius, 18, facing - 1.5, facing + 1.5),
    shade = headShade(pen, field, palette),
    cover = { trace: `puff-cover`, w: 0.06, wobble: 0, closed: !0, singleLayer: !0, coverage: 1 };
  outsideHead(pen, outline, () => {
    pen.surface(bump, fill(palette.skin, `puff`));
    pen.surface(bump, fill(shade, `puff`));
  });
  within(pen, bump, () => {
    pen.stroke(outline, { ...cover, colour: palette.skin });
    pen.stroke(outline, { ...cover, colour: shade });
  });
  pen.stroke(rim, { trace: `puff-rim`, w: t * 1.15, wobble: 0.003, colour: palette.ink, pointed: 0.75 });
}

/** The white paper stick, with a rounded end. */
function paperStick(pen, from, to, palette) {
  let rod = { wobble: 0.0015, singleLayer: !0, pointed: 0 };
  pen.stroke([from, to], { ...rod, trace: `lolly-stick-ink`, w: t * 2.4, colour: palette.ink });
  pen.dot(to, t * 1.2, palette.ink, { trace: `lolly-stick-end-ink`, noHem: !0 });
  pen.stroke([from, to], { ...rod, trace: `lolly-stick`, w: t * 1.25, colour: palette.blank });
  pen.dot(to, t * 0.62, palette.blank, { trace: `lolly-stick-end`, noHem: !0 });
}

/**
 * A ball lollipop held in the mouth. The ball puffs out one cheek, and the
 * paper stick pokes out between the lips at that corner, angled down and
 * out, with a glimpse of the candy where the lips close round it. The ball
 * stays in the cheek whatever the mouth does: talking, a startle or a yawn
 * only move the corner the stick pokes from, and a wide-open jaw lets the
 * stick sag a little.
 */
function lollipop(pen, field, character, side, palette, scene) {
  let { mouth, mouthAt: frame, outline } = scene;
  if (!mouth || !frame || !outline || frame.nz < 0.25) return;
  if (MOUSTACHES.has(character.features.beard)) return;
  let origin = frame.to(0, 0),
    toward = (x, y) => {
      let point = frame.to(x, y);
      return unit({ x: point.x - origin.x, y: point.y - origin.y });
    },
    [cornerX, cornerY] = mouth.angle[side < 0 ? 0 : 1],
    corner = frame.to(cornerX * mouth.wide, -cornerY * mouth.high * mouth.extend),
    outward = toward(side, 0),
    tilt = STICK_TILT + Math.min(1, gape(mouth) / 0.25) * 0.35,
    along = toward(side * Math.cos(tilt), -Math.sin(tilt)),
    candy = pickFrom(character, `candy`, CANDY),
    puff = Math.max(0.12, character.head.rx * 0.19),
    across = outward.x >= 0 ? 1 : -1,
    cheekY = origin.y + 0.01,
    edge = reach(outline, cheekY, across) ?? corner.x + across * 0.3,
    lips = loop(corner, outward, toward(0, 1), 0.078, 0.06, 18);
  puffedCheek(pen, field, { x: edge - across * puff * 0.38, y: cheekY }, puff, { x: across, y: 0 }, palette, outline);
  pen.surface(lips, fill(candy, `lolly-peek`));
  pen.dot(add(corner, { x: -0.022, y: -0.02 }), 0.015, palette.blank, { trace: `lolly-peek-glint`, noHem: !0 });
  pen.stroke(lips, { ...outlined(palette.ink, `lolly-lips`, t * 1.05), coverage: 0.95 });
  paperStick(pen, add(corner, along, 0.01), add(corner, along, character.head.rx * 0.64), palette);
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
      lollipop(n, r, i, s, c, scene);
      return;
  }
}
export { n as t, metalFor };
