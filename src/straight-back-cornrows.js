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
  HALF_PI,
  inSlice,
  mix,
  nearestHeadShape,
  partingTone,
  shadingColor,
  smoothstep,
  visibleUInterval,
} from "./hair-support.js";
import { withLazyFitDiagnostics } from "./head-fit.js";
import { HEAD_SHAPE_IDS } from "./identity.js";

const SLICE = Object.freeze({ from: 0.031, to: 0.062 });

/**
 * Past the back of the head and down onto the nape, where the rows taper out.
 * The rows carry their own ends rather than growing a separate tail.
 */
const NAPE_ALPHA = BACK_OF_HEAD + 0.62;

/**
 * A braid lies *on* the scalp. This is only the thickness of the braid itself —
 * enough that its outline is not drawing on bare skin, not enough to lift it
 * off the head. The larger standoff this used to carry existed to push the rows
 * past a hair cap that no longer exists, and without that cap it simply read as
 * braids hovering above the skull.
 */
const ROW_LIFT = 0.022;

/**
 * The least scalp a straight-back needs between the hairline and the crown to
 * stay readable. DRE's own brow guard still wins over it, so on a very
 * high-browed skull the style takes whatever is left rather than crossing the
 * brow, but it no longer sits at the default 0.26 above the brow and collapses
 * into a rim on the long heads.
 */
const MIN_BAND = 0.86;

export const STRAIGHT_BACK_CORNROWS = Object.freeze({
  id: "straight-back-cornrows",
  label: "Straight-back cornrows",
  presentation: "neutral",
  property: "straightBackCornrows",
  allowedHeadShapes: HEAD_SHAPE_IDS,
  fitSummary: "all six DRE head families, rows solved against each skull's own hairline",
  space: Object.freeze({ top: 1.34, side: 1.32, bottom: 1.38 }),
  parameters: Object.freeze({
    hairline: "DRE's guarded front boundary, met per row rather than as one edge",
    coverage: "eleven or thirteen scalp rows from hairline to nape",
    growth: "flat along the scalp normal, front to back",
    length: "hairline to nape",
    width: "0.76-0.84 of the row pitch, weaving with the plait",
    lift: "0.067 at the hairline easing to 0.082 over the crown",
    taper: "rows narrow as they run into the nape",
    density: "11 or 13 rows",
    clumping: "even lateral spacing, the spread solved from the temple hairline",
    symmetry: "mirrored about the centre part",
  }),
});

export function isStraightBackCornrowsEligible(character) {
  return STRAIGHT_BACK_CORNROWS.allowedHeadShapes.includes(nearestHeadShape(character));
}

export function shouldUseStraightBackCornrows(character) {
  return (
    isStraightBackCornrowsEligible(character) &&
    inSlice(character, SLICE.from, SLICE.to)
  );
}

/**
 * Cornrows expose the scalp between rows, so the front edge is not a filled
 * cap boundary but the line each row is allowed to start on. It still clamps
 * to DRE's own brow guard and lifts with the Elder stage.
 */
function cornrowHairline(character) {
  const keepAboveBrow = browClamp(character);
  // DRE already lifts `hairlineV` at Elder, so this only adds the small extra
  // recession a braided front takes on; matching the other styles' lift here
  // would raise the same hairline twice and leave a bare crown.
  const elderLift = character.lifepath?.index === 6 ? 0.04 : 0;
  const natural =
    Math.max(character.layout.browV + 0.26, character.hairlineV - 0.03) + elderLift;
  const front = Math.max(
    keepAboveBrow(0) + 0.02,
    Math.min(natural, HALF_PI - MIN_BAND),
  );
  return (u) => {
    const temple = smoothstep((Math.abs(u) - 0.7) / 0.58);
    return Math.max(keepAboveBrow(u), front - 0.38 * temple);
  };
}

function cornrowPlan(character, hairline) {
  const random = createSeededRandom(character.seed, "straight-back-cornrows");
  const rowCount = random.pick([11, 11, 13]);
  const spread = lateralLimitFor(hairline) * random.range(0.93, 0.99);
  const growth = character.lifepath?.straightBackCornrows?.growth ?? 1;
  const pitch = (2 * spread) / (rowCount - 1);
  return {
    rowCount,
    spread,
    growth,
    pitch,
    betas: rowBetas(rowCount, spread),
    // Narrower than the pitch on purpose: the lobes of one row and the lobes
    // of the next need real scalp between them, not a scored line.
    baseWidth: (pitch / 2) * random.range(0.68, 0.74),
    // `pigtails` puts seven lobes on a whole pigtail. Packing them any tighter
    // than about one lobe per row width turns the chain of beads back into
    // corduroy, because the bumps average out below the width of the ink.
    stitchPitch: random.range(0.8, 0.95),
    nape: random.range(0.9, 1) * growth,
  };
}

/**
 * Rows lie along the scalp, so the lift is only enough to read as hair sitting
 * on the head rather than painted onto it: lowest where the row leaves the
 * hairline and slightly fuller across the crown, the way a real row thickens
 * as hair is fed into it.
 */
function rowLift(plan) {
  return (amount) =>
    ROW_LIFT * (0.6 + 0.4 * smoothstep(amount * 1.6)) * (0.9 + plan.growth * 0.1);
}

/**
 * How much of its width a row keeps as it turns away from the camera. A row
 * that runs over the crown is squarely lit at the hairline and edge-on at the
 * silhouette, and holding full width the whole way ends it on a machined
 * square cut at exactly the place the eye is looking.
 */
const facingFade = (nz) => mix(0.34, 1, smoothstep(nz / 0.26));

/**
 * DRE's own braid section, reused at cornrow scale.
 *
 * `pigtails` builds a pigtail as `rx · (0.1 + 0.03 sin(πt) + 0.022 |sin(7πt)|)`:
 * a base width, a gentle swell along the length, and a bump term at **22% of
 * the base** repeating once per plaited strand. That last term is what makes a
 * braid read as a chain of round lobes rather than a flat ribbon, and both of
 * its rails then get a heavy ink stroke so every lobe is outlined. Matching
 * those ratios here is the difference between braids and corduroy.
 */
function rowWidth(plan, index, stations) {
  const outer = Math.abs(plan.betas[index]) / Math.max(1e-6, plan.spread);
  return braidWidthProfile({
    base: plan.baseWidth * mix(1, 0.9, outer * outer),
    swell: 0.18,
    bumps: 0.22,
    turns: stations,
    taper: 0.3,
    // A long, shallow entry: the braid head is a small nub on the hairline
    // that widens as it runs back, not a tongue laid over the forehead.
    nose: 0.2,
  });
}

/**
 * A slight weave along the row. DRE's own pigtail is symmetric — its lobes
 * swell on both rails at once — so this stays small: enough to keep the row
 * from being mechanically straight, not enough to shear the lobes off centre.
 */
function rowDrift(plan, stations) {
  const amplitude = plan.baseWidth * 0.05;
  return (amount) => amplitude * Math.sin(Math.PI * stations * amount);
}

/** One crossing strand per row width, so the plait packs rather than dots. */
function rowStations(plan, alphaFrom, alphaTo) {
  const span = alphaTo - alphaFrom;
  return Math.max(8, Math.round((span / (2 * plan.baseWidth)) * plan.stitchPitch));
}

export function createStraightBackCornrowsGeometry(character, field) {
  const hairline = cornrowHairline(character);
  const plan = cornrowPlan(character, hairline);
  const rows = plan.betas.map((beta, index) => {
    const alphaFrom = hairlineAlpha(hairline, beta);
    const alphaTo = NAPE_ALPHA * plan.nape - Math.abs(beta) * 0.3;
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
      samples: 48,
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
  return withLazyFitDiagnostics({ hairline, plan, rows }, character, hairline, rows);
}

/**
 * A row, drawn the way DRE draws its own pigtails.
 *
 * `pigtails` builds a braid out of exactly three marks: a filled body between two
 * rails whose half-width carries a bump term at 22% of the base once per
 * plaited strand, both rails stroked heavily so every lobe is outlined, and a
 * chevron per lobe running from each rail forward onto the centre line. Those
 * are reproduced here with DRE's own pen weights, so a cornrow is the same
 * object as a pigtail — just lying on the scalp instead of hanging off it.
 */
function drawRow(pen, palette, { index, row, run, chevrons }) {
  if (!run) return;
  const from = run.from;
  const to = run.to;
  pen.surface(rowPolygon(row, from, to), {
    colour: palette.hair,
    trace: `cornrow-${index}`,
    wobble: 0.005,
  });
  pen.stroke(row.left.slice(from, to + 1), {
    trace: `cornrow-l${index}`,
    w: 0.024,
    wobble: 0.005,
    colour: palette.ink,
    coverage: 0.8,
  });
  pen.stroke(row.right.slice(from, to + 1), {
    trace: `cornrow-r${index}`,
    w: 0.024,
    wobble: 0.005,
    colour: palette.ink,
    coverage: 0.8,
  });
  for (const { station, near, far, tip } of chevrons) {
    pen.stroke([near, tip], {
      trace: `plait-${index}-${station}l`,
      w: 0.016,
      wobble: 0.003,
      colour: palette.ink,
      coverage: 0.55,
      singleLayer: true,
      pointed: 0.3,
    });
    pen.stroke([far, tip], {
      trace: `plait-${index}-${station}r`,
      w: 0.016,
      wobble: 0.003,
      colour: palette.ink,
      coverage: 0.55,
      singleLayer: true,
      pointed: 0.3,
    });
  }
}

/**
 * No cap and no drawn parting. The braids are simply separated, so what shows
 * between them is the character's own scalp rather than a line painted to look
 * like one — which is what a parting actually is. Nothing draws behind the
 * head: the rows run into the nape themselves and are culled where the skull
 * turns away, so there is no separate piece to sort back there.
 *
 * Exported raw so a host other than Lifepath — DRE's own renderer — can call it
 * with its pen, field, character, and palette directly.
 */
export function paintStraightBackCornrows({ pen, field, character, palette }) {
  const geometry = createStraightBackCornrowsGeometry(character, field);
  for (const row of geometry.rows) drawRow(pen, palette, row);
}

const pass = createHairPass({
  property: STRAIGHT_BACK_CORNROWS.property,
  front: paintStraightBackCornrows,
});

export const drawStraightBackCornrowsBack = pass.drawBack;
export const drawStraightBackCornrowsFront = pass.drawFront;
