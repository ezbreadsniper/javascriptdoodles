import { j as createSeededRandom } from "./core.js";
import { t as browClamp } from "./shell.js";
import {
  BACK_OF_HEAD,
  hairlineAlpha,
  lateralLimitFor,
  rowBetas,
  rowScreenPoint,
  rowWorldPoint,
} from "./braid-rows.js";
import {
  clamp,
  createHairPass,
  faceGuardAngle,
  hangingBraid,
  inSlice,
  mix,
  nearestHeadShape,
  projectWorld,
  smoothstep,
  strandChevrons,
  strandRails,
  wrapAngle,
} from "./hair-support.js";
import { withLazyFitDiagnostics } from "./head-fit.js";
import { HEAD_SHAPE_IDS } from "./identity.js";

const SLICE = Object.freeze({ from: 0.093, to: 0.124 });

/**
 * Where a braid leaves the scalp.
 *
 * Every braid is parted at the hairline and runs *back* along the skull before
 * it drops, which is what puts the falling braids down the side of the head
 * rather than sprouting off the forehead. The outer columns reach the side of
 * the head early and release there; the inner ones carry on over the crown and
 * release at the nape.
 */
const SIDE_RELEASE = 1.44;
const NAPE_RELEASE = BACK_OF_HEAD + 0.16;

/** A braid lies on the scalp until it releases; this is its own thickness. */
const ROOT_LIFT = 0.021;

/**
 * How far behind the ear a braid has to hang.
 *
 * `head-fit` puts DRE's ear at longitude 1.48. A braid released forward of that
 * runs down over the ear; released behind it, and drawn in the back pass, the
 * ear is drawn on top of it by `drawHead` and the hair sits behind the ear
 * the way it should.
 */
const BEHIND_EAR = 1.7;

const SHARED_PARAMETERS = Object.freeze({
  hairline: "DRE's guarded front boundary, met per braid",
  growth: "back along the scalp, then a free fall from the release point",
  length: "one shared bob line just below the jaw",
  width: "0.030–0.038 portrait units, lobed at 26% like DRE's own pigtail",
  lift: "0.021 along the scalp run",
  taper: "narrows into a tucked, banded tip",
  symmetry: "mirrored about the centre part, seeded per-braid sway",
});

/**
 * The same braid, gathered. Every braid still runs back along the scalp, but
 * once released it swings toward the side of the head, so the falls collect
 * into a curtain beside the face instead of spreading evenly around the skull.
 */
export const SWEPT_BOX_BRAIDS_BOB = Object.freeze({
  id: "swept-box-braids-bob",
  label: "Swept box braids bob",
  presentation: "feminine",
  property: "sweptBoxBraidsBob",
  allowedHeadShapes: HEAD_SHAPE_IDS,
  fitSummary: "all six DRE head families, released braids gathered into a side curtain",
  space: Object.freeze({ top: 1.3, side: 1.84, bottom: 1.68 }),
  variant: Object.freeze({
    sweep: 0.62,
    // How quickly the sweep falls off toward the centre part.
    gather: 1.35,
    columns: [13, 15],
    layers: 1,
    hem: -1.08,
  }),
  parameters: Object.freeze({
    ...SHARED_PARAMETERS,
    coverage: "one set of columns from the hairline to the nape",
    density: "13 to 15 braids",
    clumping: "outer falls swung into a face-framing curtain, centre falls down the back",
  }),
});

export function isSweptBoxBraidsBobEligible(character) {
  return SWEPT_BOX_BRAIDS_BOB.allowedHeadShapes.includes(nearestHeadShape(character));
}

export function shouldUseSweptBoxBraidsBob(character) {
  return isSweptBoxBraidsBobEligible(character) && inSlice(character, SLICE.from, SLICE.to);
}

function bobHairline(character) {
  const keepAboveBrow = browClamp(character);
  const elderLift = character.lifepath?.index === 6 ? 0.04 : 0;
  const front =
    Math.max(character.layout.browV + 0.24, character.hairlineV - 0.04) + elderLift;
  return (u) => {
    const temple = smoothstep((Math.abs(u) - 0.7) / 0.58);
    return Math.max(keepAboveBrow(u), front - 0.36 * temple);
  };
}

function bobPlan(style, character, hairline) {
  const random = createSeededRandom(character.seed, style.id);
  const { variant } = style;
  const columns = random.pick(variant.columns);
  const spread = lateralLimitFor(hairline) * random.range(0.94, 0.99);
  const growth = character.lifepath?.[style.property]?.growth ?? 1;
  return {
    variant,
    columns,
    spread,
    growth,
    betas: rowBetas(columns, spread),
    // The bob line: one height every braid ends on, just below the jaw.
    hem: variant.hem - random.range(0, 0.09),
    width: random.range(0.03, 0.038),
    lobes: random.int(8, 11),
    sway: random.range(0.012, 0.022),
    tuck: random.range(0.12, 0.2),
    releaseBias: random.range(1, 1.25),
    bands: random.chance(0.45) ? 3 : 2,
  };
}

function releaseAlpha(plan, beta) {
  const outward = Math.abs(beta) / Math.max(1e-6, plan.spread);
  return mix(NAPE_RELEASE, SIDE_RELEASE, outward ** plan.releaseBias);
}

/**
 * One braid: a scalp run back from the hairline, then a fall from wherever that
 * run reaches. Both halves are sampled into a single polyline and railed once,
 * so the braid is continuous — the fall starts exactly where the scalp run ends
 * and at exactly its width, instead of being a second object parked near it.
 */
function braidPath(character, field, plan, beta, layer, index) {
  const { head } = character;
  const hairline = plan.hairline;
  const alphaFrom = hairlineAlpha(hairline, beta);
  const alphaTo = releaseAlpha(plan, beta) + layer * 0.12;
  const scalpSteps = 14;
  const scalp = [];
  for (let step = 0; step <= scalpSteps; step++) {
    scalp.push(rowScreenPoint(field, mix(alphaFrom, alphaTo, step / scalpSteps), beta, ROOT_LIFT));
  }
  const release = rowWorldPoint(head, alphaTo, beta, ROOT_LIFT);
  const azimuth = Math.atan2(release.x, release.z);
  // Never forward of the ear: a braid released in front of it hangs over the
  // ear instead of behind it, whichever pass it is drawn in.
  const side = Math.sign(azimuth) || 1;
  const gathered = side * Math.max(BEHIND_EAR, Math.abs(azimuth));
  const target = side * BEHIND_EAR;
  // The sweep is strongest on the outermost columns and dies away toward the
  // centre part. Applying it evenly drags every braid to the two sides and
  // leaves the back of the head bare, which is not a bob — it is two curtains.
  const outward = Math.abs(beta) / Math.max(1e-6, plan.spread);
  const swing =
    plan.variant.sweep * outward ** plan.variant.gather * wrapAngle(target - gathered);
  const wobble = ((index * 7) % 5) / 5 - 0.5;
  const fallWorld = hangingBraid(head, {
    angle: gathered,
    turn: swing,
    hold: 0.16,
    root: release.y,
    anchor: release,
    hem: head.ry * (plan.hem - wobble * 0.045) * plan.growth,
    // The outer layer stands a little further off the skull, so the two sets
    // read as layers rather than as one another's outline.
    clearance: (drop) => mix(0.01, 0.05 + layer * 0.028, smoothstep(drop / 0.45)),
    spread: 0.05,
    tuck: plan.tuck,
    sway: head.rx * (plan.sway + (index % 3) * 0.005),
    swayTurns: 1.05 + (index % 4) * 0.11,
    settle: 0.3,
    steps: 22,
  });
  const fall = fallWorld.map((point) => projectWorld(point, field));
  // The release sample is shared, so the two halves meet exactly.
  const path = scalp.concat(fall.slice(1));
  const halfWidth = (amount) =>
    plan.width *
    mix(0.5, 1, smoothstep(amount / 0.08)) *
    mix(1, 0.62, Math.max(0, amount - 0.45) / 0.55) *
    (1 + 0.26 * Math.abs(Math.sin(Math.PI * plan.lobes * amount)));
  const rails = strandRails(path, halfWidth);
  return {
    index,
    layer,
    beta,
    azimuth,
    world: fallWorld,
    path,
    rails,
    scalpCount: scalp.length,
    chevrons: strandChevrons(path, rails, { stations: plan.lobes, minStep: 0.011 }),
  };
}

export function createBobGeometry(style, character, field) {
  const hairline = bobHairline(character);
  const plan = { ...bobPlan(style, character, hairline), hairline };
  const step = plan.betas.length > 1 ? plan.betas[1] - plan.betas[0] : 0;
  const braids = [];
  for (const [column, base] of plan.betas.entries()) {
    braids.push(braidPath(character, field, plan, base, 0, braids.length));
    if (plan.variant.layers > 1 && column + 1 < plan.betas.length) {
      const between = clamp(base + step / 2, -plan.spread, plan.spread);
      braids.push(braidPath(character, field, plan, between, 1, braids.length));
    }
  }
  return withLazyFitDiagnostics({ hairline, plan, braids }, character, hairline, braids, {
    faceGuard: faceGuardAngle(character),
  });
}

function segmentPolygon(rails, from, to) {
  return rails.left
    .slice(from, to + 1)
    .concat(rails.right.slice(from, to + 1).reverse());
}

function inkBraid(pen, palette, braid, from, to, tag) {
  const polygon = segmentPolygon(braid.rails, from, to);
  pen.surface(polygon, {
    colour: palette.hair,
    trace: `bob-${tag}-${braid.index}`,
    wobble: 0.005,
  });
  pen.stroke(braid.rails.left.slice(from, to + 1), {
    trace: `bob-${tag}-l${braid.index}`,
    w: 0.024,
    wobble: 0.005,
    colour: palette.ink,
    coverage: 0.8,
  });
  pen.stroke(braid.rails.right.slice(from, to + 1), {
    trace: `bob-${tag}-r${braid.index}`,
    w: 0.024,
    wobble: 0.005,
    colour: palette.ink,
    coverage: 0.8,
  });
  for (const { station, near, far, tip } of braid.chevrons) {
    const at = Math.round((station + 0.15) / braid.chevrons.length * (braid.path.length - 1));
    if (at < from || at > to) continue;
    for (const [side, rail] of [["l", near], ["r", far]]) {
      pen.stroke([rail, tip], {
        trace: `bob-plait-${braid.index}-${station}${side}`,
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
 * The hair ties. DRE marks the end of its own pigtail with a single thick
 * accent stroke across the braid (`braidband`); box braids carry several down
 * their length, so the same mark is repeated at set fractions of the fall.
 */
function drawTies(pen, palette, braid, plan, from, to) {
  const last = braid.path.length - 1;
  const fractions = plan.bands === 3 ? [0.52, 0.72, 0.9] : [0.6, 0.88];
  for (const [tie, fraction] of fractions.entries()) {
    const at = Math.round(mix(braid.scalpCount - 1, last, fraction));
    if (at < from || at > to) continue;
    pen.stroke([braid.rails.left[at], braid.rails.right[at]], {
      trace: `bob-band-${braid.index}-${tie}`,
      w: 0.04,
      wobble: 0.003,
      colour: palette.accent,
      pointed: 0.15,
      singleLayer: true,
    });
  }
}

/**
 * The scalp run of every braid is drawn in front of the head, so the crown
 * stays covered whichever way a braid eventually falls. Only the fall is sorted
 * by the side it hangs on.
 */
function drawScalpRuns(pen, palette, geometry) {
  for (const braid of geometry.braids) {
    let visible = 0;
    while (
      visible + 1 < braid.scalpCount &&
      braid.path[visible + 1].nz !== undefined &&
      braid.path[visible + 1].nz > 0.02
    ) {
      visible++;
    }
    if (visible < 2) continue;
    inkBraid(pen, palette, braid, 0, visible, "scalp");
  }
}

/**
 * Every fall is drawn behind the head, so the ear — which `drawHead` draws
 * between the two hair passes — sits in front of the braids rather than under
 * them. What hangs past the skull's own silhouette still shows.
 */
function drawFalls(pen, palette, geometry) {
  const ordered = [...geometry.braids].sort((first, second) => first.layer - second.layer);
  for (const braid of ordered) {
    inkBraid(pen, palette, braid, braid.scalpCount - 1, braid.path.length - 1, "fall");
    drawTies(pen, palette, braid, geometry.plan, braid.scalpCount - 1, braid.path.length - 1);
  }
}

/** Exported raw so DRE's own renderer can call these directly. */
export const paintBobBehind = (style) => ({ pen, field, character, palette }) =>
  drawFalls(pen, palette, createBobGeometry(style, character, field));

export const paintBob = (style) => ({ pen, field, character, palette }) =>
  drawScalpRuns(pen, palette, createBobGeometry(style, character, field));

function bobPass(style) {
  return createHairPass({
    property: style.property,
    back: paintBobBehind(style),
    front: paintBob(style),
  });
}

export const createSweptBoxBraidsBobGeometry = (character, field) =>
  createBobGeometry(SWEPT_BOX_BRAIDS_BOB, character, field);

const swept = bobPass(SWEPT_BOX_BRAIDS_BOB);

export const drawSweptBoxBraidsBobBack = swept.drawBack;
export const drawSweptBoxBraidsBobFront = swept.drawFront;
