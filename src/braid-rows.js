import { n as projectFieldPoint } from "./field.js";
import { d as surfacePoint } from "./cloud.js";
import { clamp, HALF_PI, mix, scalpFrame } from "./hair-support.js";
import { memoizeForHead } from "./head-memo.js";

/**
 * Rows that run from the front of the head to the back.
 *
 * DRE parameterises the skull as longitude `u` and latitude `v` about the
 * *vertical* axis. That frame is wrong for a front-to-back row: every such row
 * would have to pass through the crown pole, where `u` is undefined and the
 * surface tangents collapse. Rows are therefore laid out in the frame rotated
 * onto the ear-to-ear axis,
 *
 *   alpha — the sagittal sweep, from the face over the crown and down the nape
 *   beta  — the lateral offset from the centre part
 *
 * and converted back to `(u, v)` per sample, so every point still comes from
 * DRE's own `surfacePoint` and inherits `cone`, `boxy`, and `bump`.
 *
 * `beta` is arc length on the unit sphere along the lateral direction, so a
 * fixed half-width in beta is a fixed row width all the way over the head.
 */

/** Kept off the exact pole, where the surface frame and its normal collapse. */
const POLAR_GUARD = 0.02;

/** No row is laid out past this, however low a skull's temple hairline runs. */
export const LATERAL_LIMIT = 1.12;

/** Straight back at eye level. Rows continue past it to reach the nape. */
export const BACK_OF_HEAD = Math.PI;

export function rowDirection(alpha, beta) {
  const lateral = Math.sin(beta);
  const sagittal = Math.cos(beta);
  return {
    x: lateral,
    y: sagittal * Math.sin(alpha),
    z: sagittal * Math.cos(alpha),
  };
}

/** The DRE scalp coordinate a row sample sits on. */
export function rowCoordinates(alpha, beta) {
  const direction = rowDirection(alpha, beta);
  return {
    u: Math.atan2(direction.x, direction.z),
    v: clamp(
      Math.asin(clamp(direction.y, -1, 1)),
      -HALF_PI + POLAR_GUARD,
      HALF_PI - POLAR_GUARD,
    ),
  };
}

export function rowWorldPoint(head, alpha, beta, lift = 0) {
  return memoizeForHead(head, `row|${alpha}|${beta}|${lift}`, () =>
    Object.freeze(worldPointOnRow(head, alpha, beta, lift)),
  );
}

function worldPointOnRow(head, alpha, beta, lift) {
  const { u, v } = rowCoordinates(alpha, beta);
  if (!lift) return surfacePoint(u, v, head);
  const frame = scalpFrame(head, u, v);
  return {
    x: frame.surface.x + frame.normal.x * lift,
    y: frame.surface.y + frame.normal.y * lift,
    z: frame.surface.z + frame.normal.z * lift,
  };
}

/**
 * A row sample in portrait space. `lift` rides DRE's own projected surface
 * normal, the same offset its caps use, so a row sits *on* the skull at every
 * pose instead of floating beside a separately computed silhouette.
 */
export function rowScreenPoint(field, alpha, beta, lift = 0) {
  const { u, v } = rowCoordinates(alpha, beta);
  const surface = projectFieldPoint(u, v, field);
  const point = surface.to(0, 0, lift);
  return { x: point.x, y: point.y, nz: surface.nz, alpha, beta };
}

/**
 * Where a row crosses the hairline, i.e. the alpha at which the row's own
 * latitude first reaches DRE's guarded front boundary. Rows near the ear can
 * top out below that boundary; they then start at their own highest point.
 */
export function hairlineAlpha(hairline, beta, resolution = 26) {
  const above = (alpha) => {
    const { u, v } = rowCoordinates(alpha, beta);
    return v - hairline(u);
  };
  if (above(HALF_PI) <= 0) return HALF_PI;
  let low = 0;
  let high = HALF_PI;
  for (let step = 0; step < resolution; step++) {
    const middle = (low + high) / 2;
    if (above(middle) > 0) high = middle;
    else low = middle;
  }
  return (low + high) / 2;
}

/**
 * The widest row that still has scalp to sit on.
 *
 * A row's highest point is always at `u = ±π/2`, the side of the head, where
 * its latitude is `asin(cos beta)`. Past the beta where that drops under the
 * temple hairline the row is entirely on the face, and laying one out there
 * collapses it onto the silhouette. Solving for it per identity is what lets
 * the outermost row land on the temple of a high hairline and a low one alike.
 */
export function lateralLimitFor(hairline, margin = 0.07) {
  const temple = hairline(HALF_PI) + margin;
  if (temple >= HALF_PI) return 0;
  return Math.min(LATERAL_LIMIT, Math.acos(clamp(Math.sin(temple), -1, 1)));
}

/**
 * Lateral offsets for `count` evenly spread rows. An even count leaves a
 * centre part between the two middle rows; an odd count runs one row straight
 * over the crown, which is what a classic straight-back does.
 */
export function rowBetas(count, spread = LATERAL_LIMIT) {
  if (count === 1) return [0];
  const step = (2 * spread) / (count - 1);
  return Array.from({ length: count }, (_, index) => -spread + index * step);
}

const constant = (value) => (typeof value === "function" ? value : () => value);

/**
 * One sampled row: the centre line, both scalp-following rails, and each
 * sample's facing. Rails are neighbouring rows rather than a screen-space
 * offset, so the row keeps its width across the skull and foreshortens with
 * it instead of staying a constant ribbon over a turning head.
 */
export function sampleRow(field, spec) {
  const {
    beta,
    alphaFrom,
    alphaTo,
    samples = 34,
    halfWidth,
    lift = 0,
    drift = 0,
    fade = null,
  } = spec;
  const halfWidthAt = constant(halfWidth);
  const liftAt = constant(lift);
  const driftAt = constant(drift);
  const centre = [];
  const left = [];
  const right = [];
  for (let index = 0; index <= samples; index++) {
    const amount = index / samples;
    const alpha = mix(alphaFrom, alphaTo, amount);
    const offset = beta + driftAt(amount);
    const height = liftAt(amount);
    // The centre is sampled first so `fade` can narrow the row by how squarely
    // it still faces the camera. A row that runs over the silhouette otherwise
    // ends on a square cut exactly where it is most visible.
    const middle = rowScreenPoint(field, alpha, offset, height);
    const width = halfWidthAt(amount) * (fade ? fade(middle.nz) : 1);
    centre.push(middle);
    left.push(rowScreenPoint(field, alpha, offset - width, height));
    right.push(rowScreenPoint(field, alpha, offset + width, height));
  }
  return { beta, centre, left, right };
}

/** The row's outline, walked down one rail and back up the other. */
export function rowPolygon(row, from = 0, to = row.centre.length - 1) {
  const left = row.left.slice(from, to + 1);
  const right = row.right.slice(from, to + 1);
  return left.concat(right.reverse());
}

/**
 * Contiguous stretches of a row that face the camera. A scalp row wraps past
 * the silhouette on a turned head, and the stretch beyond it belongs behind an
 * opaque skull, so it is dropped rather than drawn over the head's own edge.
 */
export function visibleRuns(row, { facing = 0.005, minimum = 3 } = {}) {
  const runs = [];
  let start = -1;
  for (const [index, sample] of row.centre.entries()) {
    const visible = sample.nz > facing;
    if (visible && start < 0) start = index;
    if (!visible && start >= 0) {
      if (index - start >= minimum) runs.push({ from: start, to: index - 1 });
      start = -1;
    }
  }
  if (start >= 0 && row.centre.length - start >= minimum) {
    runs.push({ from: start, to: row.centre.length - 1 });
  }
  return runs;
}

/**
 * The one stretch of a row worth drawing. `nz` changes sign once along a scalp
 * row, so a second run is numerical noise at the silhouette, and drawing it
 * leaves a detached fleck of ink sitting clear of the hair.
 */
export function longestVisibleRun(row, options) {
  const runs = visibleRuns(row, options);
  if (!runs.length) return null;
  return runs.reduce((best, run) =>
    run.to - run.from > best.to - best.from ? run : best,
  );
}

/**
 * DRE's own plait mark, reused.
 *
 * `pigtails` sets one chevron per lobe: two strokes leaving the rails at
 * `(n + 0.15)/N` of the braid and meeting on the centre line at `(n + 0.85)/N`,
 * taken from 80% of the half-width. Reproducing it here rather than inventing a
 * texture is what makes a cornrow read as the same object as a pigtail.
 */
export function plaitChevrons(field, spec) {
  const {
    beta,
    alphaFrom,
    alphaTo,
    stations,
    halfWidth,
    lift = 0,
    drift = 0,
    grip = 0.8,
    minStep = 0,
  } = spec;
  const halfWidthAt = constant(halfWidth);
  const liftAt = constant(lift);
  const driftAt = constant(drift);
  const at = (amount, offset) =>
    rowScreenPoint(
      field,
      mix(alphaFrom, alphaTo, amount),
      beta + driftAt(amount) + offset,
      liftAt(amount),
    );
  const chevrons = [];
  let previous = null;
  for (let station = 0; station < stations; station++) {
    const back = (station + 0.15) / stations;
    const front = (station + 0.85) / stations;
    const width = halfWidthAt(back) * grip;
    const tip = at(front, driftAt(front) - driftAt(front));
    const near = at(back, -width);
    const far = at(back, width);
    if (tip.nz <= 0.04 || near.nz <= 0.04 || far.nz <= 0.04) continue;
    if (previous && Math.hypot(tip.x - previous.x, tip.y - previous.y) < minStep) {
      continue;
    }
    previous = tip;
    chevrons.push({ station, near, far, tip });
  }
  return chevrons;
}

/**
 * The plait itself: a chain of diagonals that alternate lean, each crossing
 * the row from one parting line to the other.
 *
 * DRE's `pigtails` marks its pigtails with pairs of strokes converging on a
 * centre line, which works on a long thin pigtail but leaves a midrib and a
 * blank margin either side. At cornrow proportions that reads as the veins of
 * a leaf rather than as plaited hair. A real plait has no centre axis and no
 * margin — each crossing strand spans the full width — so the strokes are
 * built rail to rail instead, one per station, leaning the opposite way each
 * time.
 */
export function plaitStitches(field, spec) {
  const {
    beta,
    alphaFrom,
    alphaTo,
    stations,
    halfWidth,
    lift = 0,
    drift = 0,
    lean = 1,
    grip = 1,
    minStep = 0,
  } = spec;
  const halfWidthAt = constant(halfWidth);
  const liftAt = constant(lift);
  const driftAt = constant(drift);
  const railPoint = (amount, side) =>
    rowScreenPoint(
      field,
      mix(alphaFrom, alphaTo, amount),
      beta + driftAt(amount) + side * halfWidthAt(amount) * grip,
      liftAt(amount),
    );
  const stitches = [];
  let previous = null;
  for (let station = 0; station < stations; station++) {
    const back = station / stations;
    const front = Math.min(1, (station + lean) / stations);
    const side = station % 2 === 0 ? 1 : -1;
    const from = railPoint(back, side);
    const to = railPoint(front, -side);
    if (from.nz <= 0.06 || to.nz <= 0.06) continue;
    // Stations are evenly spaced in alpha, but alpha collapses in projection
    // as a row approaches the silhouette, so near the crown and the temples
    // they pile into a solid block of ink. Spacing them in portrait space
    // instead keeps the plait an even chain the whole way along the row.
    if (previous && Math.hypot(from.x - previous.x, from.y - previous.y) < minStep) {
      continue;
    }
    previous = from;
    stitches.push({ station, from, to });
  }
  return stitches;
}

/**
 * A scalloped half-width. `pigtails` shapes its pigtails with the same three
 * terms — a base, a length-wise swell, and a fast ripple for the plait bumps.
 */
export function braidWidthProfile({
  base,
  swell = 0,
  bumps = 0,
  turns = 7,
  taper = 0,
  nose = 0,
  grow = 0,
}) {
  const smooth = (value) => {
    const amount = clamp(value, 0, 1);
    return amount * amount * (3 - 2 * amount);
  };
  return (amount) => {
    // A braid starts as a rounded end rather than a square cut, which is what
    // scallops a real hairline where each row begins.
    const rounded = nose > 0 ? mix(0.42, 1, smooth(amount / nose)) : 1;
    return (
      base *
      rounded *
      (1 +
        grow * amount +
        swell * Math.sin(Math.PI * clamp(amount, 0, 1)) +
        bumps * Math.abs(Math.sin(Math.PI * turns * amount)) -
        taper * amount * amount)
    );
  };
}
