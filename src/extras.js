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
    pen.dot(at, 0.05, palette.ink, { trace: `stud-rim${index}`, coverage: 0.9, noHem: !0 });
    pen.dot(at, 0.038, metal.base, { trace: `stud${index}`, noHem: !0 });
    pen.dot(add(at, { x: -0.012, y: -0.013 }), 0.013, metal.shine, {
      trace: `stud-shine${index}`,
      noHem: !0,
    });
  }
}

function hoops(pen, ears, metal, palette, time, glasses) {
  let hang = glasses ? -0.122 : -0.1;
  for (let [index, ear] of ears.entries()) {
    if (ear.nz < -0.1) continue;
    let sway = Math.sin(time * 1.7 + index * 2.1) * 0.07,
      down = { x: Math.sin(sway), y: Math.cos(sway) },
      across = turn(down),
      radius = 0.11,
      centre = add(ear.to(0, hang, 0.055), down, radius * 0.9),
      ring = loop(centre, across, down, radius * 0.8, radius, 22),
      shine = loop(centre, across, down, radius * 0.8, radius, 6, 3.5, 4.3);
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
  }
}

function flowerEar(ears, side) {
  let preferred = side < 0 ? 0 : 1,
    other = 1 - preferred;
  return ears[preferred].nz < -0.1 ? [other, ears[other]] : [preferred, ears[preferred]];
}

function bloom(pen, centre, up, out, colours, palette, spin) {
  let leafDir = unit(add(up, out, -0.55)),
    leafBase = add(centre, leafDir, 0.1),
    leaf = [
      leafBase,
      add(add(leafBase, leafDir, 0.07), turn(leafDir), 0.035),
      add(leafBase, leafDir, 0.15),
      add(add(leafBase, leafDir, 0.07), turn(leafDir), -0.035),
    ],
    petals = [],
    heart = circle(centre, 0.044, 14),
    edge = (trace, w) => ({ ...outlined(palette.ink, trace, t * w), coverage: 0.9 });
  for (let i = 0; i < 5; i++) {
    let a = spin + (i / 5) * TAU;
    petals.push(circle(add(centre, { x: Math.cos(a), y: Math.sin(a) }, 0.082), 0.064, 16));
  }
  pen.surface(leaf, fill(LEAF, `flower-leaf`));
  pen.stroke(leaf, edge(`flower-leaf-edge`, 0.6));
  petals.forEach((petal, i) => pen.surface(petal, fill(colours.petal, `petal${i}`)));
  petals.forEach((petal, i) => pen.stroke(petal, edge(`petal-edge${i}`, 0.7)));
  pen.surface(heart, fill(colours.heart, `flower-heart`));
  pen.stroke(heart, edge(`flower-heart-edge`, 0.6));
}

function flowerSpot(ear, eye, glasses) {
  let clearance = glasses ? 0.44 : 0.3,
    spot = ear.to(0, 0.11, 0.1);
  for (let step = 0; step <= 12; step++) {
    spot = ear.to(0, (glasses ? 0.22 : 0.11) + step * 0.018, 0.1 + step * 0.01);
    if (Math.hypot(spot.x - eye.x, spot.y - eye.y) > clearance) break;
  }
  return spot;
}

function flower(pen, field, ears, side, character, palette, outline) {
  if (!outline) return;
  let [index, ear] = flowerEar(ears, side),
    layout = character.layout,
    eye = e((index === 0 ? -1 : 1) * layout.eyeU, layout.eyeV, field),
    centre = flowerSpot(ear, eye, character.features.eyewear !== `none`),
    colours = pickFrom(character, `flower`, BLOOMS),
    spin = seeded(character.seed, `flower-spin`).n() * TAU,
    draw = () => {
      bloom(pen, centre, unit(ear.ey), unit(ear.nrm), colours, palette, spin);
      drawEar(pen, ear, EAR_SIZE, palette, index === 0 ? -1 : 1, outline);
    };
  ear.nz < 0 ? outsideHead(pen, outline, draw) : draw();
}

function nearCorner(field, character, side) {
  let v = character.layout.mouthV,
    left = e(-0.3, v, field).nz,
    right = e(0.3, v, field).nz;
  return Math.abs(left - right) < 0.02 ? side : left > right ? -1 : 1;
}

function swirlIn(centre, radius, turns, spin) {
  let points = [];
  for (let i = 0; i <= 26; i++) {
    let s = i / 26,
      a = spin * s * TAU * turns,
      r = radius * (0.1 + s * 0.72);
    points.push({ x: centre.x + Math.cos(a) * r, y: centre.y + Math.sin(a) * r });
  }
  return points;
}

function lollipop(pen, field, character, side, palette, scene) {
  let { mouth, mouthAt: frame, outline } = scene;
  if (!mouth || !frame || !outline || mouth.state === `babbles` || frame.nz < 0.25) return;
  if (MOUSTACHES.has(character.features.beard)) return;
  let corner = nearCorner(field, character, side),
    [cornerX, cornerY] = mouth.angle[corner < 0 ? 0 : 1],
    x = cornerX * mouth.wide,
    y = -cornerY * mouth.high * mouth.extend,
    width = character.head.rx * 2,
    centre = frame.to(x, y),
    toward = frame.to(x + corner * 0.8, y - 0.56),
    dir = unit({ x: toward.x - centre.x, y: toward.y - centre.y }),
    length = width * 0.15;
  while (length > width * 0.06 && !inside(add(centre, dir, length + 0.02), outline))
    length *= 0.85;
  let stick = [centre, add(centre, dir, length)],
    disc = circle(centre, width * 0.07, 24),
    rod = { wobble: 0.002, singleLayer: !0 };
  pen.stroke(stick, { ...rod, trace: `lolly-stick-ink`, w: t * 2.2, colour: palette.ink, pointed: 0.1 });
  pen.stroke(stick, { ...rod, trace: `lolly-stick`, w: t * 1.05, colour: palette.blank, pointed: 0.05 });
  pen.surface(disc, fill(pickFrom(character, `candy`, CANDY), `lolly`, { wobble: 0.003 }));
  pen.stroke(swirlIn(centre, width * 0.07, 1.8, corner), {
    ...rod,
    trace: `lolly-swirl`,
    w: t * 0.7,
    colour: palette.blank,
    coverage: 0.9,
  });
  pen.stroke(disc, { ...outlined(palette.ink, `lolly-edge`, t * 0.85), coverage: 0.95 });
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
      hoops(n, o, metalFor(i, c), c, scene.time ?? 0, i.features.eyewear !== `none`);
      return;
    case `flower`:
      HATS.has(i.features.headwear) || flower(n, r, o, -s, i, c, scene.outline);
      return;
    case `lollipop`:
      lollipop(n, r, i, s, c, scene);
      return;
  }
}
export { n as t, metalFor };
