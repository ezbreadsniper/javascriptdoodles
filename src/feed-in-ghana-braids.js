import { j as createSeededRandom } from "./core.js";
import { n as projectFieldPoint } from "./field.js";
import { t as browClamp } from "./shell.js";
import {
  BACK_OF_HEAD,
  braidWidthProfile,
  hairlineAlpha,
  lateralLimitFor,
  longestVisibleRun,
  plaitChevrons,
  rowBetas,
  rowPolygon,
  rowWorldPoint,
  sampleRow,
} from "./braid-rows.js";
import {
  clamp,
  createHairPass,
  faceGuardAngle,
  fillAndOutline,
  HALF_PI,
  hangingBraid,
  inSlice,
  mix,
  nearestHeadShape,
  partingTone,
  projectWorld,
  ribbon,
  shadingColor,
  smoothstep,
  strandRails,
  strandStitches,
  visibleUInterval,
  wrapAngle,
} from "./hair-support.js";
import { withLazyFitDiagnostics } from "./head-fit.js";
import { HEAD_SHAPE_IDS } from "./identity.js";

const SLICE = Object.freeze({ from: 0.062, to: 0.093 });

/**
 * Where a row stops being a cornrow and becomes a free braid. It sits on the
 * back of the crown rather than at the nape: hair is fed in along the way, so
 * by the time a Ghana braid leaves the scalp it is already at its full weight.
 */
const RELEASE_ALPHA = BACK_OF_HEAD - 0.26;

const ROW_LIFT = 0.022;
const MIN_BAND = 0.86;

export const FEED_IN_GHANA_BRAIDS = Object.freeze({
  id: "feed-in-ghana-braids",
  label: "Feed-in Ghana braids",
  presentation: "feminine",
  property: "feedInGhanaBraids",
  allowedHeadShapes: HEAD_SHAPE_IDS,
  fitSummary: "all six DRE head families, rows released into falls off the back of the crown",
  space: Object.freeze({ top: 1.34, side: 1.5, bottom: 1.72 }),
  parameters: Object.freeze({
    hairline: "DRE's guarded front boundary, met per row rather than as one edge",
    coverage: "seven or nine fed-in rows from hairline to the back of the crown",
    growth: "flat along the scalp normal, then a profile-clear fall",
    length: "0.9–1.15 head heights below the release point",
    width: "thin at the hairline, 1.5× by the release, tapering down the fall",
    lift: "0.062 at the hairline easing to 0.075 over the crown",
    taper: "falls narrow into a banded tip",
    density: "7 or 9 rows",
    clumping: "rows splay from the back of the crown toward the sides as they fall",
    symmetry: "mirrored about the centre part with a seeded per-fall sway",
  }),
});

export function isFeedInGhanaBraidsEligible(character) {
  return FEED_IN_GHANA_BRAIDS.allowedHeadShapes.includes(nearestHeadShape(character));
}

export function shouldUseFeedInGhanaBraids(character) {
  return (
    isFeedInGhanaBraidsEligible(character) && inSlice(character, SLICE.from, SLICE.to)
  );
}

function ghanaHairline(character) {
  const keepAboveBrow = browClamp(character);
  const elderLift = character.lifepath?.index === 6 ? 0.04 : 0;
  const natural =
    Math.max(character.layout.browV + 0.24, character.hairlineV - 0.04) + elderLift;
  const front = Math.max(
    keepAboveBrow(0) + 0.02,
    Math.min(natural, HALF_PI - MIN_BAND),
  );
  return (u) => {
    const temple = smoothstep((Math.abs(u) - 0.7) / 0.58);
    return Math.max(keepAboveBrow(u), front - 0.36 * temple);
  };
}

function ghanaPlan(character, hairline) {
  const random = createSeededRandom(character.seed, "feed-in-ghana-braids");
  const rowCount = random.chance(0.5) ? 7 : 9;
  const spread = lateralLimitFor(hairline) * random.range(0.92, 0.98);
  const growth = character.lifepath?.feedInGhanaBraids?.growth ?? 1;
  const pitch = (2 * spread) / (rowCount - 1);
  return {
    rowCount,
    spread,
    growth,
    pitch,
    betas: rowBetas(rowCount, spread),
    baseWidth: (pitch / 2) * random.range(0.68, 0.74),
    stitchPitch: random.range(1.9, 2.2),
    // How far the outermost fall swings forward toward the side of the face.
    splay: random.range(0.94, 1),
    length: random.range(0.92, 1.12) * growth,
    sway: random.range(0.02, 0.038),
  };
}

const facingFade = (nz) => mix(0.34, 1, smoothstep(nz / 0.26));

function rowLift(plan) {
  return (amount) =>
    ROW_LIFT * (0.6 + 0.4 * smoothstep(amount * 1.6)) * (0.9 + plan.growth * 0.1);
}

/**
 * A fed-in row starts as a thin braid at the hairline and thickens as hair is
 * added along its length, which is the whole difference between a Ghana braid
 * and a plain cornrow.
 */
function rowWidth(plan, index, stations) {
  const outer = Math.abs(plan.betas[index]) / Math.max(1e-6, plan.spread);
  return braidWidthProfile({
    base: plan.baseWidth * mix(1, 0.9, outer * outer),
    grow: 0.5,
    bumps: 0.07,
    turns: stations / 2,
    nose: 0.22,
  });
}

function rowDrift(plan, stations) {
  const amplitude = plan.baseWidth * 0.15;
  return (amount) => amplitude * Math.sin(Math.PI * stations * amount);
}

function rowStations(plan, alphaFrom, alphaTo) {
  const span = alphaTo - alphaFrom;
  return Math.max(8, Math.round((span / (2 * plan.baseWidth)) * plan.stitchPitch));
}

/**
 * The longitude a released braid falls along.
 *
 * Every row leaves the scalp across the back of the crown, so left alone the
 * falls stack into one slab behind the head. They are fanned by how far out
 * their row sits — the centre row drops straight down the back, the outermost
 * swings widest — but the fan stops behind the ear. Feed-in braids are braided
 * *back*; a strand that swings forward of the ear reads as a loose lock hanging
 * over the face, which is not this style at all.
 */
const BEHIND_THE_EAR = 1.98;

function fallAngle(character, plan, beta) {
  const side = Math.sign(beta) || 1;
  const outward = Math.abs(beta) / Math.max(1e-6, plan.spread);
  const forwardLimit = Math.max(faceGuardAngle(character) + 0.42, BEHIND_THE_EAR);
  return side * mix(Math.PI, forwardLimit, Math.min(1, outward * plan.splay) ** 0.85);
}

function braidFalls(character, field, plan, rows) {
  const { head } = character;
  return rows.map(({ index, world, beta }) => {
    const release = world[world.length - 1];
    const released = Math.atan2(release.x, release.z);
    // The braid leaves the scalp pointing wherever its row was going and only
    // then swings out toward the side. Starting it at the fan angle instead
    // teleports its first sample around the skull and kinks the root.
    const swing = wrapAngle(fallAngle(character, plan, beta) - released);
    // Staggered lengths, and the ones hanging straight down the back run
    // longest: from the front they emerge below the jaw, and matched lengths
    // there would cut the bundle off in one straight fringe.
    const stagger = (index % 3) * 0.09 + (1 - Math.abs(beta) / plan.spread) * 0.16;
    const path = hangingBraid(head, {
      angle: released,
      root: release.y,
      hem: head.ry * (-0.42 - plan.length * (0.6 + stagger)),
      anchor: release,
      // Eased in: a braid leaves the scalp lying against the head and only
      // swings clear as it drops. Standing it off at full clearance from its
      // first sample threw a slab of ribbon sideways past the ear.
      clearance: (drop) => mix(0.012, 0.08, smoothstep(drop / 0.35)),
      spread: 0.05 + plan.growth * 0.05,
      sway: head.rx * (plan.sway + (index % 2) * 0.012),
      swayTurns: 1.15 + (index % 3) * 0.16,
      turn: swing,
      steps: 26,
    });
    const projected = path.map((point) => projectWorld(point, field));
    // Portrait units, not the lateral radians the scalp rows are measured in:
    // a fall has left the head and no longer has a scalp width to inherit.
    // The lobe term is `pigtails`'s own — 22% of the base, once per plaited
    // strand — so a released braid is the same chain of round beads as the
    // rows it grew out of, rather than a flat stick.
    const lobes = 7 + (index % 3);
    const halfWidth = (amount) =>
      mix(0.038, 0.019, amount * amount) *
      mix(0.22, 1, smoothstep(amount / 0.16)) *
      (1 + 0.22 * Math.abs(Math.sin(Math.PI * lobes * amount)));
    const rails = strandRails(projected, halfWidth);
    return {
      index,
      beta,
      world: path,
      projected,
      halfWidth,
      rails,
      stitches: strandStitches(rails, { lean: 0.62, minStep: 0.012 }),
    };
  });
}

export function createFeedInGhanaBraidsGeometry(character, field) {
  const hairline = ghanaHairline(character);
  const plan = ghanaPlan(character, hairline);
  const rows = plan.betas.map((beta, index) => {
    const alphaFrom = hairlineAlpha(hairline, beta);
    const alphaTo = RELEASE_ALPHA - Math.abs(beta) * 0.1;
    const stations = rowStations(plan, alphaFrom, alphaTo);
    const halfWidth = rowWidth(plan, index, stations);
    const lift = rowLift(plan);
    const drift = rowDrift(plan, stations);
    const spec = {
      beta,
      alphaFrom,
      alphaTo,
      halfWidth,
      lift,
      drift,
      fade: facingFade,
      samples: 44,
    };
    const row = sampleRow(field, spec);
    const world = row.centre.map(({ alpha }, sample) =>
      rowWorldPoint(character.head, alpha, beta, lift(sample / (row.centre.length - 1))),
    );
    return {
      index,
      beta,
      spec,
      row,
      world,
      run: longestVisibleRun(row),
      chevrons: plaitChevrons(field, { ...spec, stations, minStep: 0.02 }),
    };
  });
  const falls = braidFalls(character, field, plan, rows);
  return withLazyFitDiagnostics({ hairline, plan, rows, falls }, character, hairline, falls, {
    faceGuard: faceGuardAngle(character),
  });
}

/**
 * A scalp row, drawn with DRE's own pigtail marks: a filled body, both rails
 * stroked so each lobe of the plait is outlined, and a chevron per lobe running
 * from the rails forward onto the centre line. Nothing is filled between rows,
 * so what shows in a parting is the character's actual scalp rather than a line
 * painted to look like one.
 */
function drawRow(pen, palette, { index, row, run, chevrons }) {
  if (!run) return;
  pen.surface(rowPolygon(row, run.from, run.to), {
    colour: palette.hair,
    trace: `ghana-row-${index}`,
    wobble: 0.005,
  });
  for (const [side, rail] of [["l", row.left], ["r", row.right]]) {
    pen.stroke(rail.slice(run.from, run.to + 1), {
      trace: `ghana-${side}${index}`,
      w: 0.024,
      wobble: 0.005,
      colour: palette.ink,
      coverage: 0.8,
    });
  }
  for (const { station, near, far, tip } of chevrons) {
    for (const [side, rail] of [["l", near], ["r", far]]) {
      pen.stroke([rail, tip], {
        trace: `ghana-plait-${index}-${station}${side}`,
        w: 0.016,
        wobble: 0.003,
        colour: palette.ink,
        coverage: 0.55,
        singleLayer: true,
        pointed: 0.3,
      });
    }
  }
}

/**
 * A released braid. It is filled and outlined like the rest of DRE's hair, then
 * plaited with the same alternating chain the scalp rows use so the two halves
 * of the style read as one braid that happens to leave the head partway down.
 */
function drawFall(pen, palette, fall) {
  fillAndOutline(pen, ribbon(fall.projected, fall.halfWidth), {
    fill: palette.hair,
    outline: palette.ink,
    trace: `ghana-fall-${fall.index}`,
    fillWobble: 0.004,
    outlineWobble: 0.003,
    width: 0.013,
    coverage: 0.72,
  });
  const ink = shadingColor(palette);
  for (const { index, from, to } of fall.stitches) {
    pen.stroke([from, to], {
      colour: ink,
      trace: `ghana-fall-plait-${fall.index}-${index}`,
      w: 0.005,
      wobble: 0.003,
      coverage: palette.hairDark ? 0.3 : 0.42,
      singleLayer: true,
      pointed: 0.3,
    });
  }
}

/**
 * Every fall is drawn behind the head. The fan is stopped behind the ear, so a
 * released braid is always on the far side of the skull; sorting them by mean
 * depth instead let one whose average tipped forward paint a slab across the
 * face beside the ear.
 */
function drawFalls(pen, palette, geometry) {
  for (const fall of geometry.falls) drawFall(pen, palette, fall);
}

/** Exported raw so DRE's own renderer can call these directly. */
export function paintFeedInGhanaBraidsBehind({ pen, field, character, palette }) {
  drawFalls(pen, palette, createFeedInGhanaBraidsGeometry(character, field));
}

export function paintFeedInGhanaBraids({ pen, field, character, palette }) {
  const geometry = createFeedInGhanaBraidsGeometry(character, field);
  for (const row of geometry.rows) drawRow(pen, palette, row);
}

const pass = createHairPass({
  property: FEED_IN_GHANA_BRAIDS.property,
  back: paintFeedInGhanaBraidsBehind,
  front: paintFeedInGhanaBraids,
});

export const drawFeedInGhanaBraidsBack = pass.drawBack;
export const drawFeedInGhanaBraidsFront = pass.drawFront;
