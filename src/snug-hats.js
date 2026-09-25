import { d as surfacePoint, i as visibleSpan, n as normalAt, o as cloudGrid, r as project, s as facing } from "./cloud.js";
import { u as styleRandom } from "./shell.js";
import { c as projectPoint, l as shellOutline } from "./afro.js";

const SNUG_HEADWEAR = new Set([`beanie`, `backcap`, `flatcap`, `bucketcap`]);
const TOP = Math.PI / 2;

function isSnugHeadwear(id) {
  return SNUG_HEADWEAR.has(id);
}

function smooth(from, to, value) {
  let t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

function styleFor(character) {
  let kind = character.features.headwear,
    t = styleRandom(character, `headwear`, `snug-${kind}`),
    brow = character.layout.browV;
  if (kind === `beanie`)
    return {
      kind,
      front: brow + t.range(0.04, 0.09),
      drop: t.range(0.06, 0.14),
      band: t.range(0.13, 0.17),
      cuff: t.range(0.24, 0.3),
      knit: t.range(0.075, 0.09),
      slouch: t.range(0.1, 0.24),
      pompom: t.chance(0.72) ? t.range(0.15, 0.19) : 0,
      ribs: t.int(34, 42),
      tuft: t.range(0, 6.2832),
    };
  if (kind === `backcap`)
    return {
      kind,
      front: brow + t.range(0.1, 0.16),
      drop: t.range(0.2, 0.3),
      band: 0.065,
      knit: 0.065,
      slouch: t.range(0.03, 0.06),
      bill: t.range(0.5, 0.62),
      billDip: t.range(-0.12, 0.12),
      gap: t.range(0.34, 0.42),
      gapHigh: t.range(0.2, 0.26),
    };
  if (kind === `flatcap`)
    return {
      kind,
      front: brow + t.range(0.07, 0.13),
      drop: t.range(0.02, 0.07),
      band: 0.055,
      knit: 0.055,
      slouch: 0,
      puff: t.range(0.14, 0.2),
      flat: t.range(-0.02, 0.04),
      slope: t.range(0.22, 0.34),
      newsboy: t.chance(0.4),
      bill: t.range(0.2, 0.26),
      billDip: t.range(0.75, 0.95),
    };
  return {
    kind: `bucketcap`,
    front: brow + t.range(0.15, 0.21),
    drop: t.range(0.02, 0.06),
    band: 0.07,
    knit: 0.07,
    slouch: t.range(0.06, 0.12),
    bill: t.range(0.3, 0.38),
    billDip: t.range(0.6, 0.78),
    stitches: t.int(2, 3),
  };
}

function bottomOf(style) {
  return (u) => style.front - (style.drop * (1 - Math.cos(u))) / 2;
}

function thicknessOf(style) {
  let bottom = bottomOf(style),
    dome = (v) => style.slouch * smooth(0.6, TOP, v);
  if (style.kind === `beanie`)
    return (u, v) => {
      let fold = bottom(u) + style.cuff,
        w = smooth(fold - 0.01, fold + 0.04, v);
      return style.band * (1 - w) + (style.knit + dome(v)) * w;
    };
  if (style.kind === `flatcap`)
    return (u, v) => {
      let lift = Math.max(0, Math.min(1, (v - bottom(u)) / (1.45 - bottom(u)))),
        ahead = Math.max(0, Math.cos(u)) ** 1.3,
        swell = style.newsboy ? 0.05 * Math.sin(Math.PI * Math.min(1, lift * 1.2)) : 0;
      return style.knit + style.puff * ahead * Math.sin(Math.PI * lift) ** 0.8 + swell;
    };
  return (u, v) => style.knit + dome(v);
}

function flatTop(head, style) {
  return surfacePoint(0, TOP, head).y + style.knit - style.flat;
}

function slopeDown(shell, top, slope) {
  let xyz = new Float32Array(shell.cloud.xyz);
  for (let k = 0; k < xyz.length; k += 3) xyz[k + 1] = Math.min(xyz[k + 1], top - slope * xyz[k + 2]);
  return { ...shell, cloud: { xyz, n: shell.cloud.n } };
}

function snugShell(character) {
  let style = styleFor(character),
    bottom = bottomOf(style),
    thickness = thicknessOf(style),
    shell = {
      bottom,
      thickness: style.band,
      cloud: cloudGrid(character.head, {
        nu: 132,
        nv: 26,
        vFrom: bottom,
        vTo: TOP,
        thickness,
      }),
    };
  return style.kind === `flatcap` ? slopeDown(shell, flatTop(character.head, style), style.slope) : shell;
}

function snugClampY(character) {
  let style = styleFor(character);
  return surfacePoint(0, style.front, character.head).y + 0.01;
}

function snugRoom(character) {
  let style = styleFor(character),
    head = character.head,
    crown = surfacePoint(0, TOP, head).y + thicknessOf(style)(0, TOP),
    top = style.kind === `flatcap` ? flatTop(character.head, style) : crown,
    reach = Math.max(head.rx, head.rz) + style.band;
  style.pompom && (top = crown + style.pompom * 1.9);
  style.kind === `bucketcap` && (reach += style.bill * Math.cos(style.billDip));
  style.kind === `backcap` && (reach = Math.max(reach, head.rz + style.bill * 0.7));
  return { top: top + 0.08, side: reach + 0.06 };
}

function curve(field, span, vOf, offOf, steps = 36) {
  let [from, to] = span,
    points = [];
  for (let k = 0; k <= steps; k++) {
    let u = from + ((to - from) * k) / steps;
    points.push(project(field.head, u, vOf(u), offOf(u), field.m));
  }
  return points;
}

function visibleRuns(field, samples, draw) {
  let run = [],
    index = 0,
    flush = () => {
      run.length >= 2 && draw(run, index++);
      run = [];
    };
  for (let { u, v, off } of samples)
    facing(field.head, u, v, field.m) > 0.06
      ? run.push(project(field.head, u, v, off, field.m))
      : flush();
  flush();
}

function lifted(field, u, v, off, push = { x: 0, y: 0, z: 0 }) {
  let p = surfacePoint(u, v, field.head),
    n = normalAt(u, v, field.head);
  return projectPoint(
    field,
    p.x + n.x * off + push.x,
    p.y + n.y * off + push.y,
    p.z + n.z * off + push.z,
  );
}

function viewAzimuth(field) {
  return Math.atan2(field.m[6], field.m[8]);
}

function brimRing(field, style, from, to, steps, taper) {
  let bottom = bottomOf(style),
    thickness = thicknessOf(style),
    base = [],
    rim = [];
  for (let k = 0; k <= steps; k++) {
    let u = from + ((to - from) * k) / steps,
      v = bottom(u),
      off = thickness(u, v),
      reach = style.bill * taper(u),
      out = { x: Math.sin(u), z: Math.cos(u) },
      push = {
        x: out.x * reach * Math.cos(style.billDip),
        y: -reach * Math.sin(style.billDip),
        z: out.z * reach * Math.cos(style.billDip),
      };
    base.push(lifted(field, u, v, off));
    rim.push(lifted(field, u, v, off, push));
  }
  return { base, rim };
}

const INK_EDGE = { w: 0.022, wobble: 0.004, coverage: 0.8 };
const INK_SEAM = { w: 0.012, wobble: 0.003, coverage: 0.4, singleLayer: !0 };

function drawCrown(pen, field, shell, skull, palette) {
  let outline = shellOutline(field, shell, skull);
  if (outline.polygon.length < 4) return !1;
  pen.surface(outline.polygon, { colour: palette.fabric, trace: `snug-crown`, wobble: 0.005 });
  pen.stroke(outline.outer, { trace: `snug-crown-edge`, colour: palette.ink, ...INK_EDGE });
  return !0;
}

function drawHem(pen, field, style, trace, palette, weight = 0.018) {
  let bottom = bottomOf(style),
    thickness = thicknessOf(style),
    span = visibleSpan(field.head, bottom, field.m);
  pen.stroke(curve(field, span, bottom, (u) => thickness(u, bottom(u))), {
    trace,
    w: weight,
    wobble: 0.004,
    colour: palette.ink,
    coverage: 0.7,
  });
}

function meridian(style, u, from, to, off, steps = 14) {
  let samples = [];
  for (let k = 0; k <= steps; k++) {
    let v = from + ((to - from) * k) / steps;
    samples.push({ u, v, off: off(u, v) + 0.003 });
  }
  return samples;
}

function drawBeanie(pen, field, style, palette) {
  let bottom = bottomOf(style),
    thickness = thicknessOf(style),
    fold = (u) => bottom(u) + style.cuff,
    ribStep = 6.2832 / style.ribs;
  for (let k = 0; k < style.ribs; k++) {
    let u = -Math.PI + (k + 0.5) * ribStep;
    visibleRuns(field, meridian(style, u, fold(u) + 0.05, 1.3 - (k % 2) * 0.12, thickness), (run, i) =>
      pen.stroke(run, { trace: `beanie-rib${k}-${i}`, colour: palette.ink, pointed: 0.6, ...INK_SEAM, coverage: 0.28 }),
    );
  }
  let span = visibleSpan(field.head, fold, field.m),
    upper = curve(field, span, fold, (u) => style.band),
    lower = curve(field, visibleSpan(field.head, bottom, field.m), bottom, (u) => style.band);
  pen.surface(upper.concat([...lower].reverse()), { colour: palette.fabric, trace: `beanie-cuff-fill`, wobble: 0.003 });
  pen.surface(upper.concat([...lower].reverse()), {
    colour: palette.fabricDeep,
    trace: `beanie-cuff`,
    wobble: 0.004,
    coverage: 0.3,
    dry: !0,
  });
  for (let k = 0; k < style.ribs * 2; k++) {
    let u = -Math.PI + (k + 0.5) * (ribStep / 2);
    visibleRuns(field, meridian(style, u, bottom(u) + 0.025, fold(u) - 0.025, () => style.band, 3), (run, i) =>
      pen.stroke(run, { trace: `beanie-cuff-rib${k}-${i}`, colour: palette.ink, ...INK_SEAM, coverage: 0.42 }),
    );
  }
  pen.stroke(upper, { trace: `beanie-fold`, w: 0.017, wobble: 0.004, colour: palette.ink, coverage: 0.7 });
  for (let [i, [a, b]] of [
    [upper[0], lower[0]],
    [upper[upper.length - 1], lower[lower.length - 1]],
  ].entries())
    pen.stroke([a, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, b], {
      trace: `beanie-cuff-side${i}`,
      w: 0.018,
      wobble: 0.003,
      colour: palette.ink,
      coverage: 0.7,
      pointed: 0.3,
    });
  drawHem(pen, field, style, `beanie-hem`, palette);
  style.pompom && drawPompom(pen, field, style, palette);
}

function drawPompom(pen, field, style, palette) {
  let radius = style.pompom,
    lift = thicknessOf(style)(0, TOP) + radius * 0.78,
    centre = lifted(field, 0, TOP - 0.001, lift),
    fluff = [];
  for (let k = 0; k < 30; k++) {
    let a = (k / 30) * 6.2832,
      r = radius * (1 + 0.05 * Math.sin(a * 9 + style.tuft) + 0.03 * Math.sin(a * 17 + style.tuft * 2));
    fluff.push({ x: centre.x + Math.cos(a) * r, y: centre.y + Math.sin(a) * r * 0.94 });
  }
  pen.surface(fluff, { colour: palette.fabric, trace: `pompom`, wobble: 0.006 });
  pen.stroke(fluff, { trace: `pompom-edge`, w: 0.018, wobble: 0.006, colour: palette.ink, closed: !0, coverage: 0.75 });
  for (let k = 0; k < 5; k++) {
    let a = style.tuft + k * 1.3,
      d = radius * (0.25 + (k % 3) * 0.18),
      p = { x: centre.x + Math.cos(a) * d, y: centre.y + Math.sin(a) * d },
      q = { x: p.x + Math.cos(a + 1.9) * radius * 0.28, y: p.y + Math.sin(a + 1.9) * radius * 0.28 };
    pen.stroke([p, q], { trace: `pompom-tuft${k}`, colour: palette.ink, ...INK_SEAM, coverage: 0.35, pointed: 1 });
  }
}

function drawPanelSeams(pen, field, style, palette, count, trace) {
  let bottom = bottomOf(style),
    thickness = thicknessOf(style);
  for (let k = 0; k < count; k++) {
    let u = -Math.PI + (k * 6.2832) / count;
    visibleRuns(field, meridian(style, u, bottom(u) + 0.04, TOP - 0.05, thickness), (run, i) =>
      pen.stroke(run, { trace: `${trace}${k}-${i}`, colour: palette.ink, ...INK_SEAM }),
    );
  }
  let top = lifted(field, 0, TOP - 0.001, thickness(0, TOP) + 0.01);
  pen.dot(top, 0.032, palette.fabricDeep, { trace: `${trace}-button` });
}

function drawBackcap(pen, field, style, palette, hasHair) {
  let bottom = bottomOf(style),
    thickness = thicknessOf(style),
    gapTop = (u) => bottom(u) + style.gapHigh * Math.sqrt(Math.max(0, 1 - (u / style.gap) ** 2)),
    arch = [],
    sill = [];
  drawPanelSeams(pen, field, style, palette, 6, `backcap-seam`);
  for (let k = 0; k <= 20; k++) {
    let u = -style.gap + (2 * style.gap * k) / 20;
    arch.push({ u, v: gapTop(u), off: thickness(u, gapTop(u)) });
    sill.push({ u, v: bottom(u), off: thickness(u, bottom(u)) });
  }
  if (facing(field.head, 0, style.front, field.m) > 0.1) {
    let archLine = arch.map((p) => project(field.head, p.u, p.v, p.off, field.m)),
      sillLine = sill.map((p) => project(field.head, p.u, p.v, p.off, field.m)),
      strapTop = sill.map((p) => project(field.head, p.u, p.v + 0.05, p.off, field.m));
    pen.surface(archLine.concat([...sillLine].reverse()), {
      colour: hasHair ? palette.hair : palette.skin,
      trace: `backcap-gap`,
      wobble: 0.003,
    });
    pen.surface(strapTop.concat([...sillLine].reverse()), {
      colour: palette.fabricDeep,
      trace: `backcap-strap`,
      wobble: 0.003,
    });
    pen.stroke(archLine, { trace: `backcap-arch`, w: 0.018, wobble: 0.003, colour: palette.ink, coverage: 0.75 });
    pen.stroke(strapTop, { trace: `backcap-strap-top`, colour: palette.ink, ...INK_SEAM, coverage: 0.5 });
    let tab = project(field.head, style.gap * 0.35, bottom(0) + 0.025, thickness(0, bottom(0)) + 0.004, field.m);
    pen.dot(tab, 0.02, palette.blank, { trace: `backcap-buckle`, stretch: 1.5 });
  }
  drawHem(pen, field, style, `backcap-hem`, palette);
}

function billTaper(centre, half) {
  return (u) => {
    let d = (u - centre) / half;
    return Math.max(0, 1 - d * d) ** 0.6;
  };
}

function drawBackcapBill(pen, field, style, palette) {
  let half = 1.25,
    { base, rim } = brimRing(field, style, Math.PI - half, Math.PI + half, 28, billTaper(Math.PI, half)),
    outline = rim.concat([...base].reverse());
  pen.surface(outline, { colour: palette.fabric, trace: `backcap-bill`, wobble: 0.004 });
  pen.surface(outline, { colour: palette.fabricDeep, trace: `backcap-bill-k`, wobble: 0.004, coverage: 0.35, dry: !0 });
  pen.stroke(rim, { trace: `backcap-bill-edge`, colour: palette.ink, ...INK_EDGE });
}

function creaseOf(field, style) {
  let bottom = bottomOf(style),
    thickness = thicknessOf(style),
    top = flatTop(field.head, style),
    above = (u, v) => {
      let p = surfacePoint(u, v, field.head),
        n = normalAt(u, v, field.head),
        off = thickness(u, v);
      return p.y + n.y * off - (top - style.slope * (p.z + n.z * off));
    },
    samples = [];
  for (let k = 0; k <= 48; k++) {
    let u = -Math.PI + (k * 6.2832) / 48,
      lo = bottom(u),
      hi = TOP - 0.02;
    if (above(u, hi) < 0) continue;
    for (let i = 0; i < 16; i++) {
      let mid = (lo + hi) / 2;
      above(u, mid) < 0 ? (lo = mid) : (hi = mid);
    }
    samples.push({ u, v: hi, off: thickness(u, hi) });
  }
  return { samples, top };
}

function drawFlatcap(pen, field, style, palette) {
  let half = 0.95,
    crease = creaseOf(field, style);
  visibleRuns(field, crease.samples, (run, i) =>
    pen.stroke(run, { trace: `flatcap-crease${i}`, colour: palette.ink, ...INK_SEAM, coverage: 0.45 }),
  );
  style.newsboy &&
    pen.dot(projectPoint(field, 0, crease.top + 0.01, 0), 0.034, palette.fabricDeep, { trace: `flatcap-button` });
  drawHem(pen, field, style, `flatcap-hem`, palette, 0.016);
  let { base, rim } = brimRing(field, style, -half, half, 26, billTaper(0, half));
  if (facing(field.head, 0, style.front, field.m) < -0.2) return;
  pen.surface(rim.concat([...base].reverse()), { colour: palette.fabric, trace: `flatcap-bill`, wobble: 0.004 });
  pen.surface(rim.concat([...base].reverse()), {
    colour: palette.fabricDeep,
    trace: `flatcap-bill-k`,
    wobble: 0.004,
    coverage: 0.45,
    dry: !0,
  });
  pen.stroke(
    base.map((p, k) => ({ x: p.x + (rim[k].x - p.x) * 0.6, y: p.y + (rim[k].y - p.y) * 0.6 })).slice(3, -3),
    { trace: `flatcap-bill-stitch`, colour: palette.ink, ...INK_SEAM, coverage: 0.3 },
  );
  pen.stroke(rim, { trace: `flatcap-bill-edge`, colour: palette.ink, ...INK_EDGE, coverage: 0.85 });
  pen.stroke(base, { trace: `flatcap-bill-base`, colour: palette.ink, ...INK_SEAM, coverage: 0.6 });
}

function bucketSplit(field, style) {
  let facingU = viewAzimuth(field),
    { rim } = brimRing(field, style, facingU - Math.PI, facingU + Math.PI, 72, () => 1),
    left = 0,
    right = 0;
  for (let k = 1; k < rim.length; k++) {
    rim[k].x < rim[left].x && (left = k);
    rim[k].x > rim[right].x && (right = k);
  }
  let at = (k) => facingU - Math.PI + (k * 6.2832) / 72,
    [from, to] = [at(left), at(right)].sort((a, b) => a - b);
  return facingU >= from && facingU <= to ? [from, to] : [to, from + 6.2832];
}

function bucketHalf(field, style, front) {
  let [from, to] = bucketSplit(field, style);
  return front
    ? brimRing(field, style, from, to, 32, () => 1)
    : brimRing(field, style, to, from + 6.2832, 32, () => 1);
}

function drawBucketBack(pen, field, style, palette) {
  let back = bucketHalf(field, style, !1),
    front = bucketHalf(field, style, !0);
  pen.surface(back.rim.concat(front.rim), { colour: palette.fabric, trace: `bucket-brim-back`, wobble: 0.004 });
  pen.surface(back.rim.concat(front.rim), {
    colour: palette.fabricDeep,
    trace: `bucket-brim-back-k`,
    wobble: 0.004,
    coverage: 0.4,
    dry: !0,
  });
  pen.stroke(back.rim, { trace: `bucket-brim-back-edge`, colour: palette.ink, ...INK_EDGE, coverage: 0.65 });
}

function drawBucketFront(pen, field, style, palette) {
  let bottom = bottomOf(style),
    thickness = thicknessOf(style),
    band = [];
  for (let k = 0; k <= 48; k++) {
    let u = -Math.PI + (k * 6.2832) / 48,
      v = bottom(u) + 0.09;
    band.push({ u, v, off: thickness(u, v) + 0.003 });
  }
  visibleRuns(field, band, (run, i) =>
    pen.stroke(run, { trace: `bucket-crown-stitch${i}`, colour: palette.ink, ...INK_SEAM, coverage: 0.32 }),
  );
  let { base, rim } = bucketHalf(field, style, !0),
    shape = rim.concat([...base].reverse());
  pen.surface(shape, { colour: palette.fabric, trace: `bucket-brim`, wobble: 0.004 });
  for (let s = 1; s <= style.stitches; s++) {
    let t = s / (style.stitches + 1),
      line = base.map((p, k) => ({ x: p.x + (rim[k].x - p.x) * t, y: p.y + (rim[k].y - p.y) * t }));
    pen.stroke(line.slice(2, -2), { trace: `bucket-stitch${s}`, colour: palette.ink, ...INK_SEAM, coverage: 0.3 });
  }
  pen.stroke(rim, { trace: `bucket-brim-edge`, colour: palette.ink, ...INK_EDGE, w: 0.024, coverage: 0.85 });
  pen.stroke(base, { trace: `bucket-brim-base`, colour: palette.ink, ...INK_SEAM, w: 0.015, coverage: 0.6 });
}

function drawSnugBehind(pen, field, character, palette) {
  let style = styleFor(character);
  style.kind === `backcap` && drawBackcapBill(pen, field, style, palette);
  style.kind === `bucketcap` && drawBucketBack(pen, field, style, palette);
}

function drawSnugFront(pen, field, character, shell, skull, palette) {
  if (!shell || !drawCrown(pen, field, shell, skull, palette)) return;
  let style = styleFor(character);
  if (style.kind === `beanie`) drawBeanie(pen, field, style, palette);
  else if (style.kind === `backcap`)
    drawBackcap(pen, field, style, palette, character.features.hair !== `none`);
  else if (style.kind === `flatcap`) drawFlatcap(pen, field, style, palette);
  else drawBucketFront(pen, field, style, palette);
}

export { drawSnugBehind, drawSnugFront, isSnugHeadwear, snugClampY, snugRoom, snugShell };
