import { metalFor } from "./extras.js";

const PEN = 0.024;
const TAU = Math.PI * 2;
const MOUSTACHES = new Set([`moustache`, `handlebar`, `walrus`, `stubblemoustache`]);
const NOSTRILS = {
  hook: { x: 0.31, y: 0.34, leans: !0 },
  comma: { x: 0.3, y: 0.24, leans: !0 },
  line: { x: 0.17, y: 0.36, leans: !0 },
  long: { x: 0.31, y: 0.44, leans: !0 },
  wave: { x: 0.34, y: 0.15 },
  button: { x: 0.3, y: 0.2 },
  dots: { x: 0.32, y: 0.34 },
};

const add = (a, b, k = 1) => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const unit = (v) => {
  let length = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / length, y: v.y / length };
};

function arc(centre, radius, from, to, steps = 18) {
  let points = [];
  for (let i = 0; i <= steps; i++) {
    let a = from + ((to - from) * i) / steps;
    points.push({ x: centre.x + Math.cos(a) * radius, y: centre.y + Math.sin(a) * radius });
  }
  return points;
}

function ring(pen, centre, radius, facing, gap, metal, palette, trace) {
  let points = arc(centre, radius, facing + gap, facing + TAU - gap),
    band = { wobble: 0.001, pointed: 0.12, singleLayer: !0 };
  pen.stroke(points, { ...band, trace: `${trace}-ink`, w: PEN * 2.4, colour: palette.ink });
  pen.stroke(points, { ...band, trace, w: PEN * 1.0, colour: metal.base });
}

function nosering(pen, character, side, palette, scene, metal) {
  let frame = scene.noseAt,
    size = scene.nose,
    lean = scene.yaw * 0.5,
    at = (x, y) => frame.to((x + lean * (y + 0.6) * 0.5) * size, -y * size),
    nostril = NOSTRILS[character.features.nose] ?? NOSTRILS.hook,
    outward = nostril.leans ? (scene.yaw >= 0 ? 1 : -1) : side;
  if (frame.nz < 0.3 || MOUSTACHES.has(character.features.beard)) return;
  let wing = at(outward * nostril.x, nostril.y),
    across = unit({ x: at(outward, nostril.y).x - wing.x, y: at(outward, nostril.y).y - wing.y }),
    down = unit({ x: at(0, 1).x - at(0, 0).x, y: at(0, 1).y - at(0, 0).y }),
    radius = Math.max(0.055, size * 0.2),
    centre = add(add(wing, across, radius * 0.75), down, radius * 0.45),
    facing = Math.atan2(wing.y - centre.y, wing.x - centre.x);
  ring(pen, centre, radius, facing, 0.5, metal, palette, `nosering`);
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

function lipring(pen, character, side, palette, scene, metal) {
  let { mouth, mouthAt: frame } = scene;
  if (!mouth || !frame || frame.nz < 0.25 || MOUSTACHES.has(character.features.beard)) return;
  let place = ([x, y]) => frame.to(x * mouth.wide, -y * mouth.high * mouth.extend),
    [left, right] = mouth.angle.map(place),
    x = mouth.angle[side < 0 ? 0 : 1][0] / 3,
    lip = place([x, lowerLipAt(mouth, x)]),
    radius = Math.max(0.055, Math.hypot(right.x - left.x, right.y - left.y) * 0.1),
    down = unit({ x: frame.to(0, -1).x - frame.x, y: frame.to(0, -1).y - frame.y }),
    centre = add(lip, down, radius * 0.45),
    facing = Math.atan2(-down.y, -down.x);
  ring(pen, centre, radius, facing, 0.95, metal, palette, `lipring`);
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
