import { d as oklch, u as rgbOf } from "./palette.js";

const FRONT = 1.86;
const LABEL_Y = 1.68;
const CLEARANCE = LABEL_Y - 0.17;
const TURN = Math.PI * 2;

const SHIRT_COLLARS = new Set([`shirt`, `bowtie`, `tie`]);

function onBody(kit, u, r, lift = 0) {
  return kit.at(u / (kit.radius + lift), r, lift);
}

function reach(kit, from, want, least = 0) {
  const start = kit.at(0, from).y;
  const step = (kit.at(0, from - 0.1).y - start) / 0.1;
  const room = step > 1e-3 ? (CLEARANCE - start) / step : want;
  return Math.max(least, Math.min(want, room));
}

function measure(kit) {
  const base = kit.at(0, 0);
  return {
    base,
    neck: Math.max(kit.neck * 2, 0.24),
    tall: Math.min(0.32, Math.max(0.2, base.y - kit.chin)),
    room: Math.max(0.06, CLEARANCE - base.y),
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

function vivid(css, lightness, turn = 0) {
  const { c, h } = toOklch(css);
  const murky = c < 0.05 || (h > 55 && h < 115);
  const hue = murky ? (h > 85 ? 262 : 22) : h;
  return rgbOf(oklch(lightness, murky ? 0.13 : Math.min(0.16, Math.max(c, 0.11)), hue + turn));
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

function ribbon(path, half) {
  const left = [];
  const right = [];
  for (let k = 0; k < path.length; k++) {
    const a = path[Math.max(0, k - 1)];
    const b = path[Math.min(path.length - 1, k + 1)];
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / d;
    const ny = (b.x - a.x) / d;
    left.push({ x: path[k].x + nx * half, y: path[k].y + ny * half });
    right.push({ x: path[k].x - nx * half, y: path[k].y - ny * half });
  }
  return { left, right, outline: [...left, ...right.slice().reverse()] };
}

function between(a, b, v) {
  return { x: a.x + (b.x - a.x) * v, y: a.y + (b.y - a.y) * v };
}

function tailor(id, palette, params) {
  if (id !== `tie` && id !== `bowtie`) return { palette, params };
  return {
    palette: {
      ...palette,
      garment: palette.cloth,
      cloth: tint(palette.cloth, 0.965, 0.012),
      clothDeep: tint(palette.cloth, 0.88, 0.02),
      clothDark: !1,
    },
    params: id === `bowtie` ? { ...params, point: params.point * 0.72, height: params.height * 0.7 } : params,
  };
}

function hoodie(kit) {
  const { palette } = kit;
  const { base, neck, tall, room } = measure(kit);
  const crown = base.y - tall * 0.62;
  const foot = base.y + Math.min(tall * 0.45, room * 0.35);
  const spread = neck * 1.3;
  const hood = [];
  for (let k = 0; k <= 24; k++) {
    const a = Math.PI + (Math.PI * k) / 24;
    const lift = Math.sin(a);
    hood.push({ x: base.x + Math.cos(a) * spread * (0.78 + 0.22 * lift * lift), y: foot + (foot - crown) * lift });
  }
  for (let k = 1; k < 8; k++) {
    const s = 1 - (2 * k) / 8;
    hood.push({ x: base.x + spread * s, y: foot + tall * 0.06 * (1 - s * s) });
  }
  const inner = neck * 0.72;
  const lip = base.y - tall * 0.04;
  const sag = tall * 0.16;
  const arch = [];
  const neckline = [];
  for (let k = 0; k <= 16; k++) {
    const s = -1 + k / 8;
    arch.push({ x: base.x + inner * s, y: lip - tall * 0.3 * Math.sqrt(1 - s * s) });
    neckline.push({ x: base.x + inner * s, y: lip + sag * (1 - s * s) });
  }
  const strings = (pen) => {
    for (const side of [-1, 1]) {
      const s = 0.25 * (neck / inner) * side;
      const start = { x: base.x + inner * s, y: lip + sag * (1 - s * s) + 0.012 };
      const length = Math.max(0.05, Math.min(Math.max(tall * 0.7, 0.2), CLEARANCE - 0.03 - start.y));
      const end = { x: start.x + side * neck * 0.06, y: start.y + length };
      const path = bezier(
        start,
        { x: start.x - side * neck * 0.06, y: start.y + length * 0.35 },
        { x: end.x, y: start.y + length * 0.6 },
        end,
        10,
      );
      pen.stroke(path, inked(kit, `hood-string${side}`, 0.032));
      pen.stroke(path.slice(1, -1), {
        trace: `hood-cord${side}`,
        w: 0.012,
        wobble: 0.002,
        colour: palette.blank,
        singleLayer: !0,
      });
      pen.surface(roundBox({ x: end.x, y: end.y + 0.018 }, 0.02, 0.03, 3, 14), {
        colour: palette.ink,
        trace: `hood-tip${side}`,
      });
      pen.stroke(ring(start, 0.015, 8), { ...inked(kit, `hood-eyelet${side}`, 0.011), ...kit.edge, closed: !0 });
    }
  };
  return {
    hem: neckline,
    back: (pen) => {
      kit.fill(pen, hood, palette.cloth, `hood`);
      pen.stroke(hood, inked(kit, `hood`, 0.026, { closed: !0 }));
      kit.fill(pen, [...arch, ...neckline.slice().reverse()], palette.clothDeep, `hood-opening`);
      pen.stroke(arch, inked(kit, `hood-opening`, 0.016, kit.edge));
    },
    front: (pen) => {
      pen.stroke(neckline, inked(kit, `hood-neckline`, 0.024));
      strings(pen);
    },
  };
}

function lumpyWrap(centre, straight, thick, seed) {
  const points = [];
  for (let k = 0; k <= 10; k++)
    points.push({
      x: centre.x - straight + (2 * straight * k) / 10,
      y: centre.y - thick * (1 + 0.16 * Math.sin(k * 1.7 + seed)),
    });
  for (let k = 0; k <= 8; k++) {
    const a = -Math.PI / 2 + (Math.PI * k) / 8;
    points.push({ x: centre.x + straight + thick * Math.cos(a), y: centre.y + thick * Math.sin(a) });
  }
  for (let k = 10; k >= 0; k--)
    points.push({
      x: centre.x - straight + (2 * straight * k) / 10,
      y: centre.y + thick * (1 + 0.14 * Math.sin(k * 2.3 + seed * 1.3)),
    });
  for (let k = 0; k <= 8; k++) {
    const a = Math.PI / 2 + (Math.PI * k) / 8;
    points.push({ x: centre.x - straight + thick * Math.cos(a), y: centre.y + thick * Math.sin(a) });
  }
  return points;
}

function scarfTail(pen, kit, look, name) {
  const { knot, end, neck, side, main, stripe } = look;
  const tl = { x: knot.x - neck * 0.17, y: knot.y };
  const tr = { x: knot.x + neck * 0.17, y: knot.y };
  const bl = { x: end.x - neck * 0.21, y: end.y };
  const br = { x: end.x + neck * 0.21, y: end.y };
  kit.fill(pen, [tl, bl, br, tr], main, name);
  for (const [k, v] of [0.52, 0.72].entries())
    kit.fill(
      pen,
      [between(tl, bl, v), between(tl, bl, v + 0.1), between(tr, br, v + 0.1), between(tr, br, v)],
      stripe,
      `${name}-stripe${k}`,
    );
  pen.stroke([tl, bl, br, tr], inked(kit, `${name}-edge`, 0.019));
  for (let k = 0; k < 5; k++) {
    const root = between(bl, br, 0.1 + k * 0.2);
    pen.stroke([root, { x: root.x + side * 0.004, y: root.y + 0.034 }], inked(kit, `${name}-fringe${k}`, 0.012));
  }
}

function scarf(kit) {
  const { palette, params } = kit;
  const { base, neck, tall } = measure(kit);
  const main = vivid(palette.fabric, 0.56);
  const stripe = tint(palette.fabric, 0.93, 0.03);
  const span = neck * 0.78;
  const thick = Math.max(0.05, tall * 0.3);
  const centre = { x: base.x, y: base.y - tall * 0.05 };
  const side = params.fit >= 0 ? 1 : -1;
  const wrap = lumpyWrap(centre, span - thick, thick, params.fit * 9);
  const knot = { x: base.x + side * neck * 0.32, y: centre.y + thick * 0.45 };
  const length = Math.max(0.05, Math.min(Math.max(tall * 1.25, 0.16), CLEARANCE - 0.04 - knot.y));
  const tail = (pen, name, drift, share) =>
    scarfTail(pen, kit, { knot, neck, side, main, stripe, end: { x: knot.x + side * neck * drift, y: knot.y + length * share } }, name);
  const lump = roundBox(knot, neck * 0.21, thick * 0.78, 2.4, 20);
  return {
    hem: kit.arc(-FRONT, FRONT, tall * 0.3),
    back: () => {},
    front: (pen) => {
      kit.fill(pen, wrap, main, `scarf`);
      pen.stroke(wrap, inked(kit, `scarf`, 0.022, { closed: !0 }));
      for (const [k, x] of [-0.3, 0.12].entries()) {
        const at = base.x + x * span * 2 - side * neck * 0.1;
        pen.stroke(
          bezier(
            { x: at, y: centre.y - thick * 0.85 },
            { x: at + neck * 0.08, y: centre.y - thick * 0.3 },
            { x: at + neck * 0.08, y: centre.y + thick * 0.3 },
            { x: at, y: centre.y + thick * 0.85 },
            6,
          ),
          inked(kit, `scarf-fold${k}`, 0.013, { coverage: 0.6, singleLayer: !0 }),
        );
      }
      tail(pen, `scarf-tail-back`, 0.5, 0.82);
      tail(pen, `scarf-tail`, 0.08, 1);
      kit.fill(pen, lump, main, `scarf-knot`);
      pen.stroke(lump, inked(kit, `scarf-knot`, 0.02, { closed: !0 }));
    },
  };
}

function badge(pen, kit, { centre, wide, tall, colour }) {
  const top = centre.y - tall / 2;
  const left = centre.x - wide / 2;
  const card = roundBox(centre, wide / 2, tall / 2, 5, 32);
  const headerY = top + tall / 3;
  const header = [
    ...card.filter((p) => p.y < headerY),
    { x: centre.x + wide / 2, y: headerY },
    { x: left, y: headerY },
  ];
  pen.surface(card, { colour: kit.palette.blank, trace: `badge`, wobble: 0.002 });
  kit.fill(pen, header, colour, `badge-header`);
  pen.stroke(card, inked(kit, `badge`, 0.018, { closed: !0 }));
  const face = wide * 0.28;
  const faceTop = top + tall * 0.46;
  const faceLeft = left + wide * 0.14;
  pen.stroke(
    [
      { x: faceLeft, y: faceTop },
      { x: faceLeft + face, y: faceTop },
      { x: faceLeft + face, y: faceTop + face },
      { x: faceLeft, y: faceTop + face },
    ],
    inked(kit, `badge-face`, 0.012, { closed: !0, square: !0 }),
  );
  for (const [k, stop] of [0.86, 0.72].entries()) {
    const y = faceTop + face * (0.25 + k * 0.5);
    pen.stroke(
      [
        { x: left + wide * 0.54, y },
        { x: left + wide * stop, y },
      ],
      inked(kit, `badge-dash${k}`, 0.012, { square: !0 }),
    );
  }
}

function lanyard(kit) {
  const { palette } = kit;
  const { base, neck, tall, room } = measure(kit);
  const hem = kit.arc(-FRONT, FRONT);
  const strap = vivid(palette.fabric, 0.5);
  const cardTall = Math.min(neck * 1.08, room * 0.45);
  const cardWide = cardTall / 1.2;
  const dip = Math.max(0.035, Math.min(tall, room - cardTall - 0.03));
  const clip = { x: base.x, y: base.y + dip };
  const half = Math.max(0.012, neck * 0.1);
  const root = Math.max(kit.neck * 0.85, half * 1.2);
  const strapPath = (side) =>
    bezier(
      { x: base.x + side * root, y: base.y - tall * 0.2 },
      { x: base.x + side * root * 1.05, y: base.y + dip * 0.25 },
      { x: base.x + side * half * 1.3, y: clip.y - dip * 0.35 },
      { x: clip.x + side * half * 0.8, y: clip.y },
      14,
    );
  return {
    hem,
    back: () => {},
    front: (pen) => {
      pen.stroke(hem, inked(kit, `collar`, 0.022, { wobble: 0.004 }));
      for (const side of [-1, 1]) {
        const band = ribbon(strapPath(side), half);
        kit.fill(pen, band.outline, strap, `lanyard${side}`);
        pen.stroke(band.left, inked(kit, `lanyard-l${side}`, 0.013));
        pen.stroke(band.right, inked(kit, `lanyard-r${side}`, 0.013));
      }
      pen.surface(roundBox(clip, half * 1.4, 0.02, 3, 14), { colour: palette.ink, trace: `lanyard-clip` });
      badge(pen, kit, {
        centre: { x: clip.x, y: clip.y + 0.014 + cardTall / 2 },
        wide: cardWide,
        tall: cardTall,
        colour: strap,
      });
    },
  };
}

function tie(kit, { depth }) {
  const { palette, params } = kit;
  const { neck, tall } = measure(kit);
  const colour = vivid(palette.garment, 0.42);
  const light = vivid(palette.garment, 0.68);
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

function bowtie(kit, { depth }) {
  const { palette } = kit;
  const { neck } = measure(kit);
  const centre = onBody(kit, 0, -depth * 0.3, 0.01);
  const wide = neck * 0.86;
  const high = wide * 0.5;
  const colour = vivid(palette.garment, 0.44);
  const deep = vivid(palette.garment, 0.32);
  const at = (u, v) => ({ x: centre.x + u * wide, y: centre.y + v * high });
  const wing = (side) => {
    const points = [at(side * 0.2, -0.3), at(side * 0.55, -0.92)];
    for (let k = 0; k <= 8; k++) {
      const a = -Math.PI / 2 + (Math.PI * k) / 8;
      points.push(at(side * (0.8 + 0.2 * Math.cos(a)), 0.92 * Math.sin(a)));
    }
    points.push(at(side * 0.55, 0.92), at(side * 0.2, 0.3));
    return points;
  };
  const knot = roundBox(centre, wide * 0.25, high * 0.44, 4, 20);
  return (pen) => {
    for (const side of [-1, 1]) {
      const shape = wing(side);
      pen.surface(shape, { colour, trace: `bow${side}`, wobble: 0.002 });
      pen.stroke(shape, inked(kit, `bow${side}`, 0.02, { closed: !0 }));
      pen.stroke(
        [at(side * 0.32, 0.08), at(side * 0.62, 0.38)],
        inked(kit, `bow-crease${side}`, 0.012, { coverage: 0.6, singleLayer: !0 }),
      );
    }
    pen.surface(knot, { colour: deep, trace: `bow-knot`, wobble: 0.002 });
    pen.stroke(knot, inked(kit, `bow-knot`, 0.018, { closed: !0 }));
  };
}

function shirtTrim(id, kit, opening) {
  if (id !== `tie` && id !== `bowtie`) return null;
  const { spread, depth } = opening;
  const placket = [
    kit.at(-spread * 0.95, 0),
    kit.at(spread * 0.95, 0),
    kit.at(spread * 0.8, -depth),
    kit.at(0, -depth * 1.15),
    kit.at(-spread * 0.8, -depth),
  ];
  const under = (pen) => kit.fill(pen, placket, kit.palette.cloth, `placket`);
  if (id === `tie`) {
    const knotted = tie(kit, opening);
    return { under: (pen) => (under(pen), knotted.blade(pen)), over: knotted.knot };
  }
  return { under, over: bowtie(kit, opening) };
}

const WORN = { hoodie, scarf, lanyard };

function wornCollar(id, kit) {
  return WORN[id]?.(kit) ?? null;
}

export { SHIRT_COLLARS, shirtTrim, tailor, wornCollar };
