import { j as e } from "./core.js";
import { a as t, f as n, i as r, r as i, u as a } from "./cloud.js";
import { n as o } from "./field.js";
import { t as s } from "./palette.js";
import { u as c } from "./shell.js";
function l(e, n, a, o = {}) {
  let s = t(n.cloud, e.m, { bins: 84, arcAround: -Math.PI / 2, behind: a });
  if (s.length < 4) return { outer: [], hairline: [], polygon: [] };
  let [c, l] = r(e.head, n.bottom, e.m),
    d = 0.06,
    h = [];
  for (let t = 0; t <= 80; t++) {
    let r = c - d + ((l - c + 2 * d) * t) / 80;
    h.push(i(e.head, r, n.bottom(r), 0, e.m));
  }
  let g = p(s, h, a, n.thickness),
    _ = m(h, g),
    v = (e, t) => Math.hypot(e.x - t.x, e.y - t.y),
    y = (e) => {
      let t = f(g, e);
      return {
        n: t,
        gap: Math.max(
          v(t.outer[t.outer.length - 1], t.hairline[0]),
          v(t.outer[0], t.hairline[t.hairline.length - 1]),
        ),
      };
    },
    b = y(_),
    x = y([..._].reverse()),
    S = (x.gap < b.gap ? x : b).n,
    C = o.tip === !1 ? S.outer : u(S.outer, S.hairline, n.thickness * 2.5);
  return { outer: C, hairline: S.hairline, polygon: C.concat(S.hairline) };
}
function u(e, t, n) {
  if (e.length < 3 || t.length < 2) return e;
  let r = (e, t, r) => {
      let i = Math.hypot(r.x - e.x, r.y - e.y);
      if (i < 0.03 || i > n) return [];
      let a = e.x - t.x,
        o = e.y - t.y,
        s = Math.hypot(a, o) || 1;
      if (((a /= s), (o /= s), o < 0.2)) {
        o = 0.2;
        let e = Math.hypot(a, o);
        ((a /= e), (o /= e));
      }
      let c = { x: e.x + a * i * 0.75, y: e.y + o * i * 0.75 },
        l = [];
      for (let t = 1; t < 6; t++) {
        let n = t / 6,
          i = (1 - n) * (1 - n),
          a = 2 * (1 - n) * n,
          o = n * n;
        l.push({
          x: i * e.x + a * c.x + o * r.x,
          y: i * e.y + a * c.y + o * r.y,
        });
      }
      return l;
    },
    i = r(e[e.length - 1], e[e.length - 2], t[0]);
  return r(e[0], e[1], t[t.length - 1])
    .reverse()
    .concat(e, i);
}
var d = 0.003025;
function f(e, t) {
  let n = Math.min(26, Math.floor(Math.min(e.length, t.length) / 3));
  if (n < 3) return { outer: e, hairline: t };
  let r = (e, t) => (e.x - t.x) ** 2 + (e.y - t.y) ** 2,
    i = (n, i, a, o, s) => {
      let c = n,
        l = a,
        u = 1 / 0,
        f = -1 / 0;
      for (let p = n; p < i; p++)
        for (let n = a; n < o; n++) {
          let i = r(e[p], t[n]);
          if (i < d) {
            let e = s ? p - n : n - p;
            e > f && ((f = e), (c = p), (l = n));
          } else f === -1 / 0 && i < u && ((u = i), (c = p), (l = n));
        }
      return [c, l];
    },
    [a, o] = i(e.length - n, e.length, 0, n, !0),
    [s, c] = i(0, n, t.length - n, t.length, !1);
  return a <= s + 3 || c <= o + 3
    ? { outer: e, hairline: t }
    : { outer: e.slice(s, a + 1), hairline: t.slice(o, c + 1) };
}
function p(e, t, n, r) {
  if (e.length < 6 || t.length < 4 || n.length < 8) return e;
  let i = e.map((e) => Math.atan2(e.y, e.x)),
    a = new Map();
  for (let e of x(n, i)) a.set(e.i, Math.hypot(e.p.x, e.p.y));
  let o = (t) => {
      let n = a.get(t);
      if (n === void 0) return !1;
      let r = e[t];
      return Math.hypot(r.x, r.y) < n - 0.02;
    },
    s = Math.max(d, (r * 1.4 + 0.02) ** 2),
    c = (n) => {
      let r = e[n];
      for (let e of t) if ((r.x - e.x) ** 2 + (r.y - e.y) ** 2 < s) return !0;
      return !1;
    },
    l = (e) => o(e) && c(e),
    u = 0;
  for (; u < e.length - 4 && l(u);) u++;
  let f = e.length - 1;
  for (; f > u + 4 && l(f);) f--;
  return u === 0 && f === e.length - 1 ? e : e.slice(u, f + 1);
}
function m(e, t) {
  if (e.length < 4) return e;
  let n = e.map((e) => Math.atan2(e.y, e.x)),
    r = new Map();
  for (let e of x(t, n)) r.set(e.i, Math.hypot(e.p.x, e.p.y));
  let i = (t) => {
      let n = r.get(t);
      return n !== void 0 && Math.hypot(e[t].x, e[t].y) <= n + 0.004;
    },
    a = 0;
  for (; a < e.length && !i(a);) a++;
  let o = e.length - 1;
  for (; o > a && !i(o);) o--;
  return o - a < 3 ? e : e.slice(a, o + 1);
}
var h = (e, t, n, r = 0) => i(e.head, t, n, r, e.m);
function g(e, t, r, i) {
  let o = n(a({ x: t, y: r, z: i }, e.pose), e.F);
  return { x: o.x, y: o.y };
}
function _(e, t, n, r, i, a, o) {
  let s = l(t, n, r);
  return s.polygon.length < 4
    ? s
    : (e.surface(s.polygon, { colour: i, trace: o, wobble: 0.006 }),
      e.stroke(s.outer, {
        trace: `${o}-edge`,
        w: 0.024,
        wobble: 0.005,
        colour: a.ink,
        coverage: 0.75,
      }),
      e.stroke(s.hairline, {
        trace: `${o}-hairline`,
        w: 0.02,
        wobble: 0.004,
        colour: a.ink,
        coverage: 0.7,
        square: !0,
      }),
      s);
}
function v(t, n, r, i, a, c) {
  let l = e(c, `strands`),
    u = (e) => {
      let t = r.bottom(e);
      return o(e, t + (1.3 - t) * 0.5, n).nz > 0.12;
    };
  for (let [e, o] of a.entries()) {
    if (!u(o)) continue;
    let a = l.chance(0.4);
    if (
      (t.stroke(y(n, r, o, 0, 1), {
        trace: `strand${e}`,
        w: 0.018,
        wobble: 0.002,
        colour: a ? s : i.skin,
        coverage: a ? 0.5 : 0.28,
        singleLayer: !0,
        calm: !0,
      }),
      l.n() > 0.72)
    )
      continue;
    let c = (l.n() < 0.5 ? -1 : 1) * l.range(0.035, 0.085);
    u(o + c) &&
      t.stroke(y(n, r, o + c, l.range(0.06, 0.3), l.range(0.72, 0.95)), {
        trace: `strand-d${e}`,
        w: 0.022,
        wobble: 0.002,
        colour: i.ink,
        coverage: 0.68,
        pointed: 0.85,
        calm: !0,
      });
  }
}
function y(e, t, n, r, i) {
  let a = t.bottom(n),
    o = Math.max(0.25, Math.cos(a)),
    s = [];
  for (let c = 0; c <= 5; c++) {
    let l = r + ((i - r) * c) / 5,
      u = a + (1.3 - a) * l;
    s.push(h(e, n + l * 0.3 * (Math.cos(u) / o), u, t.thickness * 0.7));
  }
  return s;
}
function b(e, t, n, r, i, a = 0.45) {
  let o = [];
  for (let s = 0; s <= 14; s++) {
    let c = r + (n * i * s) / 14,
      l = t * (a + (1 - a) * (s / 14));
    o.push({ x: e.x + Math.cos(c) * l, y: e.y + Math.sin(c) * l * 0.85 });
  }
  return o;
}
function x(e, t) {
  let n = e.length,
    r = [];
  if (n < 3) return r;
  let i = e.map((e) => Math.atan2(e.y, e.x)),
    a = (e, t) => {
      let n = e - t;
      for (; n > Math.PI;) n -= 2 * Math.PI;
      for (; n < -Math.PI;) n += 2 * Math.PI;
      return n;
    };
  for (let [o, s] of t.entries()) {
    let t = -1,
      c = 0,
      l = 1 / 0;
    for (let e = 0; e < n - 1; e++) {
      let n = a(s, i[e]),
        r = a(s, i[e + 1]);
      if (n === 0 || n > 0 != r > 0) {
        let i = Math.abs(n) + Math.abs(r);
        if (i > Math.PI) continue;
        let a = i > 0 ? Math.abs(n) / i : 0,
          o = Math.abs(n);
        o < l && ((l = o), (t = e), (c = a));
      }
    }
    if (t < 0) continue;
    let u = e[t],
      d = e[t + 1],
      f = { x: u.x + (d.x - u.x) * c, y: u.y + (d.y - u.y) * c },
      p = Math.hypot(f.x, f.y) || 1;
    r.push({ i: o, p: f, n: { x: f.x / p, y: f.y / p } });
  }
  return r;
}
var S = [`ball`, `tower`, `cloud`, `short`, `triangle`, `mushroom`];
function C(e, t) {
  if (t)
    return {
      kind: `overlay`,
      extent: 1.02,
      high: 1,
      outOfRound: 0.4,
      wedge: 0,
      higher: 0,
      deep: -0.12,
    };
  let n = c(e, `hair`, `afroKind`),
    r = n.weighted([
      [`ball`, 0.26],
      [`tower`, 0.16],
      [`cloud`, 0.18],
      [`short`, 0.12],
      [`triangle`, 0.14],
      [`mushroom`, 0.14],
    ]);
  return r === `ball`
    ? {
        kind: r,
        extent: n.range(1.6, 2),
        high: n.range(0.98, 1.08),
        outOfRound: n.range(0.28, 0.6),
        wedge: 0,
        higher: n.range(0, 0.08),
        deep: n.range(-0.86, -0.62),
      }
    : r === `tower`
      ? {
          kind: r,
          extent: n.range(1.15, 1.38),
          high: n.range(1, 1.08),
          outOfRound: n.range(0.3, 0.8),
          wedge: 0,
          higher: n.range(0.2, 0.32),
          deep: n.range(-0.55, -0.4),
        }
      : r === `cloud`
        ? {
            kind: r,
            extent: n.range(1.4, 1.62),
            high: n.range(0.86, 0.96),
            outOfRound: n.range(0.9, 1.35),
            wedge: 0,
            higher: n.range(-0.04, 0.1),
            deep: n.range(-0.46, -0.32),
          }
        : r === `triangle`
          ? {
              kind: r,
              extent: n.range(1.6, 2),
              high: n.range(1, 1.14),
              outOfRound: n.range(0.3, 0.75),
              wedge: n.range(0.46, 0.74),
              higher: n.range(0, 0.08),
              deep: n.range(-0.9, -0.7),
            }
          : r === `mushroom`
            ? {
                kind: r,
                extent: n.range(1.6, 2),
                high: n.range(0.94, 1.06),
                outOfRound: n.range(0.3, 0.8),
                wedge: n.range(-0.7, -0.44),
                higher: n.range(0.06, 0.18),
                deep: n.range(-0.72, -0.52),
              }
            : {
                kind: r,
                extent: n.range(1.2, 1.4),
                high: n.range(0.9, 1.02),
                outOfRound: n.range(0.6, 1.1),
                wedge: 0,
                higher: n.range(0, 0.12),
                deep: n.range(-0.3, -0.18),
              };
}
function w(t, n) {
  let r = e(n, `afroRoughing`),
    i = r.range(0, 6.2832),
    a = r.range(0, 6.2832),
    o = r.range(0, 6.2832);
  return t.map((e) => {
    let t = Math.atan2(e.y, e.x),
      n =
        1 +
        0.028 * Math.sin(t * 9 + i) +
        0.02 * Math.sin(t * 17 + a) +
        0.013 * Math.sin(t * 29 + o);
    return { x: e.x * n, y: e.y * n };
  });
}
function T(e, t) {
  let n = t.length;
  if (n < 8) return e;
  let r = (e) => {
      let r = Math.floor(((Math.atan2(e.y, e.x) + Math.PI) / 6.283185307) * n);
      r < 0 ? (r = 0) : r >= n && (r = n - 1);
      let i = t[r];
      return Math.hypot(i.x, i.y);
    },
    i = (e) => Math.hypot(e.x, e.y) <= r(e) + 0.012,
    a = -1,
    o = -1;
  for (let t = 0; t < e.length; t++) i(e[t]) || (a < 0 && (a = t), (o = t));
  let s = (e) => {
    let t = Math.hypot(e.x, e.y),
      n = r(e);
    if (t >= n) return e;
    let i = n / (t || 1);
    return { x: e.x * i, y: e.y * i };
  };
  return a < 0 ? e.map(s) : E(e.slice(a, o + 1).map(s), r);
}
function E(e, t) {
  if (e.length < 3) return e;
  let n = (n, r) => {
      let i = Math.atan2(r.y, r.x),
        a = i - Math.atan2(n.y, n.x);
      for (; a > Math.PI;) a -= 2 * Math.PI;
      for (; a < -Math.PI;) a += 2 * Math.PI;
      if (a === 0 || (e.length + 1) * Math.abs(a) >= 2 * Math.PI) return;
      let o = Math.cos(i + a),
        s = Math.sin(i + a),
        c = t({ x: o, y: s }) * 0.985;
      return { x: o * c, y: s * c };
    },
    r = n(e[1], e[0]),
    i = n(e[e.length - 2], e[e.length - 1]);
  return [...(r ? [r] : []), ...e, ...(i ? [i] : [])];
}
function D(e, t, n, a) {
  let o = { outer: [], hairline: [], polygon: [] },
    s = O(e, t, n, a);
  if (s.length < 6) return o;
  let [c, l] = r(e.head, t.bottom, e.m),
    u = [];
  for (let n = 0; n <= 64; n++) {
    let r = c + ((l - c) * n) / 64;
    u.push(i(e.head, r, t.bottom(r), 0, e.m));
  }
  let d = (e, t) => Math.hypot(e.x - t.x, e.y - t.y),
    f = s[s.length - 1],
    p = d(f, u[u.length - 1]) <= d(f, u[0]) ? [...u].reverse() : u,
    m = (e) => {
      let t = Math.atan2(e.y, e.x) + Math.PI / 2;
      for (; t > Math.PI;) t -= 2 * Math.PI;
      for (; t < -Math.PI;) t += 2 * Math.PI;
      return t;
    },
    h = m(p[0]),
    g = m(p[p.length - 1]),
    _ = Math.min(h, g),
    v = Math.max(h, g),
    y = s.filter((e) => {
      let t = m(e);
      return t >= _ && t <= v;
    });
  return y.length < 4
    ? { outer: s, hairline: p, polygon: [] }
    : {
        outer: s,
        hairline: p,
        polygon: (d(y[y.length - 1], p[0]) <= d(y[0], p[0])
          ? y
          : [...y].reverse()
        ).concat(p),
      };
}
function O(e, n, r, i) {
  let a = t(n.cloud, e.m, { bins: 96, arcAround: -Math.PI / 2, behind: r });
  return a.length < 6 ? [] : T(w(a, i), r);
}
function k(t, n, r, i) {
  let a = [];
  for (let e = 0; e < 36; e++)
    a.push(-Math.PI + ((e + 0.5) / 36) * 2 * Math.PI);
  let o = e(i, `afroFringe`),
    s = a.map(() => ({ len: o.range(0.022, 0.055), tilt: o.range(-0.6, 0.6) }));
  for (let e of x(n, a)) {
    let { len: n, tilt: i } = s[e.i],
      a = Math.cos(i),
      o = Math.sin(i),
      c = e.n.x * a - e.n.y * o,
      l = e.n.x * o + e.n.y * a;
    t.stroke([e.p, { x: e.p.x + c * n, y: e.p.y + l * n }], {
      trace: `fringe${e.i}`,
      w: 0.012,
      wobble: 0.003,
      colour: r.hair,
      pointed: 1,
      singleLayer: !0,
    });
  }
}
function A(t, n, r, i, a) {
  let c = e(a, `afroCurl`),
    l = c.chance(0.5) ? 1 : -1,
    u = r.thicknessFrom ?? (() => r.thickness),
    d = r.masses ?? r.bottom,
    f = [];
  for (let e = 0; e < 15; e++)
    for (let t = 0; t < 5; t++) {
      let n = -Math.PI + ((e + 0.5 + c.range(-0.35, 0.35)) / 15) * 2 * Math.PI,
        r = d(n),
        i = r + (1.46 - r) * ((t + 0.5 + c.range(-0.3, 0.3)) / 5);
      f.push({
        u: n,
        v: i,
        r: 0.032 * c.range(0.6, 1.4),
        a0: c.range(0, 6.2832),
        arc: c.range(3.6, 5.4),
      });
    }
  let p = i.hairDark,
    m = {
      w: 0.013,
      wobble: 0.002,
      colour: p ? s : i.ink,
      coverage: p ? 0.34 : 0.5,
      singleLayer: !0,
      calm: !0,
    };
  for (let [e, r] of f.entries()) {
    if (r.v <= d(r.u) || r.v >= 1.5 || o(r.u, r.v, n).nz < 0.12) continue;
    let i = h(n, r.u, r.v, u(r.u, r.v) * 0.92);
    t.stroke(b(i, r.r, l, r.a0, r.arc), { trace: `coil${e}`, ...m });
  }
}
export {
  A as a,
  g as c,
  b as d,
  v as f,
  k as i,
  l,
  O as n,
  D as o,
  _ as p,
  C as r,
  h as s,
  S as t,
  x as u,
};
