import { j as e } from "./core.js";
import { braidingSpace as Fr } from "./braiding.js";
import { t } from "./pose.js";
import { a as n, o as r } from "./cloud.js";
import { n as i, r as a } from "./field.js";
import { c as o, l as s } from "./palette.js";
import { n as c, r as l } from "./pen.js";
import {
  a as u,
  i as d,
  n as f,
  o as p,
  r as m,
  t as h,
} from "./head.js";
import {
  S as g,
  _,
  a as v,
  b as y,
  c as b,
  d as x,
  f as S,
  g as C,
  h as w,
  i as T,
  m as ee,
  o as E,
  p as D,
  s as O,
  u as k,
  v as te,
  w as A,
  x as ne,
  y as re,
} from "./face.js";
import { a as j } from "./shell.js";
import { r as M } from "./afro.js";
import { a as N, i as P, o as F } from "./hat.js";
import { a as ie, i as ae, n as I, r as L, t as R } from "./hair.js";
import { t as oe } from "./extras.js";
import { drawPiercing } from "./piercings.js";
import { drawNecklace } from "./necklaces.js";
import { n as z, t as B } from "./paper.js";
import { moodFeatures } from "./mood.js";
import { drawMoodMarks } from "./moodlets.js";
var V = { top: 1.3, side: 1.3 },
  H = [
    `behind-the-head`,
    `neck`,
    `ears`,
    `head`,
    `facing-ear`,
    `skin`,
    `beard`,
    `far-eye`,
    `nose`,
    `near-eye`,
    `mouth`,
    `hairstyle`,
    `on-top`,
    `star-eyes`,
    `infront`,
  ],
  U = new Map(H.map((e, t) => [e, t]));
function se(e) {
  return [...e].sort((e, t) => U.get(e.layer) - U.get(t.layer));
}
var W = { yaw: 0.4, pitch: 0.26, roll: 0.14 },
  G = new WeakMap(),
  K = (e) => [e.range(0.9, 1.08), e.range(0.9, 1.1)],
  q = (e) => (e.n() < 0.5 ? -1 : 1),
  J = (e) => e.n(),
  Y = (e) => e.range(0.85, 1.55),
  X = (e) => e.range(0.75, 1.45),
  Z = (e) => (e.n() < 0.72 ? 1 : 2);
function ce(t) {
  let n = G.get(t);
  if (n) return n;
  let i = L(t),
    a = e(t.seed, `handwriting`),
    s = K(a),
    c = q(a),
    l = a.n(),
    u = J(a),
    d = Y(a),
    f = k(a),
    m = b(a),
    h = D(a),
    g = X(a),
    _ = x(a),
    v = Z(a),
    y = S(a),
    C = p(a),
    w = O(a),
    T = {
      skull: r(t.head, { nu: 72, nv: 84 }),
      hairShell: i.hair,
      hatShell: i.hat,
      palette: o(t.palette),
      eyeJitter: s,
      side: c,
      beatOffset: l,
      beardPlacement: u,
      dotMass: d,
      star: {
        shapes: E(f, y.second),
        size: _,
        large: y.large,
        colour: y.colour,
      },
      heart: m,
      cheekbones: h,
      neckWidth: g,
      ringArcs: v,
      collar: C,
      lens: w,
    };
  return (le(t, T), G.set(t, T), T);
}
function le(t, n) {
  let r = t.style;
  if (r) {
    if (r.eye !== void 0) {
      let t = e(r.eye, `handwriting`);
      n.eyeJitter = K(t);
      let i = k(t),
        a = x(t),
        o = S(t);
      n.star = {
        shapes: E(i, o.second),
        size: a,
        large: o.large,
        colour: o.colour,
      };
    }
    if (r.mark !== void 0) {
      let t = e(r.mark, `handwriting`);
      ((n.side = q(t)), (n.cheekbones = D(t)), (n.ringArcs = Z(t)));
    }
    if (
      (r.colours !== void 0 &&
        (n.star.colour = s(e(r.colours, `handwriting`).n())),
      r.mouth !== void 0 && (n.heart = b(e(r.mouth, `handwriting`))),
      r.beard !== void 0 && (n.beardPlacement = J(e(r.beard, `handwriting`))),
      r.cheek !== void 0 && (n.dotMass = Y(e(r.cheek, `handwriting`))),
      r.eyewear !== void 0 && (n.lens = O(e(r.eyewear, `handwriting`))),
      r.collar !== void 0)
    ) {
      let t = e(r.collar, `handwriting`);
      ((n.neckWidth = X(t)), (n.collar = p(t)));
    }
  }
}
var ue = {
  id: `renderer`,
  label: `Renderer`,
  pose: W,
  space(e) {
    let t = V.top,
      n = V.side,
      r = e.features.headwear === `hat`,
      o = P(e);
    o && ((t = Math.max(t, o.top)), (n = Math.max(n, o.side)));
    if (e.features.hair === `bun`) {
      let n = L(e).hair?.thickness ?? 0.1;
      t = Math.max(t, R(e, n));
    }
    if (e.features.hair === `mohawk`) {
      let r = I(e);
      ((t = Math.max(t, r.top)), (n = Math.max(n, r.side)));
    }
    if (e.features.hair === `afro`) {
      let i = j(e, M(e, r));
      ((t = Math.max(t, i.top)), (n = Math.max(n, i.side)));
    }
    return { top: t, side: Math.max(n, Fr(e)) };
  },
  makeSheet(e, t, n, r, i, a) {
    let o = a?.arc ? B(e, t, n, r) : void 0;
    return (
      o && (o.shadow(), e.save(), e.clip(o.path())),
      z(e, t, n, i),
      {
        drawHead(t, n, r) {
          de(e, t, n, r ?? {});
        },
        done() {
          o && (e.restore(), o.edge());
        },
      }
    );
  },
};
var penCache = new WeakMap();
function penFor(character, ctx, ink, width, beat) {
  let cached = penCache.get(character);
  if (
    cached &&
    cached.ctx === ctx &&
    cached.ink === ink &&
    cached.width === width &&
    cached.beat === beat
  )
    return cached.pen;
  let pen = c(ctx, character.seed, ink, width, beat);
  penCache.set(character, { ctx, ink, width, beat, pen });
  return pen;
}
function Q(e, t, n, r) {
  (e.save(),
    e.translate(t.cx, t.cy - n * 0.05 * t.mass),
    e.scale(t.mass, t.mass),
    r(),
    e.restore());
}
function $(e, r, o, s) {
  let face = moodFeatures(s.mood, r.features),
    p = ce(r),
    b = p.palette,
    x = s.awake ?? 0,
    S = s.time ?? 0,
    E = t(s.pose ?? r.pose, W),
    D = a(r, E),
    O = r.layout,
    k = {
      x: s.gazeX ?? 0,
      y: s.gazeY ?? 0,
      lids: s.lids ?? 0,
      awake: x,
      time: S,
    },
    j = n(p.skull, D.m, { bins: 108 });
  if (j.length < 8) return [];
  let M = Math.floor(S * 8 + p.beatOffset),
    P = penFor(r, e, b.ink, l(o.mass), M),
    I = T(D, O),
    L = h(D, O.earV),
    R = r.features.headwear === `headphones`,
    z = A(-O.eyeU, O.eyeV, D),
    B = A(O.eyeU, O.eyeV, D),
    V = i(z, O.eyeV + r.asym, D),
    H = i(B, O.eyeV - r.asym, D),
    U = [],
    G = (e, t, n) => {
      U.push({ layer: e, name: t, draw: n });
    };
  if (
    (G(`neck`, `Neck and collar`, () =>
      f(P, D, j, r.features.collar, b, p.neckWidth, p.collar),
    ),
    G(`neck`, `Necklace`, () =>
      drawNecklace(P, D, j, r.features.necklace, r, b, p.neckWidth, p.collar),
    ),
    G(`behind-the-head`, `Hair behind`, () =>
      ie(P, D, r, r.features.hair, p.hairShell, j, b),
    ),
    G(`behind-the-head`, `Headwear behind`, () =>
      F(P, D, r, r.features.headwear, b),
    ),
    !R)
  )
    for (let [e, t] of L.entries()) {
      let n = e === 0 ? -1 : 1;
      G(
        t.nz >= 0 ? `facing-ear` : `ears`,
        e === 0 ? `Ear left` : `Ear right`,
        () => u(P, t, 0.13, b, n, j),
      );
    }
  (G(`head`, `Head surface`, () => d(P, j, D, b)),
    G(`head`, `Contour`, () => m(P, j, b)),
    G(`skin`, `Cheeks`, () =>
      w(
        P,
        D,
        O,
        r.features.cheek,
        b,
        x,
        Math.max(0.1, I.eye * 0.95),
        p.dotMass,
      ),
    ),
    G(`skin`, `Marks`, () =>
      g(P, D, O, r.features.mark, p.side, I.eye, b, p.ringArcs),
    ));
  let K = i(0, O.mouthV, D),
    q = v(face.mouth, I.mouthWide, I.mouthHigh, s.mouth ?? 0, x, p.heart),
    J =
      (s.mouth ?? 0) > 0
        ? v(face.mouth, I.mouthWide, I.mouthHigh, 0, x, p.heart)
        : q;
  G(`beard`, `Beard`, () =>
    C(
      P,
      D,
      O,
      r.features.beard,
      b,
      I.mouthWide,
      { large: I.nose, type: r.features.nose },
      J,
      K,
      p.beardPlacement,
    ),
  );
  let Y = H.z >= V.z ? 1 : -1,
    X = face.eye === `sparkle`,
    Z = Y === 1 ? [-1, 1] : [1, -1];
  for (let e of Z) {
    let t = e < 0 ? V : H,
      n = I.eye * p.eyeJitter[e < 0 ? 0 : 1],
      a = Math.max(0.85, (1 - O.eyeU) / Math.max(0.05, I.eye)),
      o = e === Y ? `near-eye` : `far-eye`;
    (G(X ? `star-eyes` : o, e < 0 ? `Eye left` : `Eye right`, () => {
      let i = () =>
        ee(
          P,
          t,
          n,
          face.eye,
          e,
          k,
          r.pupil,
          b,
          `eye${e}`,
          p.star,
          a,
        );
      r.features.mark === `cheekbones` &&
      (p.cheekbones.both || e === p.side)
        ? ne(
            P,
            t,
            n,
            face.eye,
            e,
            p.cheekbones,
            j,
            k.lids,
            b,
            `cheek${e}`,
            i,
          )
        : i();
    }),
      G(o, e < 0 ? `Brow left` : `Brow right`, () => {
        _(
          P,
          i(e < 0 ? z : B, O.browV, D),
          n * 1.2,
          face.brow,
          e,
          x,
          b,
          `brow${e}`,
        );
      }));
  }
  return (
    G(`nose`, `Nose`, () =>
      y(
        P,
        i(0, O.zones.nose.v, D),
        I.nose,
        r.features.nose,
        E.yaw >= 0 ? 1 : -1,
        E.yaw,
        b,
      ),
    ),
    G(`mouth`, `Mouth`, () => re(P, K, q, b)),
    G(`mouth`, `Piercings`, () =>
      drawPiercing(P, r, r.features.piercing, p.side, b, {
        mouth: q,
        mouthAt: K,
        nose: I.nose,
        noseAt: i(0, O.zones.nose.v, D),
        yaw: E.yaw,
      }),
    ),
    G(`hairstyle`, `Hair`, () => ae(P, D, r, r.features.hair, p.hairShell, j, b)),
    G(`hairstyle`, `Headwear`, () =>
      N(P, D, r, r.features.headwear, p.hatShell, j, b),
    ),
    G(`on-top`, `Extras`, () =>
      oe(
        P,
        D,
        r,
        R && r.features.extras === `earring` ? `none` : r.features.extras,
        L,
        p.side,
        b,
        { time: S, mouth: q, mouthAt: K, headphones: R, outline: j },
      ),
    ),
    G(`infront`, `Mood`, () => drawMoodMarks(P, D, O, s.mood, b, S)),
    G(`infront`, `Eyewear`, () =>
      te(P, D, O, z, B, I.eye, face.eyewear, p.lens, b),
    ),
    se(U)
  );
}
function de(e, t, n, r) {
  let i = $(e, t, n, r);
  i.length &&
    Q(e, n, r.awake ?? 0, () => {
      for (let e of i) e.draw();
    });
}
function headBeat(character, time) {
  return Math.floor(time * 8 + ce(character).beatOffset);
}
export {
  V as a,
  H as i,
  Q as n,
  ue as r,
  $ as t,
  de as drawHeadInto,
  headBeat,
};
