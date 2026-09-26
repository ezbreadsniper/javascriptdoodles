import { k as spread } from "./core.js";
import { d as surfacePoint, f as project, u as rotate } from "./cloud.js";
import { n as faceFrame } from "./field.js";
import { d as oklch, o as lensColour, u as css } from "./palette.js";
import { t as smoothPath } from "./pen.js";

/**
 * Eyewear: glasses drawn over the face, under hair and headwear.
 *
 * A pair is built in head space, in the plane just in front of the eyes,
 * then turned with the head's pose and projected, so the frame foreshortens
 * as the head turns. Temples run from the frame's outer edge back to a point
 * above each ear and are left out when that ear faces away.
 *
 * `round` and `square` are the original upstream pair and are drawn exactly
 * as before. Every other style has its own function below: it picks a frame
 * material from the person's lens roll, fits its lenses to the face, and
 * builds each lens from a handful of control points the pen smooths.
 *
 * Lens outlines are written in lens units: x points outward (towards the
 * temple on both sides), y points up, and 1 is one `unit` in head space.
 */
const INK = 0.027;
const LENS_STEPS = 24;
// How much a frame front curves back towards the temples.
const WRAP = 0.5;
const TAU = Math.PI * 2;
const tone = (l, c, h) => css(oklch(l, c, h));

// Frame materials: acetate is a filled band edged in ink (black acetate is
// the ink itself); wire is an ink line with a metal core.
const BLACK = { kind: `acetate`, base: null };
const TORTOISE = {
  kind: `acetate`,
  base: tone(0.46, 0.085, 52),
  spots: [tone(0.3, 0.055, 40), tone(0.68, 0.11, 72)],
};
const CHERRY = { kind: `acetate`, base: tone(0.52, 0.16, 22) };
const ROSE = { kind: `acetate`, base: tone(0.68, 0.15, 355) };
const CLEAR_PINK = { kind: `acetate`, base: tone(0.85, 0.07, 355), clear: !0 };
const CLEAR_MINT = { kind: `acetate`, base: tone(0.87, 0.06, 170), clear: !0 };
const CLEAR_HONEY = { kind: `acetate`, base: tone(0.85, 0.08, 78), clear: !0 };
const GOLD = { kind: `wire`, base: tone(0.78, 0.115, 82) };
const SILVER = { kind: `wire`, base: tone(0.84, 0.012, 250) };

// Tints for sunglasses and gradient lenses.
const SMOKE = tone(0.24, 0.02, 282);
const GRADIENTS = [tone(0.62, 0.09, 62), tone(0.55, 0.035, 150), tone(0.66, 0.08, 20)];
const ROSE_TINT = tone(0.72, 0.13, 5);
const HEART_RED = `rgb(214,76,94)`;
const SHINE = `rgb(250,250,246)`;

// How far below its anchor each brow shape dips, in brow units (see face.js).
const BROW_DROP = { none: 0.04, thin: 0.04, thick: 0.06, high: 0.14, angled: 0.26, worried: 0.16 };

/** Per-person lens tint: a pale colour and how strongly it shows, plus picks for the frame. */
function lensTint(rng) {
  return {
    colour: lensColour(rng.n()),
    strength: spread(rng, 0.02, 0.13, 0, 0.26),
    finish: rng.n(),
    gradient: rng.n(),
  };
}

const pick = (value, list) => {
  let total = list.reduce((sum, [, weight]) => sum + weight, 0),
    left = value * total;
  for (let [item, weight] of list) if ((left -= weight) < 0) return item;
  return list[list.length - 1][0];
};

/** A unit lens outline: a circle, or a squircle for `square`. */
function lensShape(style, radius) {
  let points = [];
  for (let step = 0; step < LENS_STEPS; step++) {
    let angle = (step / LENS_STEPS) * 6.2832,
      x = Math.cos(angle),
      y = Math.sin(angle);
    if (style === `square`) {
      let squareness = 0.42;
      x = Math.sign(x) * Math.abs(x) ** squareness;
      y = Math.sign(y) * Math.abs(y) ** squareness * 0.82;
    }
    points.push({ x: x * radius, y: y * radius });
  }
  return points;
}

/** A heart outline in lens units, `size` across, its dip slightly above centre. */
function heartShape(size, steps = 32) {
  let points = [];
  for (let step = 0; step < steps; step++) {
    let angle = (step / steps) * TAU,
      across = 16 * Math.sin(angle) ** 3,
      up =
        13 * Math.cos(angle) -
        5 * Math.cos(2 * angle) -
        2 * Math.cos(3 * angle) -
        Math.cos(4 * angle);
    points.push([(across / 16) * size, (up / 16) * size + 0.1]);
  }
  return points;
}

/**
 * Where a pair sits on this face: both lens centres in head space, the
 * classic lens radius, and helpers that turn lens units into drawn points.
 */
function pairFor(field, layout, leftU, rightU, eyeSize, brow = `thin`) {
  let { head, pose, F: focal } = field,
    place = (point) => {
      let seen = project(rotate(point, pose), focal);
      return { x: seen.x, y: seen.y };
    },
    lensCentre = (u) => {
      let point = surfacePoint(u, layout.eyeV, head);
      return { x: point.x, y: point.y, z: point.z + head.rz * 0.08 };
    },
    left = lensCentre(leftU),
    right = lensCentre(rightU),
    halfGap = (right.x - left.x) / 2,
    browDrop = eyeSize * 1.2 * (BROW_DROP[brow] ?? 0.04) + 0.03;
  return seated(
    {
      head,
      earV: layout.earV,
      halfGap,
      radius: Math.min(eyeSize * 1.45, halfGap * 0.86, head.rx * 0.36),
      eyeSize,
      // How far down the page a brow reaches, as face.js draws it.
      browBottom: (side) =>
        faceFrame(side < 0 ? leftU : rightU, layout.browV, field).to(0, -browDrop).y,
      // Half the face's width at the eye line.
      faceHalf: surfacePoint(1.5708, layout.eyeV, head).x,
      place,
      showsTemple: (side) => faceFrame(side * 1.48, layout.earV, field).nz >= -0.05,
      ear: (side) => place(surfacePoint(side * 1.42, layout.earV + 0.08, head)),
    },
    left,
    right,
  );
}

/** A pair with its lens centres fixed; `seat` and `underBrows` move them. */
function seated(base, left, right) {
  return {
    ...base,
    left,
    right,
    /**
     * A point in lens units on one side (-1 left, 1 right). The front bends
     * back gently towards the temples, as real frames do, so a turned head
     * doesn't leave the far lens jutting out into the air.
     */
    at(side, x, y, unit = base.radius) {
      let centre = side < 0 ? left : right,
        across = centre.x + side * x * unit;
      return base.place({
        x: across,
        y: centre.y + y * unit,
        z: centre.z - WRAP * (across * across - centre.x * centre.x),
      });
    },
    /** An outline in lens units, drawn on one side. */
    outline(side, points, unit = base.radius) {
      return points.map(([x, y]) => this.at(side, x, y, unit));
    },
    /** The same pair with the lens centres `apart` from the middle and moved `down`. */
    seat({ apart, down = 0 }) {
      let middle = (left.x + right.x) / 2,
        move = (centre, side) => ({
          x: apart === void 0 ? centre.x : middle + side * apart,
          y: centre.y - down,
          z: centre.z,
        });
      return seated(base, move(left, -1), move(right, 1));
    },
    /**
     * Keeps a frame reaching `outer` lens units outward and `inner` inward on
     * the face, with at least `gap` for the bridge. Lenses stay centred on the
     * eyes where they can: on wide-set eyes they shrink a little first, then
     * slide in towards the nose; on close-set eyes a big frame slides out.
     * Returns the pair and the unit to draw with.
     */
    fit(unit, outer, inner, gap = 0.035) {
      let edge = base.faceHalf * 0.92,
        eye = (right.x - left.x) / 2,
        size = Math.min(
          unit,
          Math.max(unit * 0.85, (edge - eye) / outer),
          (edge - gap) / (outer + inner),
        ),
        apart = Math.max(gap + inner * size, Math.min(eye, edge - outer * size));
      return [apart === eye ? this : this.seat({ apart }), size];
    },
    /** Lowers the pair until a frame reaching `top` lens units up clears the brows. */
    underBrows(top, unit, most = 0.5) {
      let over = 0;
      for (let side of [-1, 1]) {
        let frameTop = this.at(side, 0, top, unit),
          centre = this.at(side, 0, 0, unit),
          perUnit = Math.hypot(frameTop.x - centre.x, frameTop.y - centre.y) / (top * unit);
        over = Math.max(over, (base.browBottom(side) - frameTop.y) / perUnit);
      }
      return over > 0 ? this.seat({ down: Math.min(over, most * unit) }) : this;
    },
  };
}

// ---------------------------------------------------------------------------
// Drawing helpers shared by the styles.

/**
 * A closed outline smoothed through its control points, exactly as the pen
 * would draw it, so clips and strokes share one curve. The pen repeats the
 * first few points at the end of a closed path; those are dropped.
 */
function smooth(points) {
  let path = smoothPath(points, !0, !0),
    end = path.indexOf(path[0], 1);
  return end > 0 ? path.slice(0, end) : path;
}

function tracePath(ctx, points) {
  ctx.moveTo(points[0].x, points[0].y);
  for (let point of points.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.closePath();
}

/** Runs `draw` clipped to the inside of every outline in `inside`, and outside `hole`. */
function clipped(pen, { inside = [], hole }, draw) {
  let ctx = pen.ctx;
  ctx.save();
  if (hole) {
    ctx.beginPath();
    ctx.rect(-10, -10, 20, 20);
    tracePath(ctx, hole);
    ctx.clip(`evenodd`);
  }
  for (let outline of inside) {
    ctx.beginPath();
    tracePath(ctx, outline);
    ctx.clip();
  }
  draw();
  ctx.restore();
}

/** Tortoiseshell: dark and honey flecks scattered through a frame band. */
function mottle(pen, material, outer, trace) {
  let centre = { x: 0, y: 0 };
  for (let point of outer) {
    centre.x += point.x / outer.length;
    centre.y += point.y / outer.length;
  }
  for (let index = 0; index < 30; index++) {
    let edge = outer[Math.floor(((index * 0.618034) % 1) * outer.length)],
      inward = 0.03 + ((index * 0.37) % 1) * 0.16,
      honey = index % 3 === 0;
    pen.dot(
      { x: edge.x + (centre.x - edge.x) * inward, y: edge.y + (centre.y - edge.y) * inward },
      0.012 + ((index * 3) % 4) * 0.004,
      material.spots[honey ? 1 : 0],
      { trace: `${trace}-fleck${index}`, coverage: honey ? 0.75 : 0.85, noHem: !0 },
    );
  }
}

/**
 * An acetate frame: the band between `outer` and `inner`, filled with the
 * material and edged in ink. The inner edge is only inked where it borders
 * the band, so a partial band (a browline bar) leaves the rest of the lens bare.
 */
function acetate(pen, material, outer, inner, palette, trace) {
  let edge = { wobble: 0.003, colour: palette.ink, closed: !0, singleLayer: !0, square: !0 };
  clipped(pen, { hole: inner }, () => {
    pen.surface(outer, {
      colour: material.base ?? palette.ink,
      trace: `${trace}-fill`,
      wobble: 0.003,
      coverage: material.clear ? 0.8 : 0.97,
      dry: !0,
      square: !0,
    });
    material.spots && clipped(pen, { inside: [outer] }, () => mottle(pen, material, outer, trace));
  });
  pen.stroke(outer, { ...edge, trace: `${trace}-out`, w: INK * 0.7, coverage: 0.95 });
  clipped(pen, { inside: [outer] }, () =>
    pen.stroke(inner, { ...edge, trace: `${trace}-in`, w: INK * 0.5, coverage: 0.8 }),
  );
}

/** A wire line: ink with a thin metal core. */
function wire(pen, points, metal, palette, trace, { closed = !1, w = 1 } = {}) {
  let line = {
    wobble: 0.003,
    closed,
    singleLayer: !0,
    pointed: closed ? 0.75 : 0.3,
    square: closed,
  };
  pen.stroke(points, {
    ...line,
    trace: `${trace}-ink`,
    w: INK * 1.35 * w,
    colour: palette.ink,
    coverage: 0.95,
  });
  pen.stroke(points, { ...line, trace: `${trace}-metal`, w: INK * 0.55 * w, colour: metal.base });
}

/** A band of frame colour through some points (bridges and temples). */
function bar(pen, points, material, palette, trace, w = 1) {
  if (material.kind === `wire`) return wire(pen, points, material, palette, trace, { w });
  let line = { wobble: 0.003, singleLayer: !0, pointed: 0.2 };
  pen.stroke(points, { ...line, trace: `${trace}-ink`, w: INK * 1.3 * w, colour: palette.ink });
  material.base &&
    pen.stroke(points, {
      ...line,
      trace: `${trace}-fill`,
      w: INK * 0.75 * w,
      colour: material.base,
    });
}

function tint(pen, outline, colour, coverage, trace) {
  coverage > 0.02 &&
    pen.surface(outline, { colour, coverage, trace, wobble: 0.004, dry: !0, square: !0 });
}

/** A two-step gradient tint: pale over the whole lens, deeper above `split`. */
function gradientTint(pen, pair, side, lens, colour, trace, unit, split = 0) {
  tint(pen, lens, colour, 0.16, `${trace}-low`);
  let band = pair.outline(
    side,
    [
      [-2, split],
      [-0.4, split + 0.06],
      [0.6, split - 0.04],
      [2, split + 0.02],
      [2, 2],
      [-2, 2],
    ],
    unit,
  );
  clipped(pen, { inside: [lens] }, () =>
    pen.surface(band, {
      colour,
      coverage: 0.3,
      trace: `${trace}-high`,
      wobble: 0.004,
      dry: !0,
      square: !0,
    }),
  );
}

/**
 * The shine on a lens: a long and a short straight streak, leaning the same
 * way on both lenses as if lit from one window. `at` is the middle of the
 * long streak in lens units (x outward).
 */
function glint(
  pen,
  pair,
  side,
  trace,
  unit,
  { at = [0.3, 0.14], size = 0.36, coverage = 0.85 } = {},
) {
  let streak = ([x, y], length, name) =>
    pen.stroke(
      [
        pair.at(side, x - side * 0.5 * length, y - 0.86 * length, unit),
        pair.at(side, x + side * 0.5 * length, y + 0.86 * length, unit),
      ],
      {
        trace: `${trace}-${name}`,
        w: INK * 0.8,
        wobble: 0.002,
        colour: SHINE,
        coverage,
        pointed: 0.5,
      },
    );
  streak(at, size / 2, `glint`);
  streak([at[0] + side * 0.22, at[1] + 0.04], size / 4, `glint2`);
}

function temples(pen, pair, anchor, material, palette, w = 1) {
  for (let [index, side] of [-1, 1].entries()) {
    if (!pair.showsTemple(side)) continue;
    bar(
      pen,
      [pair.at(side, ...anchor), pair.ear(side)],
      material,
      palette,
      `temple${index}`,
      w * 0.8,
    );
  }
}

/** A bridge across the nose from each lens's inner edge at (x, y), rising by `lift`. */
function bridge(pen, pair, [x, y, unit], lift, material, palette, w = 1) {
  bar(
    pen,
    [
      pair.at(-1, x, y, unit),
      pair.at(-1, x - 0.3, y + lift, unit),
      pair.at(1, x - 0.3, y + lift, unit),
      pair.at(1, x, y, unit),
    ],
    material,
    palette,
    `bridge`,
    w,
  );
}

// ---------------------------------------------------------------------------
// The styles. Each takes the pair, the lens tint, the palette, the pen and
// the scene, and draws both lenses, the bridge and the temples.

/** The original round and square glasses: plain ink rims. */
function classic(pen, pair, style, lens, palette) {
  let { left, right, radius, place } = pair,
    outline = (centre) =>
      lensShape(style, radius).map((point) =>
        place({ x: centre.x + point.x, y: centre.y + point.y, z: centre.z }),
      ),
    drawLens = (centre, index) => {
      let rim = outline(centre);
      lens.strength > 0.02 &&
        pen.surface(rim, {
          colour: lens.colour,
          coverage: lens.strength,
          trace: `lensTone${index}`,
          wobble: 0.005,
          dry: !0,
        });
      pen.stroke(rim, {
        trace: `lens${index}`,
        w: INK * 0.85,
        wobble: 0.003,
        closed: !0,
        colour: palette.ink,
      });
    };
  drawLens(left, 0);
  drawLens(right, 1);
  pen.stroke(
    [
      place({ x: left.x + radius * 0.96, y: left.y + radius * 0.08, z: left.z }),
      place({ x: (left.x + right.x) / 2, y: left.y + radius * 0.34, z: left.z }),
      place({ x: right.x - radius * 0.96, y: right.y + radius * 0.08, z: right.z }),
    ],
    { trace: `bridge`, w: INK * 0.75, wobble: 0.003, colour: palette.ink },
  );
  for (let [index, side] of [-1, 1].entries()) {
    if (!pair.showsTemple(side)) continue;
    let centre = side < 0 ? left : right,
      ear = surfacePoint(side * 1.42, pair.earV + 0.08, pair.head);
    pen.stroke(
      [
        place({ x: centre.x + side * radius * 0.98, y: centre.y + radius * 0.02, z: centre.z }),
        place({ x: ear.x, y: ear.y, z: ear.z }),
      ],
      {
        trace: `temple${index}`,
        w: INK * 0.65,
        wobble: 0.003,
        colour: palette.ink,
        coverage: 0.85,
        singleLayer: !0,
      },
    );
  }
}

/**
 * Cat-eye: 1950s acetate whose upper outer corners sweep up into wings, heavy
 * along the top and thin underneath, with a rhinestone at each wing tip.
 */
function catEye(base, lens, palette, pen) {
  let material = pick(lens.finish, [
      [BLACK, 0.45],
      [CHERRY, 0.35],
      [TORTOISE, 0.2],
    ]),
    [fitted, unit] = base.fit(base.radius * 1.02, 1.5, 1.02),
    pair = fitted.underBrows(0.6, unit, 0.3),
    innerShape = [
      [0.98, 0.34],
      [0.4, 0.5],
      [-0.4, 0.5],
      [-0.86, 0.22],
      [-0.8, -0.3],
      [-0.2, -0.6],
      [0.52, -0.5],
      [0.94, -0.1],
    ],
    outerShape = [
      [1.5, 1.02],
      [0.6, 0.76],
      [-0.4, 0.7],
      [-1.02, 0.34],
      [-0.96, -0.4],
      [-0.2, -0.74],
      [0.64, -0.64],
      [1.1, -0.14],
      [1.18, 0.42],
    ];
  for (let [index, side] of [-1, 1].entries()) {
    let inner = smooth(pair.outline(side, innerShape, unit)),
      outer = smooth(pair.outline(side, outerShape, unit));
    tint(pen, inner, lens.colour, lens.strength * 0.8, `lensTone${index}`);
    acetate(pen, material, outer, inner, palette, `cateye${index}`);
    pen.dot(pair.at(side, 1.28, 0.8, unit), 0.016, SHINE, {
      trace: `rhinestone${index}`,
      coverage: 0.95,
      noHem: !0,
    });
  }
  bridge(pen, pair, [-0.96, 0.3, unit], 0.12, material, palette, 0.9);
  temples(pen, pair, [1.26, 0.66, unit], material, palette);
}

/**
 * Aviators: thin gold or silver wire teardrops that droop towards the nose,
 * a straight top bar above the bridge, and a tint deeper at the top.
 */
function aviator(base, lens, palette, pen) {
  let metal = lens.finish < 0.6 ? GOLD : SILVER,
    colour = pick(lens.gradient, [
      [GRADIENTS[0], 0.45],
      [GRADIENTS[1], 0.35],
      [GRADIENTS[2], 0.2],
    ]),
    [pair, unit] = base.fit(Math.min(base.radius * 1.08, base.halfGap * 0.86), 0.98, 0.9),
    shape = [
      [0.98, 0.44],
      [0.4, 0.58],
      [-0.4, 0.56],
      [-0.84, 0.36],
      [-0.9, -0.14],
      [-0.66, -0.74],
      [-0.2, -1.06],
      [0.3, -0.92],
      [0.76, -0.5],
    ];
  for (let [index, side] of [-1, 1].entries()) {
    let rim = smooth(pair.outline(side, shape, unit));
    gradientTint(pen, pair, side, rim, colour, `aviatorTint${index}`, unit, 0.08);
    glint(pen, pair, side, `aviator${index}`, unit, { at: [0.5, 0.2], size: 0.28, coverage: 0.7 });
    wire(pen, rim, metal, palette, `aviator${index}`, { closed: !0 });
  }
  wire(
    pen,
    [pair.at(-1, -0.66, 0.5, unit), pair.at(1, -0.66, 0.5, unit)],
    metal,
    palette,
    `topbar`,
  );
  bridge(pen, pair, [-0.88, 0.12, unit], 0.12, metal, palette);
  temples(pen, pair, [0.98, 0.5, unit], metal, palette);
}

/**
 * Browline (clubmaster): a heavy acetate bar across the top of each lens,
 * a thin wire rim underneath and metal rivets at the outer corners. The bar
 * sits under the brows, never on them, so it can't read as a second pair.
 */
function browline(base, lens, palette, pen) {
  let top = lens.finish < 0.7 ? BLACK : TORTOISE,
    metal = lens.gradient < 0.65 ? SILVER : GOLD,
    [fitted, unit] = base.fit(base.radius * 0.96, 1.14, 1.04),
    // The bar keeps a real thickness however small the lenses get.
    bar = 0.56 + Math.max(0.22, 0.05 / unit),
    pair = fitted.underBrows(bar, unit, 0.45),
    shape = [
      [1.0, 0.26],
      [0.55, 0.56],
      [-0.5, 0.56],
      [-0.92, 0.28],
      [-0.9, -0.3],
      [-0.45, -0.66],
      [0.5, -0.66],
      [0.95, -0.3],
    ],
    barShape = [
      [1.12, bar - 0.32],
      [0.62, bar],
      [-0.55, bar - 0.04],
      [-1.02, bar - 0.32],
      [-1.0, 0.0],
      [1.08, 0.0],
    ],
    upperHalf = [
      [-2, 0.02],
      [2, 0.02],
      [2, 2],
      [-2, 2],
    ];
  for (let [index, side] of [-1, 1].entries()) {
    let rim = smooth(pair.outline(side, shape, unit)),
      outer = smooth(pair.outline(side, barShape, unit));
    tint(pen, rim, lens.colour, lens.strength * 0.8, `lensTone${index}`);
    clipped(pen, { hole: pair.outline(side, upperHalf, unit) }, () =>
      wire(pen, rim, metal, palette, `browwire${index}`, { closed: !0 }),
    );
    acetate(pen, top, outer, rim, palette, `browbar${index}`);
    pen.dot(pair.at(side, 0.84, 0.44, unit), 0.014, metal.base, {
      trace: `rivet${index}`,
      coverage: 0.95,
      noHem: !0,
    });
  }
  bridge(pen, pair, [-0.92, 0.16, unit], 0.14, metal, palette);
  temples(pen, pair, [1.1, 0.4, unit], top, palette);
}

/**
 * Dark sunglasses: chunky wayfarers with near-opaque lenses. The eyes all but
 * disappear, so the brows and mouth carry the expression; the frames sit
 * low enough to leave the brows showing.
 */
function shades(base, lens, palette, pen, scene) {
  let material = lens.finish < 0.75 ? BLACK : TORTOISE,
    [fitted, unit] = base.fit(Math.min(base.radius * 1.05, base.halfGap * 0.82), 1.24, 1.0),
    pair = fitted.underBrows(0.68, unit, 0.3),
    innerShape = [
      [0.98, 0.4],
      [0.3, 0.46],
      [-0.6, 0.4],
      [-0.84, 0.1],
      [-0.68, -0.44],
      [-0.1, -0.56],
      [0.58, -0.48],
      [0.9, -0.12],
    ],
    outerShape = [
      [1.24, 0.66],
      [0.3, 0.7],
      [-0.7, 0.64],
      [-1.0, 0.24],
      [-0.84, -0.56],
      [-0.1, -0.7],
      [0.7, -0.62],
      [1.08, -0.18],
    ];
  for (let [index, side] of [-1, 1].entries()) {
    let inner = smooth(pair.outline(side, innerShape, unit)),
      outer = smooth(pair.outline(side, outerShape, unit));
    tint(pen, inner, SMOKE, 0.93, `shadeTone${index}`);
    scene.eye === `heart`
      ? lovestruck(pen, pair, side, index, unit)
      : scene.eye === `spiral`
        ? dizzy(pen, pair, side, index, unit)
        : glint(pen, pair, side, `shade${index}`, unit, { at: [0.3, 0.1] });
    acetate(pen, material, outer, inner, palette, `shades${index}`);
  }
  bridge(pen, pair, [-0.9, 0.28, unit], 0.08, material, palette, 1.2);
  temples(pen, pair, [1.1, 0.5, unit], material, palette, 1.1);
}

/** Behind dark lenses a lovestruck gaze shows as a small heart on each lens. */
function lovestruck(pen, pair, side, index, unit) {
  let heart = pair.outline(
    side,
    heartShape(0.36, 26).map(([x, y]) => [x * side, y - 0.08]),
    unit,
  );
  pen.surface(heart, {
    colour: HEART_RED,
    trace: `shadeHeart${index}`,
    wobble: 0.003,
    coverage: 0.95,
    dry: !0,
  });
}

/** A dizzy gaze swims up through dark lenses as a pale spiral. */
function dizzy(pen, pair, side, index, unit) {
  let coil = [];
  for (let step = 0; step <= 30; step++) {
    let along = step / 30,
      angle = along * Math.PI * 4.4 * side,
      radius = 0.04 + along * 0.34;
    coil.push(pair.at(side, Math.cos(angle) * radius, Math.sin(angle) * radius - 0.02, unit));
  }
  pen.stroke(coil, {
    trace: `shadeSpiral${index}`,
    w: INK * 0.75,
    wobble: 0.003,
    colour: SHINE,
    coverage: 0.8,
  });
}

/**
 * Half-moon readers perched low on the nose: flat-topped half lenses the
 * eyes peer over, and temples that climb steeply back to the ears.
 */
function readers(base, lens, palette, pen) {
  let material = pick(lens.finish, [
      [TORTOISE, 0.4],
      [GOLD, 0.35],
      [BLACK, 0.25],
    ]),
    [pair, unit] = base.fit(base.radius * 0.88, 1.0, 0.97),
    drop = (-base.eyeSize * 0.62) / unit,
    innerShape = [
      [0.9, drop],
      [0.3, drop],
      [-0.3, drop],
      [-0.86, drop],
      [-0.8, drop - 0.5],
      [-0.3, drop - 0.78],
      [0.3, drop - 0.78],
      [0.82, drop - 0.5],
    ],
    outerShape = innerShape.map(([x, y], index) => [
      x * 1.14,
      index < 4 ? y + 0.12 : (y - drop) * 1.2 + drop,
    ]);
  for (let [index, side] of [-1, 1].entries()) {
    let inner = smooth(pair.outline(side, innerShape, unit)),
      outer = smooth(pair.outline(side, outerShape, unit));
    tint(pen, inner, lens.colour, lens.strength, `lensTone${index}`);
    material.kind === `wire`
      ? wire(pen, inner, material, palette, `readers${index}`, { closed: !0 })
      : acetate(pen, material, outer, inner, palette, `readers${index}`);
  }
  bridge(pen, pair, [-0.9, drop, unit], 0.14, material, palette, 0.8);
  temples(pen, pair, [0.98, drop + 0.02, unit], material, palette, 0.9);
}

/**
 * Oversized seventies frames: big soft squares in clear pastel acetate or
 * tortoiseshell, set wide whatever the eye spacing, with a gradient tint and
 * temples joined low on the frame.
 */
function seventies(base, lens, palette, pen) {
  let material = pick(lens.finish, [
      [CLEAR_PINK, 0.3],
      [CLEAR_HONEY, 0.25],
      [CLEAR_MINT, 0.15],
      [TORTOISE, 0.3],
    ]),
    colour = pick(lens.gradient, [
      [GRADIENTS[2], 0.5],
      [GRADIENTS[0], 0.5],
    ]),
    [fitted, unit] = base.fit(base.head.rx * 0.38, 1.16, 1.04, 0.05),
    pair = fitted.seat({ down: unit * 0.12 }),
    innerShape = [
      [0.96, 0.36],
      [0.4, 0.66],
      [-0.5, 0.64],
      [-0.9, 0.3],
      [-0.9, -0.44],
      [-0.5, -0.9],
      [0.4, -0.98],
      [0.98, -0.52],
    ],
    outerShape = innerShape.map(([x, y]) => [x * 1.14 + 0.02, y * 1.12 + 0.02]);
  for (let [index, side] of [-1, 1].entries()) {
    let inner = smooth(pair.outline(side, innerShape, unit)),
      outer = smooth(pair.outline(side, outerShape, unit));
    gradientTint(pen, pair, side, inner, colour, `seventiesTint${index}`, unit);
    acetate(pen, material, outer, inner, palette, `seventies${index}`);
  }
  bridge(pen, pair, [-1.0, 0.36, unit], 0.1, material, palette, 1.1);
  temples(pen, pair, [1.12, -0.3, unit], material, palette);
}

/** Heart-shaped novelty sunglasses in bright acetate with rosy lenses. */
function hearts(base, lens, palette, pen) {
  let material = lens.finish < 0.55 ? ROSE : CHERRY,
    [pair, unit] = base.fit(Math.min(base.radius * 1.12, base.halfGap * 0.86), 1.04, 1.04);
  for (let [index, side] of [-1, 1].entries()) {
    let inner = smooth(pair.outline(side, heartShape(0.86), unit)),
      outer = smooth(pair.outline(side, heartShape(1.04), unit));
    tint(pen, inner, ROSE_TINT, 0.45, `heartTint${index}`);
    glint(pen, pair, side, `heart${index}`, unit, {
      at: [0.3 * side, 0.36],
      size: 0.3,
      coverage: 0.8,
    });
    acetate(pen, material, outer, inner, palette, `hearts${index}`);
  }
  bridge(pen, pair, [-0.92, 0.5, unit], 0.06, material, palette);
  temples(pen, pair, [1.0, 0.56, unit], material, palette);
}

const STYLES = { cateye: catEye, aviator, browline, shades, readers, seventies, hearts };

/**
 * Draws a pair of glasses. `scene` carries what else is on the face that a
 * style may react to, such as the (mood-adjusted) eye type.
 */
function drawEyewear(pen, field, layout, leftU, rightU, eyeSize, style, lens, palette, scene = {}) {
  if (style === `none`) return;
  let pair = pairFor(field, layout, leftU, rightU, eyeSize, scene.brow),
    draw = STYLES[style];
  draw ? draw(pair, lens, palette, pen, scene) : classic(pen, pair, style, lens, palette);
}

export { drawEyewear, lensTint };
