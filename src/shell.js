import { j as e } from "./core.js";
import { d as t, n, o as r } from "./cloud.js";
function i(e, t) {
  return e.style?.[t] ?? e.seed;
}
function a(t, n, r) {
  return e(i(t, n), r);
}
function o(e, t = `hair`) {
  let n = e.layout.browV + 0.15,
    r =
      n -
      (n - (e.layout.eyeV - e.layout.zones.eyeL.halfV)) *
        a(e, t, `hairlineClamp`).n();
  return (e) => {
    let t = Math.max(0, Math.min(1, (Math.abs(e) - 0.8) / 0.32));
    return r - 0.62 * t * t * (3 - 2 * t);
  };
}
function s(e, t = {}, n = `hair`) {
  if (t.fixed !== void 0) {
    let e = t.fixed;
    return () => e;
  }
  let r = t.depth ?? 0,
    s = e.layout.browV,
    c = o(e, n),
    l = [0, 0.5, 1][a(e, n, `templeFall`).int(0, 2)],
    u = (e) => {
      if (l === 0) return 0;
      let t = Math.max(0, Math.min(1, (Math.abs(e) - 0.72) / 0.44));
      return l * 0.5 * t * t * (3 - 2 * t);
    },
    d = t.lean ?? 0,
    f = (t) =>
      Math.max(
        s + 0.28 - u(t),
        e.hairlineV +
          r +
          Math.cos(t) * -0.1 +
          Math.sin(t * 2) * 0.025 +
          d * t -
          u(t),
      );
  if (t.wave)
    return (t) =>
      Math.max(c(t), f(t) - 0.05 - 0.05 * Math.sin(t * 5.2 + i(e, n)));
  if (!t.jags) return (e) => Math.max(c(e), f(e));
  let p = a(e, n, `jags`),
    m = 2 + Math.floor(p.n() * 5),
    h = Math.max(0, f(0) - c(0)),
    g = a(e, n, `hairlineCut`).n() < 0.4 ? 1.8 : 1,
    _ = [],
    v = [],
    y = [],
    b = 0;
  for (let e = 0; e < m; e++) {
    _.push((0.1 + p.n() ** 1.6 * 0.8) * g);
    let e = 0.5 + p.n();
    (v.push(e), (b += e), y.push(0.25 + p.n() * 0.5));
  }
  let x = Math.floor(p.n() * m);
  if (((_[x] = Math.max(_[x], (0.45 + p.n() * 0.55) * g)), m >= 3)) {
    if (x === 0 || x === m - 1) {
      let e = 1 + Math.floor(p.n() * (m - 2));
      _[e] = Math.max(_[e], _[x]);
    }
    let e = h > 0 ? Math.min(0.5, 0.24 / h) : 0;
    ((_[0] = Math.min(_[0], e)), (_[m - 1] = Math.min(_[m - 1], e)));
  } else {
    let e = h > 0 ? Math.min(0.5, 0.22 / h) : 0;
    for (let t = 0; t < m; t++) _[t] = Math.min(_[t], e);
  }
  let S = [-1.4];
  for (let e = 0; e < m; e++) S.push(S[e] + (2.8 * v[e]) / b);
  return (e) => {
    let t = 0;
    for (; t < m - 1 && e > S[t + 1];) t++;
    let n = Math.max(0, Math.min(1, (e - S[t]) / (S[t + 1] - S[t]))),
      r = y[t],
      i = n < r ? n / r : (1 - n) / (1 - r);
    return Math.max(c(e), f(e) - _[t] * h * i);
  };
}
var c = (e) => {
  let t = Math.max(0, Math.min(1, e));
  return t * t * (3 - 2 * t);
};
function l(e, t) {
  let n = new Float32Array(e.cloud.xyz);
  for (let e = 1; e < n.length; e += 3) n[e] > t && (n[e] = t);
  return { ...e, cloud: { xyz: n, n: e.cloud.n } };
}
function u(e, t, n = {}, i = `hair`) {
  let a = s(e, n, i);
  return {
    bottom: a,
    thickness: t,
    cloud: r(e.head, {
      nu: 144,
      nv: 16,
      vFrom: a,
      vTo: Math.PI / 2,
      thickness: (e, n) => {
        let r = Math.max(0, Math.min(1, (n - a(e)) / 0.4));
        return t * (0.28 + 0.72 * r * r * (3 - 2 * r));
      },
    }),
  };
}
var d = 1.24;
function f(e, t) {
  let n = e.head;
  return Math.min(d, Math.max(n.rx, n.rz, n.ry * 0.86) * t.extent);
}
function p(e, t) {
  let n = f(e, t),
    r = 1 + 0.1 * t.outOfRound;
  return { top: n * t.higher + n * t.high * r + 0.07, side: n * r + 0.07 };
}
function m(e, t) {
  if (e.wedge === 0) return () => 1;
  let n = Math.max(0.5, t),
    r = (e) => Math.max(0, Math.min(1, e));
  return (t) => {
    let i = t / n;
    return e.wedge > 0
      ? 1 - e.wedge * r((i - 0.35) / 0.6)
      : 1 + e.wedge * r((0.72 - i) / 0.95);
  };
}
function h(e, i, o = {}) {
  let l = s(e, o),
    u = e.head,
    d = f(e, i),
    p = d * i.high,
    h = d * i.higher,
    g = m(i, p),
    _ = a(e, `hair`, `afroBumps`),
    v = _.range(0, 6.2832),
    y = _.range(0, 6.2832),
    b = _.range(0, 6.2832),
    x = (e) => {
      let t = c((Math.abs(e) - 0.85) / 0.5);
      return Math.min(l(e), l(e) * (1 - t) + i.deep * t);
    },
    S = (e, r) => {
      let a = t(e, r, u),
        o = n(e, r, u),
        s =
          1 +
          i.outOfRound *
            (0.06 * Math.sin(e * 1.7 + v) +
              0.045 * Math.sin(r * 2.4 + y) +
              0.03 * Math.sin(e * 3.1 + r * 2.2 + b)),
        l = p * s,
        f = a.y - h,
        m = 0;
      for (let e = 0; e < 3; e++) {
        let e = d * s * g(a.y + o.y * m),
          t = (o.x * o.x + o.z * o.z) / (e * e) + (o.y * o.y) / (l * l),
          n = 2 * ((a.x * o.x + a.z * o.z) / (e * e) + (f * o.y) / (l * l)),
          r = (a.x * a.x + a.z * a.z) / (e * e) + (f * f) / (l * l) - 1,
          c = n * n - 4 * t * r;
        if (((m = c > 0 ? (-n + Math.sqrt(c)) / (2 * t) : 0), i.wedge === 0))
          break;
      }
      return Math.max(0.05, m) * (0.55 + 0.45 * c((r - x(e)) / 0.3));
    };
  return {
    bottom: l,
    masses: x,
    thickness: d * 0.3,
    thicknessFrom: S,
    cloud: r(u, { nu: 64, nv: 16, vFrom: x, vTo: Math.PI / 2, thickness: S }),
  };
}
export {
  p as a,
  l as c,
  f as i,
  i as l,
  s as n,
  h as o,
  m as r,
  u as s,
  o as t,
  a as u,
};
