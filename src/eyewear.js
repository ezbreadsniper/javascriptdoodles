import { k as spread } from "./core.js";
import { d as surfacePoint, f as project, u as rotate } from "./cloud.js";
import { n as faceFrame } from "./field.js";
import { o as lensColour } from "./palette.js";

/**
 * Eyewear: glasses drawn in front of the face.
 *
 * A pair is built flat in head space, in the plane just in front of the eyes,
 * then turned with the head's pose and projected, so the frame foreshortens
 * as the head turns. Temples run from the frame's outer edge back to a point
 * above each ear and are left out when that ear faces away.
 */
const INK = 0.027;
const LENS_STEPS = 24;

/** Per-person lens tint: a pale colour and how strongly it shows. */
function lensTint(rng) {
  return { colour: lensColour(rng.n()), strength: spread(rng, 0.02, 0.13, 0, 0.26) };
}

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

function drawEyewear(pen, field, layout, leftU, rightU, eyeSize, style, lens, palette) {
  if (style === `none`) return;
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
    radius = Math.min(eyeSize * 1.45, halfGap * 0.86, head.rx * 0.36),
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
    if (faceFrame(side * 1.48, layout.earV, field).nz < -0.05) continue;
    let centre = side < 0 ? left : right,
      ear = surfacePoint(side * 1.42, layout.earV + 0.08, head);
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

export { drawEyewear, lensTint };
