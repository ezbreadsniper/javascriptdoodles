import { j as createSeededRandom } from "./core.js";
import { memoizeForHead } from "./head-memo.js";
import { n as projectFieldPoint, r as createField } from "./field.js";
import { n as withPortraitTransform, r as renderer } from "./renderer.js";
import { c as createPalette } from "./palette.js";
import { t as clampPose } from "./pose.js";
import { n as createPen, r as penScale } from "./pen.js";
import { d as surfacePoint } from "./cloud.js";
import { headShapeIdForCharacter } from "./identity.js";

export const HALF_PI = Math.PI / 2;

export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export const mix = (start, end, amount) => start + (end - start) * amount;
export const smoothstep = (value) => {
  const amount = clamp(value, 0, 1);
  return amount * amount * (3 - 2 * amount);
};

export function nearestHeadShape(character) {
  return headShapeIdForCharacter(character);
}

/**
 * One shared draw decides which custom style an identity wears, so every style
 * occupies a disjoint slice and no identity can ever qualify for two of them.
 */
export function customHairDraw(character) {
  return createSeededRandom(character.seed, "lifepath-custom-hair").n();
}

export function inSlice(character, from, to) {
  const draw = customHairDraw(character);
  return draw >= from && draw < to;
}

/** Projects a head-space point through DRE's own pose matrix and camera. */
export function projectWorld(point, field) {
  const m = field.m;
  const x = m[0] * point.x + m[1] * point.y + m[2] * point.z;
  const y = m[3] * point.x + m[4] * point.y + m[5] * point.z;
  const z = m[6] * point.x + m[7] * point.y + m[8] * point.z;
  const perspective = field.F / (field.F - z);
  return { x: x * perspective, y: -y * perspective, z };
}

const subtract = (first, second) => ({
  x: first.x - second.x,
  y: first.y - second.y,
  z: first.z - second.z,
});

const cross = (first, second) => ({
  x: first.y * second.z - first.z * second.y,
  y: first.z * second.x - first.x * second.z,
  z: first.x * second.y - first.y * second.x,
});

const length = (vector) => Math.hypot(vector.x, vector.y, vector.z) || 1;

export const normalize = (vector) => {
  const magnitude = length(vector);
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
    z: vector.z / magnitude,
  };
};

/** DRE's actual scalp frame, including a numerically sampled outward normal. */
export function scalpFrame(head, u, v, epsilon = 0.006) {
  const surface = surfacePoint(u, v, head);
  const tangentU = subtract(surfacePoint(u + epsilon, v, head), surfacePoint(u - epsilon, v, head));
  const tangentV = subtract(surfacePoint(u, v + epsilon, head), surfacePoint(u, v - epsilon, head));
  let normal = normalize(cross(tangentU, tangentV));
  const radial = surface.x * normal.x + surface.y * normal.y + surface.z * normal.z;
  if (radial < 0) normal = { x: -normal.x, y: -normal.y, z: -normal.z };
  return { surface, normal, tangentU: normalize(tangentU), tangentV: normalize(tangentV) };
}

export function scalpClearancePoint(head, u, v, clearance) {
  const frame = scalpFrame(head, u, v);
  return {
    x: frame.surface.x + frame.normal.x * clearance,
    y: frame.surface.y + frame.normal.y * clearance,
    z: frame.surface.z + frame.normal.z * clearance,
  };
}

/**
 * A named, head-local root that remains attached as DRE changes the skull.
 * Consumers get the full frame so growth can use the normal or either tangent
 * instead of relying on one character's screen-space placement.
 */
export function scalpAnchor(head, u, v, clearance = 0) {
  const frame = scalpFrame(head, u, v);
  return {
    u,
    v,
    clearance,
    ...frame,
    position: {
      x: frame.surface.x + frame.normal.x * clearance,
      y: frame.surface.y + frame.normal.y * clearance,
      z: frame.surface.z + frame.normal.z * clearance,
    },
  };
}

/**
 * The shortest signed rotation equivalent to an angle.
 *
 * Azimuths run on a branch cut at ±π, which is exactly where hair released at
 * the back of the head sits. Subtracting two angles across that cut gives a
 * turn of nearly 2π, and a strand told to turn by that much orbits the whole
 * skull on its way down instead of just settling.
 */
export const wrapAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));

/**
 * The head surface in a given direction from the head origin.
 *
 * `surfacePoint(u, v)` is not a direction: `x` carries `rx` and `z` carries
 * `rz`, so on any head where those differ the longitude that produces a point
 * is not `atan2(x, z)`, and `cone`, `boxy`, and `bump` bend it further.
 * Starting from the ellipsoid's own inverse and correcting the residual
 * angles converges to the real surface within 1e-4 on every recovered head.
 */
export function surfaceAlongRay(head, direction, iterations = 8) {
  const scaled = {
    x: direction.x / head.rx,
    y: direction.y / head.ry,
    z: direction.z / head.rz,
  };
  const scaledLength = Math.hypot(scaled.x, scaled.y, scaled.z) || 1;
  const targetU = Math.atan2(direction.x, direction.z);
  const targetV = Math.asin(clamp(direction.y, -1, 1));
  let u = Math.atan2(scaled.x, scaled.z);
  let v = Math.asin(clamp(scaled.y / scaledLength, -1, 1));
  let point = surfacePoint(u, v, head);
  for (let step = 0; step < iterations; step++) {
    const radius = Math.hypot(point.x, point.y, point.z) || 1;
    u = wrapAngle(u + wrapAngle(targetU - Math.atan2(point.x, point.z)));
    v = clamp(
      v + (targetV - Math.asin(clamp(point.y / radius, -1, 1))),
      -HALF_PI,
      HALF_PI,
    );
    point = surfacePoint(u, v, head);
  }
  return { u, v, point, radius: Math.hypot(point.x, point.y, point.z) };
}

/** Signed distance from the skull along the outward ray through `point`. */
export function radialClearance(head, point) {
  const radius = Math.hypot(point.x, point.y, point.z);
  if (radius < 1e-6) return -Math.hypot(head.rx, head.ry, head.rz);
  const direction = { x: point.x / radius, y: point.y / radius, z: point.z / radius };
  return radius - surfaceAlongRay(head, direction).radius;
}

/**
 * Distance from the head's vertical axis at one longitude, sampled as a height
 * profile so hanging hair hugs every recovered head shape, including the ones
 * that `boxy`, `bump`, and `cone` push away from a plain ellipsoid.
 */
export function axisProfile(head, angle, samples = 24) {
  return memoizeForHead(head, `${angle}|${samples}`, () =>
    Object.freeze(sampleAxisProfile(head, angle, samples)),
  );
}

function sampleAxisProfile(head, angle, samples) {
  const profile = [];
  for (let index = 0; index <= samples; index++) {
    const v = -HALF_PI + (index / samples) * Math.PI;
    const point = surfacePoint(angle, v, head);
    profile.push({ y: point.y, radius: Math.hypot(point.x, point.z) });
  }
  return profile.sort((first, second) => first.y - second.y);
}

export function radiusAtHeight(profile, y) {
  if (y <= profile[0].y) return profile[0].radius;
  const last = profile[profile.length - 1];
  if (y >= last.y) return last.radius;
  for (let index = 1; index < profile.length; index++) {
    const above = profile[index];
    if (above.y < y) continue;
    const below = profile[index - 1];
    return mix(
      below.radius,
      above.radius,
      (y - below.y) / Math.max(1e-6, above.y - below.y),
    );
  }
  return last.radius;
}

/**
 * The parametric longitude whose meridian lies at a given geometric azimuth.
 *
 * `surfacePoint` puts `rx` on x and `rz` on z, so the meridian `u` and the
 * azimuth `atan2(x, z)` only coincide on a round skull. Inverting
 * `atan2(rx sin u, rz cos u) = azimuth` gives the meridian to sample when what
 * you know is the direction a strand is hanging in.
 */
export function meridianForAzimuth(head, azimuth) {
  return Math.atan2(head.rz * Math.sin(azimuth), head.rx * Math.cos(azimuth));
}

/**
 * A strand rooted on the scalp that falls free of the head, following the
 * skull's real profile in the direction it is actually hanging.
 *
 * `hangingLoc` reads one profile, at the parametric meridian of its start
 * angle, and holds it for the whole fall. That is fine for a strand that drops
 * straight down from where it started, but a braid released at the back of the
 * crown and swung out to the side ends up measuring the skull on the wrong
 * meridian and sinking into it. This re-reads the profile as the strand turns.
 */
export function hangingBraid(head, spec) {
  const steps = spec.steps ?? 20;
  const clearanceAt =
    typeof spec.clearance === "function" ? spec.clearance : () => spec.clearance ?? 0;
  // A strand released high on the skull starts at a small radius and the head
  // is at its widest just below, so snapping straight to the profile throws the
  // first segment sideways instead of downward. It eases off its own root.
  const rootRadius = spec.anchor
    ? Math.hypot(spec.anchor.x, spec.anchor.z)
    : null;
  const settle = spec.settle ?? 0.3;
  // `hold` keeps the strand at its root height while it travels round the
  // skull, and only then lets it descend. Turning and dropping at the same time
  // drags a braid diagonally across the face on its way to the side it is
  // supposed to hang from; holding first walks it over the scalp instead.
  const hold = clamp(spec.hold ?? 0, 0, 0.9);
  const points = [];
  for (let index = 0; index <= steps; index++) {
    const drop = index / steps;
    const descent = hold > 0 ? clamp((drop - hold) / (1 - hold), 0, 1) : drop;
    const swing = hold > 0 ? smoothstep(clamp(drop / hold, 0, 1)) : smoothstep(drop * 1.25);
    const eased = smoothstep(descent * 1.25);
    const y = mix(spec.root, spec.hem, descent);
    const azimuth = spec.angle + (spec.turn ?? 0) * swing;
    const profile = axisProfile(head, meridianForAzimuth(head, azimuth));
    const hug = radiusAtHeight(profile, Math.max(y, -head.ry * 0.1));
    const free =
      hug * (1 + (spec.spread ?? 0) * eased - (spec.tuck ?? 0) * drop ** 3) +
      clearanceAt(drop) +
      (spec.sway ?? 0) * Math.sin(descent * Math.PI * (spec.swayTurns ?? 1)) * 0.5;
    const radius =
      rootRadius === null
        ? free
        : mix(rootRadius, free, smoothstep(drop / settle));
    points.push(
      index === 0 && spec.anchor
        ? { ...spec.anchor }
        : { x: Math.sin(azimuth) * radius, y, z: Math.cos(azimuth) * radius },
    );
  }
  return points;
}

/** A strand rooted on the scalp that then falls free of the head. */
export function hangingLoc(head, spec) {
  const profile = axisProfile(head, spec.angle);
  const steps = spec.steps ?? 18;
  const points = [];
  for (let index = 0; index <= steps; index++) {
    const drop = index / steps;
    const eased = smoothstep(drop * 1.25);
    const y = mix(spec.root, spec.hem, drop);
    const radius =
      radiusAtHeight(profile, Math.max(y, -head.ry * 0.1)) *
        (1 + spec.spread * eased) +
      (spec.clearance ?? 0) +
      spec.sway * Math.sin(drop * Math.PI * spec.swayTurns) * 0.5;
    const angle = spec.angle + spec.twist * eased;
    points.push(
      index === 0 && spec.anchor
        ? { ...spec.anchor }
        : {
            x: Math.sin(angle) * radius,
            y,
            z: Math.cos(angle) * radius,
          },
    );
  }
  return points;
}

/**
 * A sheet of hair hanging around the head between two longitudes. Rows follow
 * the head while they are beside it and then fall, so the sheet never cuts into
 * the skull whatever the head geometry does.
 */
export function curtainPatch(head, spec) {
  const {
    from,
    to,
    top,
    hem,
    pad,
    flare = 0,
    tuck = 0,
    wave = 0,
    waveTurns = 2.4,
    wavePhase = 0,
    hemWave = 0,
    columns = 13,
    rows = 11,
  } = spec;
  const patch = [];
  for (let column = 0; column < columns; column++) {
    const angle = mix(from, to, column / (columns - 1));
    const profile = axisProfile(head, angle, 20);
    const strip = [];
    let hug = 0;
    for (let row = 0; row < rows; row++) {
      const drop = row / (rows - 1);
      const y =
        mix(top, hem, drop) +
        hemWave * Math.sin(angle * 3.1 + wavePhase) * drop * drop;
      // Hair widens with the skull on the way down and then hangs. Following
      // the head all the way would pull the hem into the bottom pole.
      hug = Math.max(hug, radiusAtHeight(profile, y));
      const swing = 1 + flare * drop * drop - tuck * drop ** 3;
      const ripple =
        1 + wave * Math.sin(drop * Math.PI * waveTurns + wavePhase + angle * 1.35);
      const radius = (hug + pad) * swing * ripple;
      strip.push({ x: Math.sin(angle) * radius, y, z: Math.cos(angle) * radius });
    }
    patch.push(strip);
  }
  return patch;
}

/** Walks a sampled patch border so the filled polygon never folds on itself. */
export function patchBorder(patch) {
  const columns = patch.length;
  const rows = patch[0].length;
  const border = [];
  for (let column = 0; column < columns; column++) border.push(patch[column][0]);
  for (let row = 1; row < rows; row++) border.push(patch[columns - 1][row]);
  for (let column = columns - 2; column >= 0; column--) {
    border.push(patch[column][rows - 1]);
  }
  for (let row = rows - 2; row > 0; row--) border.push(patch[0][row]);
  return border;
}

/**
 * The innermost longitude a face-framing sheet may reach. It is derived from
 * the identity's own eye position, so hanging hair can never cross an eye on a
 * wide-set face.
 */
export function faceGuardAngle(character) {
  return clamp(character.layout.eyeU + 0.42, 1.02, 1.46);
}

function silhouetteRoot(visibility, outside, inside) {
  let low = outside;
  let high = inside;
  for (let iteration = 0; iteration < 18; iteration++) {
    const middle = (low + high) / 2;
    if (visibility(middle) > 0) high = middle;
    else low = middle;
  }
  return (low + high) / 2;
}

/**
 * The visible longitude interval along a latitude curve for the current pose,
 * found by scanning outward from the most-visible point until the skull's own
 * silhouette occludes it. Lets a procedural edge (hairline, hem) stop exactly
 * where the current yaw actually hides it instead of running past the fold.
 */
export function visibleUInterval(field, vAt) {
  const samples = 96;
  const step = (Math.PI * 2) / samples;
  const visibility = (u) => projectFieldPoint(u, vAt(u), field).nz;
  let center = -Math.PI;
  let bestVisibility = -Infinity;
  for (let index = 0; index < samples; index++) {
    const u = -Math.PI + index * step;
    const amount = visibility(u);
    if (amount > bestVisibility) {
      bestVisibility = amount;
      center = u;
    }
  }

  let leftInside = center;
  let leftOutside = center - step;
  for (let index = 0; index < samples; index++) {
    if (visibility(leftOutside) <= 0) break;
    leftInside = leftOutside;
    leftOutside -= step;
  }
  let rightInside = center;
  let rightOutside = center + step;
  for (let index = 0; index < samples; index++) {
    if (visibility(rightOutside) <= 0) break;
    rightInside = rightOutside;
    rightOutside += step;
  }

  return {
    left: silhouetteRoot(visibility, leftOutside, leftInside),
    right: silhouetteRoot(visibility, rightOutside, rightInside),
    center,
  };
}

/**
 * Both edges of a strand, offset perpendicular to its own direction in
 * portrait space. Kept separate from `ribbon` because a braided strand needs
 * to draw between the two rails, not just fill the area they enclose.
 */
/** Below this a pair of samples carries no reliable direction in portrait space. */
const DEGENERATE_STEP = 2e-4;

export function strandRails(points, halfWidthAt) {
  const left = [];
  const right = [];
  const last = points.length - 1;
  // A strand that runs over the crown crosses the pole, where two consecutive
  // samples are all but coincident and the heading between them is noise — the
  // rails then flip and tie the ribbon into a bow. Widening the window until
  // the step is real gives the direction the strand is actually travelling.
  const heading = (index) => {
    for (let span = 1; span <= last; span++) {
      const before = points[Math.max(0, index - span)];
      const after = points[Math.min(last, index + span)];
      const dx = after.x - before.x;
      const dy = after.y - before.y;
      const length = Math.hypot(dx, dy);
      if (length > DEGENERATE_STEP) return { dx: dx / length, dy: dy / length };
    }
    return { dx: 0, dy: 1 };
  };
  for (const [index, point] of points.entries()) {
    const { dx, dy } = heading(index);
    const width = halfWidthAt(index / last);
    left.push({ x: point.x - dy * width, y: point.y + dx * width });
    right.push({ x: point.x + dy * width, y: point.y - dx * width });
  }
  return { left, right };
}

/**
 * The plait on a free-hanging strand: the same alternating rail-to-rail chain
 * the scalp rows use, but walked along an already-projected strand rather than
 * across the head surface. Spacing is measured in portrait space so the chain
 * stays even as the strand foreshortens.
 */
export function strandStitches(rails, { lean = 0.7, minStep = 0 } = {}) {
  const stitches = [];
  const last = rails.left.length - 1;
  const step = Math.max(1, Math.round(last * 0.06));
  let previous = null;
  for (let index = 0; index + step <= last; index += step) {
    const side = Math.floor(index / step) % 2 === 0;
    const from = (side ? rails.left : rails.right)[index];
    const to = (side ? rails.right : rails.left)[
      Math.min(last, index + Math.round(step * lean * 2))
    ];
    if (previous && Math.hypot(from.x - previous.x, from.y - previous.y) < minStep) {
      continue;
    }
    previous = from;
    stitches.push({ index, from, to });
  }
  return stitches;
}

/**
 * DRE's chevron plait mark on an already-projected strand.
 *
 * `pigtails` puts one chevron per lobe: two strokes leaving the rails at
 * `(n + 0.15)/N` of the braid and meeting the centre line at `(n + 0.85)/N`,
 * taken from 80% of the half-width. This is that mark for a hanging strand,
 * where the rails are already in portrait space.
 */
export function strandChevrons(centre, rails, { stations = 7, grip = 0.8, minStep = 0 } = {}) {
  const last = centre.length - 1;
  const sampleAt = (amount) => Math.round(clamp(amount, 0, 1) * last);
  const toward = (from, to) => ({
    x: mix(from.x, to.x, grip),
    y: mix(from.y, to.y, grip),
  });
  const chevrons = [];
  let previous = null;
  for (let station = 0; station < stations; station++) {
    const back = sampleAt((station + 0.15) / stations);
    const front = sampleAt((station + 0.85) / stations);
    const tip = centre[front];
    if (previous && Math.hypot(tip.x - previous.x, tip.y - previous.y) < minStep) {
      continue;
    }
    previous = tip;
    chevrons.push({
      station,
      near: toward(centre[back], rails.left[back]),
      far: toward(centre[back], rails.right[back]),
      tip,
    });
  }
  return chevrons;
}

export function ribbon(points, halfWidthAt) {
  const { left, right } = strandRails(points, halfWidthAt);
  return left.concat(right.reverse());
}

export function fillAndOutline(pen, points, options) {
  pen.surface(points, {
    colour: options.fill,
    trace: options.trace,
    wobble: options.fillWobble ?? 0.004,
  });
  pen.stroke(points, {
    colour: options.outline,
    trace: `${options.trace}-outline`,
    w: options.width ?? 0.017,
    wobble: options.outlineWobble ?? 0.003,
    coverage: options.coverage ?? 0.78,
    closed: true,
  });
}

const RGB_COLOUR = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;

function channels(colour) {
  const match = RGB_COLOUR.exec(colour);
  return match ? match.slice(1, 4).map(Number) : [128, 128, 128];
}

export function luminance(colour) {
  const [red, green, blue] = channels(colour);
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
}

export function mixColour(from, to, amount) {
  const first = channels(from);
  const second = channels(to);
  const blend = first.map((value, index) =>
    Math.round(mix(value, second[index], clamp(amount, 0, 1))),
  );
  return `rgb(${blend[0]},${blend[1]},${blend[2]})`;
}

/**
 * The colour of scalp showing between rows of braids.
 *
 * It is the identity's own skin, because that is what a parting actually is.
 * On the pale and grey ends of DRE's hair palette skin and hair land at nearly
 * the same value and the channel disappears, so it is taken toward ink until it
 * reads — a warm skin tone in shadow, never a cool grey mixed out of the hair,
 * which is how a parting turns into the rib of a knitted hat. The blend is
 * solved for the contrast rather than guessed, because a fixed fraction leaves
 * the closest palettes still invisible.
 */
export function partingTone(palette, minimumContrast = 0.19) {
  const skin = luminance(palette.skin);
  const hair = luminance(palette.hair);
  if (Math.abs(skin - hair) >= minimumContrast) return palette.skin;
  const shadow = hair - minimumContrast;
  const toward = shadow >= luminance(palette.ink) ? palette.ink : palette.blank;
  const target = toward === palette.ink ? shadow : hair + minimumContrast;
  const span = luminance(toward) - skin;
  const amount = Math.abs(span) < 1e-3 ? 1 : clamp((target - skin) / span, 0, 1);
  return mixColour(palette.skin, toward, amount);
}

/** Interior shading reads as a lighter pen on dark hair and ink on light hair. */
export function shadingColor(palette) {
  return palette.hairDark ? palette.blank : palette.ink;
}

export const meanDepth = (points) =>
  points.reduce((total, point) => total + point.z, 0) / points.length;

/**
 * Every custom style shares DRE's own field, palette, pen, and portrait
 * transform, and only supplies what to draw behind and in front of the head.
 */
export function createHairPass({ property, back, front }) {
  const run = (context, character, portrait, expression, phase) => {
    const style = character.lifepath?.[property];
    if (!style || !phase) return;
    const pose = clampPose(expression.pose ?? character.pose, renderer.pose);
    const field = createField(character, pose);
    const palette = createPalette(character.palette);
    const pen = createPen(
      context,
      character.seed,
      palette.ink,
      penScale(portrait.mass),
      Math.floor((expression.time ?? 0) * 8),
    );
    withPortraitTransform(context, portrait, expression.awake ?? 0, () => {
      phase({ pen, field, character, palette, style });
    });
  };
  return {
    drawBack: (context, character, portrait, expression = {}) =>
      run(context, character, portrait, expression, back),
    drawFront: (context, character, portrait, expression = {}) =>
      run(context, character, portrait, expression, front),
  };
}
