import { metalFor } from "./extras.js";

const PEN = 0.024;
const TAU = Math.PI * 2;
const MOUSTACHES = new Set([`moustache`, `handlebar`, `walrus`, `stubblemoustache`]);
/** Where the light sits (upper left, like the head's shading), as an angle. */
const LIGHT = -2.3;

/**
 * The outer wing of one nostril for each nose type, in the nose's own units
 * (x toward the side the ring hangs on, y down), and the way the hoop hangs
 * off it. Hook, comma, line and long noses are drawn on the side they point
 * to, so the ring goes on that side; the symmetric ones use the head's side.
 */
const NOSTRILS = {
  hook: { x: 0.3, y: 0.34, hang: { x: 0.9, y: 0.4 }, leans: !0 },
  comma: { x: 0.3, y: 0.22, hang: { x: 0.9, y: 0.4 }, leans: !0 },
  line: { x: 0.14, y: 0.34, hang: { x: 1, y: 0.25 }, leans: !0 },
  long: { x: 0.3, y: 0.44, hang: { x: 0.9, y: 0.4 }, leans: !0 },
  wave: { x: 0.34, y: 0.14, hang: { x: 0.9, y: 0.45 } },
  dots: { x: 0.36, y: 0.35, hang: { x: 0.9, y: 0.4 } },
};
/**
 * The button nose is a ball (centre and radius as `face.js` draws it, nudged
 * toward the way the nose points). Its ring is smaller than the ball and
 * hooks through its rim, low on the outer side, so the two never read as a
 * pair of matching circles.
 */
const BALL = { x: 0.06, y: 0.16, r: 0.26, low: 0.5 };

/**
 * However small the nose, the ring sits at least this far off its middle,
 * so it never reads as a septum ring.
 */
const WING_CLEAR = 0.065;

const add = (a, b, k = 1) => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const unit = (v) => {
  let length = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / length, y: v.y / length };
};
const angleOf = (v) => Math.atan2(v.y, v.x);

function arc(centre, radius, from, to, steps = 18) {
  let points = [];
  for (let i = 0; i <= steps; i++) {
    let a = from + ((to - from) * i) / steps;
    points.push({ x: centre.x + Math.cos(a) * radius, y: centre.y + Math.sin(a) * radius });
  }
  return points;
}

/** The point of a turn nearest to the light, kept out of the hidden gap. */
function glintAt(tucked, gap) {
  let away = (((LIGHT - tucked) % TAU) + TAU) % TAU;
  return tucked + Math.min(TAU - gap - 0.5, Math.max(gap + 0.5, away));
}

/**
 * A small metal hoop that disappears into the skin where `tucked` points:
 * an ink band, the metal on top of it, and one glint toward the light.
 */
function hoop(pen, centre, radius, tucked, gap, metal, palette, trace) {
  let band = arc(centre, radius, tucked + gap, tucked + TAU - gap),
    glint = glintAt(tucked, gap),
    rod = { wobble: 0.001, pointed: 0.35, singleLayer: !0 };
  pen.stroke(band, { ...rod, trace: `${trace}-ink`, w: PEN * 1.55, colour: palette.ink, coverage: 0.95 });
  pen.stroke(band, { ...rod, trace, w: PEN * 0.72, colour: metal.base, coverage: 1 });
  pen.stroke(arc(centre, radius, glint - 0.35, glint + 0.35, 4), {
    ...rod,
    trace: `${trace}-glint`,
    w: PEN * 0.36,
    colour: metal.shine,
    pointed: 0.9,
  });
}

/** Where a nose ring goes: the wing it pierces, which way it hangs, its size and how deep it sinks in. */
function nostrilRing(nose, at, size, outward, pointing) {
  if (nose === `button`) {
    let middle = at(pointing * BALL.x, BALL.y),
      wing = at(
        pointing * BALL.x + outward * BALL.r * Math.cos(BALL.low),
        BALL.y + BALL.r * Math.sin(BALL.low),
      );
    return {
      wing,
      hang: unit({ x: wing.x - middle.x, y: wing.y - middle.y }),
      radius: Math.max(0.038, BALL.r * size * 0.78),
      sink: 0.3,
      gap: 1.05,
    };
  }
  let nostril = NOSTRILS[nose] ?? NOSTRILS.hook,
    x = Math.max(nostril.x, WING_CLEAR / size),
    wing = at(outward * x, nostril.y),
    below = at(outward * (x + nostril.hang.x), nostril.y + nostril.hang.y);
  return {
    wing,
    hang: unit({ x: below.x - wing.x, y: below.y - wing.y }),
    radius: Math.min(0.064, Math.max(0.05, size * 0.3)),
    sink: 0.65,
    gap: 0.72,
  };
}

/** A hoop through the outer wing of one nostril, hugging its rim. */
function nosering(pen, character, side, palette, scene, metal) {
  let frame = scene.noseAt,
    size = scene.nose,
    nose = character.features.nose,
    lean = scene.yaw * 0.5,
    at = (x, y) => frame.to((x + lean * (y + 0.6) * 0.5) * size, -y * size),
    pointing = scene.yaw >= 0 ? 1 : -1,
    outward = NOSTRILS[nose]?.leans ? pointing : side;
  if (frame.nz < 0.3 || MOUSTACHES.has(character.features.beard)) return;
  let { wing, hang, radius, sink, gap } = nostrilRing(nose, at, size, outward, pointing),
    centre = add(wing, hang, radius * sink);
  hoop(pen, centre, radius, angleOf(hang) + Math.PI, gap, metal, palette, `nosering`);
}

function lowerLipAt(mouth, x) {
  let lip = mouth.bottom;
  for (let i = 0; i + 1 < lip.length; i++) {
    let [x0, y0] = lip[i],
      [x1, y1] = lip[i + 1];
    if ((x - x0) * (x - x1) <= 0 && x0 !== x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return lip[Math.floor(lip.length / 2)][1];
}

/** A hoop through the lower lip, a little off centre, hanging from its edge. */
function lipring(pen, character, side, palette, scene, metal) {
  let { mouth, mouthAt: frame } = scene;
  if (!mouth || !frame || frame.nz < 0.25 || MOUSTACHES.has(character.features.beard)) return;
  let place = ([x, y]) => frame.to(x * mouth.wide, -y * mouth.high * mouth.extend),
    x = mouth.angle[side < 0 ? 0 : 1][0] * 0.42,
    lip = place([x, lowerLipAt(mouth, x)]),
    down = unit({ x: frame.to(0, -1).x - frame.x, y: frame.to(0, -1).y - frame.y }),
    radius = Math.max(0.056, mouth.wide * 0.15),
    centre = add(lip, down, radius * 0.6);
  hoop(pen, centre, radius, angleOf(down) + Math.PI, 0.78, metal, palette, `lipring`);
}

function drawPiercing(pen, character, id, side, palette, scene) {
  let metal = metalFor(character, palette);
  switch (id) {
    case `nosering`:
      return nosering(pen, character, side, palette, scene, metal);
    case `lipring`:
      return lipring(pen, character, side, palette, scene, metal);
  }
}

export { drawPiercing };
