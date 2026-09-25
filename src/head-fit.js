import { d as surfacePoint } from "./cloud.js";
import { n as hairlineFunction, t as browClamp } from "./shell.js";
import {
  HALF_PI,
  axisProfile,
  radialClearance,
  scalpAnchor,
} from "./hair-support.js";

const TAU = Math.PI * 2;
const EAR_LONGITUDE = 1.48;

const distance = (first, second) =>
  Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);

function sampledBounds(head, longitudeSamples = 72, latitudeSamples = 32) {
  const bounds = {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
  for (let longitudeIndex = 0; longitudeIndex < longitudeSamples; longitudeIndex++) {
    const u = -Math.PI + (longitudeIndex / longitudeSamples) * TAU;
    for (let latitudeIndex = 0; latitudeIndex <= latitudeSamples; latitudeIndex++) {
      const v = -HALF_PI + (latitudeIndex / latitudeSamples) * Math.PI;
      const point = surfacePoint(u, v, head);
      for (const axis of ["x", "y", "z"]) {
        bounds.min[axis] = Math.min(bounds.min[axis], point[axis]);
        bounds.max[axis] = Math.max(bounds.max[axis], point[axis]);
      }
    }
  }
  return bounds;
}

function defaultHairline(character) {
  const natural = hairlineFunction(character, { depth: -0.01, wave: true });
  const floor = browClamp(character);
  const elderLift = character.lifepath?.index === 6 ? 0.12 : 0;
  return (u) => Math.max(floor(u), natural(u) + elderLift);
}

function ellipseClearance(point, center, radii) {
  const normalized = Math.hypot(
    (point.x - center.x) / radii.x,
    (point.y - center.y) / radii.y,
    (point.z - center.z) / radii.z,
  );
  return (normalized - 1) * Math.min(radii.x, radii.y, radii.z);
}

/**
 * Shared DRE-compatible head/body fitting data. The neck/collar values are a
 * deliberately bounded foundation: DRE renders those elements but publishes no
 * recoverable torso or shoulder surface, so this model never invents one.
 */
export function createHeadFitModel(character, { hairlineAt = null } = {}) {
  const { head } = character;
  const bounds = sampledBounds(head);
  const hairline = hairlineAt ?? defaultHairline(character);
  const topProfile = axisProfile(head, 0);
  const crown = scalpAnchor(head, 0, HALF_PI, 0.025);
  const forehead = scalpAnchor(head, 0, hairline(0), 0.025);
  const temples = [-1, 1].map((side) =>
    scalpAnchor(head, side * HALF_PI, hairline(side * HALF_PI), 0.025),
  );
  const ears = [-1, 1].map((side) => {
    const center = surfacePoint(side * EAR_LONGITUDE, character.layout.earV, head);
    return {
      side,
      center,
      radii: { x: 0.13, y: 0.13, z: 0.145 },
    };
  });
  const neckSurface = surfacePoint(0, -1.22, head);
  const neck = {
    center: {
      x: 0,
      y: Math.min(neckSurface.y - head.ry * 0.06, neckSurface.y - head.ry * 0.3),
      z: 0,
    },
    radii: {
      x: Math.max(0.16, head.rx * 0.44),
      y: Math.max(0.16, head.ry * 0.25),
      z: Math.max(0.14, head.rz * 0.42),
    },
  };
  const collar = {
    center: { ...neck.center, y: neck.center.y - head.ry * 0.12 },
    radii: {
      x: neck.radii.x * 1.22,
      y: Math.max(0.045, head.ry * 0.08),
      z: neck.radii.z * 1.18,
    },
    clearance: Math.max(0.025, Math.min(head.rx, head.rz) * 0.06),
  };
  const landmarks = {
    center: { x: 0, y: 0, z: 0 },
    crown,
    forehead,
    temples,
    ears,
    backOfSkull: scalpAnchor(head, Math.PI, 0, 0.025),
    neck,
    collar,
  };

  const headClearance = (point) => radialClearance(head, point);
  const earClearance = (point) => Math.min(...ears.map((ear) => ellipseClearance(point, ear.center, ear.radii)));
  const neckClearance = (point) => ellipseClearance(point, neck.center, neck.radii);
  const collarClearance = (point) => ellipseClearance(point, collar.center, collar.radii);

  return {
    coordinateSystem: {
      center: landmarks.center,
      width: bounds.max.x - bounds.min.x,
      height: bounds.max.y - bounds.min.y,
      depth: bounds.max.z - bounds.min.z,
      bounds,
    },
    hairline,
    landmarks,
    anchor: (u, v, clearance = 0.025) => scalpAnchor(head, u, v, clearance),
    profileAt: (u) => axisProfile(head, u),
    headClearance,
    earClearance,
    neckClearance,
    collarClearance,
    /**
     * Approximate collision report for any sampled procedural path.
     *
     * `head` covers every sample and `tail` covers only the free end. Hair is
     * rooted on the scalp, so a strand's first samples legitimately measure
     * zero clearance: only "never inside the skull" is meaningful there. The
     * part that has left the head is the part that has to hang clear, so it
     * gets its own number instead of being averaged away by the rooted end.
     */
    collisionReport(points, { faceGuard = 0, tailFrom = 2 / 3 } = {}) {
      const report = {
        head: Infinity,
        tail: Infinity,
        ears: Infinity,
        neck: Infinity,
        collar: Infinity,
        faceViolations: 0,
      };
      const firstTailSample = Math.floor(points.length * tailFrom);
      for (const [index, point] of points.entries()) {
        const clearance = headClearance(point);
        report.head = Math.min(report.head, clearance);
        if (index >= firstTailSample) report.tail = Math.min(report.tail, clearance);
        report.ears = Math.min(report.ears, earClearance(point));
        report.neck = Math.min(report.neck, neckClearance(point));
        report.collar = Math.min(report.collar, collarClearance(point));
        const angle = Math.abs(Math.atan2(point.x, point.z));
        if (faceGuard && angle < faceGuard && point.y < forehead.surface.y) report.faceViolations++;
      }
      return report;
    },
    /** DRE-compatible neckline sampler; future clothing can use it as its seam. */
    necklinePoint(angle, drop = 0, clearance = collar.clearance) {
      return {
        x: collar.center.x + Math.sin(angle) * (collar.radii.x + clearance),
        y: collar.center.y - drop,
        z: collar.center.z + Math.cos(angle) * (collar.radii.z + clearance),
      };
    },
    topProfile,
  };
}

/**
 * Attach `fit` and `collisions` to a hair geometry without paying for them.
 *
 * Both are diagnostics: painters never read them, yet building the fit model
 * and ray-marching every strand sample against the skull cost more than
 * drawing the hair itself, every frame. They are computed on first access.
 */
export function withLazyFitDiagnostics(geometry, character, hairlineAt, paths, reportOptions) {
  let fit;
  let collisions;
  const fitModel = () => (fit ??= createHeadFitModel(character, { hairlineAt }));
  return Object.defineProperties(geometry, {
    fit: { enumerable: true, get: fitModel },
    collisions: {
      enumerable: true,
      get: () =>
        (collisions ??= paths.map(({ world }) => fitModel().collisionReport(world, reportOptions))),
    },
  });
}

export const approximateDistance = distance;
