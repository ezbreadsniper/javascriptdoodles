import "./core.js";
import { c as e, d as t, f as n, l as r } from "./cloud.js";
import { n as i } from "./field.js";
import { t as a } from "./palette.js";
import { t as o } from "./pen.js";
import {
  SHIRT_COLLARS as Y,
  shirtTrim as X,
  tailor as J,
  wornCollar as Z,
} from "./collars.js";
var s = 1.86,
  c = 1.74,
  l = 0.3,
  u = 0.15,
  d = 0.32,
  f = 20;
function p(e) {
  let t = e.range(-0.13, 0.13),
    n = e.range(0.26, 0.36),
    r = e.range(0.9, 1.12),
    i = e.range(0.16, 0.36),
    a = e.range(1.04, 1.14),
    o = e.int(7, 12),
    s = [];
  for (let t = 0; t < f; t++)
    s.push({
      t: e.range(-0.34, 0.34),
      top: e.range(0.06, 0.16),
      bottom: e.range(0.78, 0.96),
    });
  let c = e.n() < 0.25 ? e.int(0, o - 1) : -1,
    l = e.range(0.17, 0.25),
    u = e.range(0.2, 0.33),
    d = e.range(-0.06, 0.06);
  return {
    fit: t,
    deep: n,
    wide: r,
    height: i,
    widening: a,
    ribs: s.slice(0, o),
    gap: c,
    point: l,
    opening: u,
    crooked: d,
  };
}
var m = {
    fit: 0,
    deep: 0.31,
    wide: 1,
    height: 0.22,
    widening: 1.09,
    ribs: Array.from({ length: 14 }, (e, t) => ({
      t: Math.sin(t * 2.4) * 0.3,
      top: 0.11,
      bottom: 0.87 + Math.cos(t * 1.7) * 0.06,
    })),
    gap: -1,
    point: 0.21,
    opening: 0.26,
    crooked: 0.03,
  },
  h = { hem: [], back: () => {}, front: () => {} };
function g(i, o, f, p, m, g, _) {
  if (i === `none`) return h;
  ({ palette: f, params: p } = J(i, f, p));
  let { head: v, pose: y, F: b } = o,
    x = v.ry,
    S = t(0, -1.22, v),
    C = i === `knit` ? p.height : Y.has(i) ? 0.055 + p.height * 0.12 : 0,
    w = i === `knit` ? Math.max(0, p.height - 0.16) : 0,
    T = { x: 0, y: Math.min(S.y - x * 0.06, S.y - x * p.deep + C), z: 0 },
    E =
      g * (Y.has(i) ? 2.1 : i === `knit` ? 1.28 + w * 1.3 : 1.6) * p.wide,
    D = E * 0.7,
    O = r({ yaw: y.yaw * l + p.fit, pitch: y.pitch * u, roll: y.roll * d }),
    k = 0,
    A = (t, r = 0, i = 0) => {
      let a = e(O, {
          x: Math.sin(t) * (E + i),
          y: r,
          z: Math.cos(t) * (D + i),
        }),
        o = n({ x: T.x + a.x, y: T.y + a.y, z: T.z + a.z }, b);
      return { x: o.x + m, y: o.y + k };
    };
  k = Math.max(0, _ + x * 0.1 - A(0).y);
  let j = (e, t, n = 0, r = 0, i = 18) => {
      let a = [];
      for (let o = 0; o <= i; o++) a.push(A(e + ((t - e) * o) / i, n, r));
      return a;
    },
    M = f.clothDark,
    N = {
      colour: M ? a : f.ink,
      coverage: M ? 0.42 : 0.55,
      singleLayer: !0,
      calm: !0,
    },
    P = { colour: M ? a : f.ink, coverage: M ? 0.5 : 0.9 },
    F = (e, t, n, r) => {
      e.surface(t, { colour: n, trace: r, wobble: 0.004, slab: `cloth` });
    },
    I = (e, t, n = 0) => {
      let r = [];
      for (let e = 0; e <= 20; e++) {
        let i = 1.5708 - (3.1416 * e) / 20;
        r.push(A(i, -t * (1 - n * (1 - Math.max(0, Math.cos(i))))));
      }
      F(
        e,
        [...j(-1.5708, -4.7124, 0, 0, 20), ...r],
        f.clothDeep,
        `collar-base`,
      );
    },
    K = {
      at: A,
      arc: j,
      fill: F,
      lining: I,
      ry: x,
      radius: E,
      params: p,
      palette: f,
      soft: N,
      edge: P,
      neck: g,
      chin: _,
    },
    W = Z(i, K);
  if (W) return W;
  if (i === `round` || i === `v`) {
    let e =
      i === `round`
        ? j(-1.86, s)
        : [
            ...j(-1.86, -0.5, 0, 0, 8),
            A(0, -x * (0.1 + p.point * 0.4)),
            ...j(0.5, s, 0, 0, 8),
          ];
    return {
      hem: e,
      back: () => {},
      front: (t) => {
        t.stroke(e, {
          trace: `collar`,
          w: 0.022,
          wobble: 0.004,
          colour: f.ink,
          square: i === `v`,
        });
      },
    };
  }
  if (i === `knit`) {
    let e = C,
      t = E * 0.34,
      n = 0.44,
      r = (e) => {
        let r = Math.min(1, Math.max(0, e)),
          i = r < n ? 0.5 * (1 - Math.cos((6.2832 * r) / n)) : 0;
        return t * (i + (0.12 + (p.widening - 1) * 1.6 + w * 1.4) * r);
      },
      i = (t, n) => A(t, -e * n, r(n)),
      a = (e, t = !1) => {
        let n = [];
        for (let t = 0; t <= 6; t++) n.push(i(e, t / 6));
        return t ? n.reverse() : n;
      },
      o = j(-1.86, s),
      l = j(s, -1.86, -e, r(1));
    return {
      hem: o,
      back: (t) => {
        (I(t, e * 0.94),
          t.stroke(j(c, 4.5432, 0, 0, 14), {
            trace: `collar-back`,
            w: 0.02,
            wobble: 0.003,
            colour: f.ink,
            coverage: 0.8,
          }));
      },
      front: (t) => {
        (F(t, [...o, ...a(s), ...l, ...a(-1.86, !0)], f.cloth, `collar`),
          t.stroke(o, {
            trace: `collar`,
            w: 0.022,
            wobble: 0.004,
            colour: f.ink,
          }));
        for (let e of [-1, 1])
          t.stroke(a(e * s), {
            trace: `collar-flank${e}`,
            w: 0.027,
            wobble: 0.004,
            colour: f.ink,
            pointed: 0.35,
          });
        t.stroke(j(-1.86 * 0.93, s * 0.93, -e * 0.16, r(0.16)), {
          trace: `collar-roll`,
          w: 0.013,
          ...N,
        });
        let n = p.ribs.length;
        for (let [e, r] of p.ribs.entries()) {
          if (e === p.gap) continue;
          let a = -1.86 + ((e + 0.5 + r.t) / n) * 2 * s,
            o = [];
          for (let e = 0; e <= 3; e++)
            o.push(i(a, r.top + ((r.bottom - r.top) * e) / 3));
          t.stroke(o, { trace: `rib${e}`, w: 0.012, wobble: 0.002, ...N });
        }
      },
    };
  }
  let L = C,
    R = L * 0.32,
    z = p.opening,
    B = x * p.point,
    V = (e) => [...j(e * z, e * s, 0, 0, 10), ...j(e * s, e * z, -L, R, 10)],
    H = (e) => {
      let t = 1 + e * p.crooked;
      return [
        A(e * z * 0.95, 0),
        ...j(e * z * 0.95, e * 1.62 * t, 0, 0, 6),
        A(e * 1.42 * t, -L * 0.5, E * 0.4),
        A(e * z * 0.8, -B * t, E * 0.22),
      ];
    },
    U = A(0, -B * 1.15),
    Q = X(i, K, { spread: z, depth: B });
  return {
    hem: Q
      ? j(-1.86, s, 0, 0, 20)
      : [...j(-1.86, -z * 0.9, 0, 0, 10), U, ...j(z * 0.9, s, 0, 0, 10)],
    back: (e) => {
      let t = L * 0.95,
        n = Math.max(t, B * 1.02);
      (I(e, n, 1 - t / n),
        e.stroke(j(c, 4.5432, 0, 0, 14), {
          trace: `collar-back`,
          w: 0.02,
          wobble: 0.003,
          colour: f.ink,
          coverage: 0.8,
        }));
    },
    front: (e) => {
      for (let t of [-1, 1]) F(e, V(t), f.clothDeep, `bridge${t}`);
      Q && Q.under(e);
      for (let t of [-1, 1]) {
        let n = H(t);
        (F(e, n, f.cloth, `mirror${t}`),
          e.stroke([...n, n[0]], {
            trace: `mirror${t}`,
            w: 0.019,
            wobble: 0.003,
            square: !0,
            ...P,
          }));
      }
      if (Q) return Q.over(e);
      e.stroke([A(-z * 0.9, 0), U, A(z * 0.9, 0)], {
        trace: `collar-opening`,
        w: 0.017,
        wobble: 0.003,
        square: !0,
        ...P,
      });
    },
  };
}
function _(e, t, n, r) {
  let i = r;
  for (let r of e)
    Math.abs(r.y - t) > 0.05 || ((n > 0 ? r.x > i : r.x < i) && (i = r.x));
  return i;
}
function v(e, t, n, r, i, a) {
  if (t.nz < -0.15) return;
  let o = n,
    s = t.x >= 0 ? 1 : -1,
    c = Math.max(0, s * (_(a, t.y, s, t.x) - t.x)),
    l = o,
    u = c + o * 0.12,
    d = (e, n = 0) =>
      t.to(0, Math.sin(e) * o * 0.86, Math.cos(e) * (l + u) - u - n),
    f = [d(-1.5708, o * 0.7)];
  for (let e = 0; e <= 24; e++) f.push(d(-1.5708 + (3.1416 * e) / 24));
  f.push(d(1.5708, o * 0.7));
  let p = [];
  for (let e = 0; e <= 4; e++)
    p.push(t.to(0, o * 0.86 * (1 - e / 2), -u - o * 0.9));
  e.surface([...f, ...p], { colour: r.skin, dry: !0 });
  let m = Math.min(o * 0.5, c),
    h = (e) => s * (_(a, e.y, s, e.x) - e.x) - m,
    g = [];
  for (let e = 0; e < f.length; e++) {
    let t = f[e],
      n = h(t);
    n <= 0 && g.push(t);
    let r = f[e + 1];
    if (!r) break;
    let i = h(r);
    if (n <= 0 == i <= 0) continue;
    let a = n / (n - i);
    g.push({ x: t.x + (r.x - t.x) * a, y: t.y + (r.y - t.y) * a });
  }
  if (g.length < 3) return;
  e.stroke(g, { trace: `ear${i}`, w: 0.022, wobble: 0.004, colour: r.ink });
  let v = (l - c) / 2,
    y = (l + c) / 2,
    b = [];
  for (let e = 0; e <= 5; e++) {
    let n = -1.1 + (e / 5) * 2.2;
    b.push(t.to(0, Math.sin(n) * o * 0.46, v + Math.cos(n) * y * 0.5));
  }
  e.stroke(b, {
    trace: `ear-inner${i}`,
    w: 0.014,
    wobble: 0.003,
    colour: r.ink,
    coverage: 0.55,
    singleLayer: !0,
  });
}
function y(e, t, n, r) {
  let { rx: i, ry: a } = n.head;
  e.surface(t, { colour: r.skin, trace: `head`, wobble: 0.005 });
  let o = -n.pose.yaw * i * 0.9 - i * 0.25,
    s = -a * 0.35,
    c = e.ctx.createRadialGradient(
      o,
      s,
      i * 0.2,
      o * 0.4,
      s * 0.2,
      Math.max(i, a) * 1.55,
    );
  (c.addColorStop(0, `rgba(0,0,0,0)`),
    c.addColorStop(0.62, `rgba(0,0,0,0)`),
    c.addColorStop(1, r.shadow),
    e.surface(t, { colour: c, trace: `head`, wobble: 0.005 }));
}
function b(e, t, n) {
  e.stroke(t, {
    trace: `head`,
    w: 0.03,
    wobble: 0.006,
    closed: !0,
    colour: n.ink,
    pointed: 0.4,
  });
}
function x(e, t) {
  return [i(-1.48, t, e), i(1.48, t, e)];
}
function S(e, r, i, a, s, c = 1, l = m) {
  let { head: u, F: d } = r,
    f = u.ry,
    p = -1.22,
    h = -1 / 0;
  for (let e of i) e.y > h && (h = e.y);
  let _ = 0,
    v = 0;
  for (let e of i) e.y < h - f * 0.06 || ((_ += e.x), v++);
  let y = (v > 0 ? _ / v : 0) * 0.35,
    b = Math.abs(t(0.3, p, u).x) * c,
    x = Math.abs(n(t(0.3, p, u), d).x) * c,
    S = n(t(0, p, u), d).y + f * 0.24,
    C = h - f * 0.12,
    w = g(a, r, s, l, y, b, h),
    T = { l: y - x, r: y + x },
    E = w.hem.length
      ? o(w.hem, !1, a !== `v`).filter((e) => e.x > T.l && e.x < T.r)
      : [],
    D = E.length >= 2 ? 0 : Math.max(S, h + f * 0.08),
    O = E.length >= 2 ? E[0] : { x: T.l - 0.01, y: D },
    k = E.length >= 2 ? E[E.length - 1] : { x: T.r + 0.01, y: D };
  (w.back(e),
    e.surface(
      [{ x: T.l, y: C }, { x: T.r, y: C }, k, ...E.slice().reverse(), O],
      { colour: s.skin, square: !0, dry: !0 },
    ));
  let A = h - f * 0.05;
  (e.stroke([{ x: T.l, y: A }, O], {
    trace: `neck-l`,
    w: 0.022,
    wobble: 0.004,
    colour: s.ink,
  }),
    e.stroke([{ x: T.r, y: A }, k], {
      trace: `neck-r`,
      w: 0.022,
      wobble: 0.004,
      colour: s.ink,
    }),
    w.front(e));
}
export { v as a, y as i, S as n, p as o, b as r, x as t };
