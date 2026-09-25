import { k as e } from "./core-Calr4rc2.js";
import { d as t, f as n, u as r } from "./cloud-D0bWzE4O.js";
import { n as i } from "./field-Byd-702U.js";
import { l as a, o } from "./palette-4j4QC37X.js";
import { t as s } from "./pen-DmOxfjFV.js";
function c(e, t, n) {
  let r = i(t.u, t.v, e),
    a = i(t.u, t.v + t.halfV, e),
    o = i(t.u + t.halfU, t.v, e),
    s = (Math.hypot(a.x - r.x, a.y - r.y) / Math.max(0.4, r.fy)) * n,
    c = (Math.hypot(o.x - r.x, o.y - r.y) / Math.max(0.4, r.fx)) * n;
  return { f: r, width: c, height: s, mass: Math.min(c, s) };
}
function l(e, t, n, r = 0.42) {
  let a = e;
  for (let e = 0; e < 14 && i(a, t, n).nz < r; e++) a *= 0.9;
  return a;
}
var u = 0.027;
function d(e) {
  let t = e.n() < 0.42 ? 4 : 5,
    n = [],
    r = [];
  for (let i = 0; i < t; i++)
    (n.push(e.range(0.8, 1.12)), r.push(e.range(-0.14, 0.14)));
  return { jags: t, lengths: n, offset: r, inner: e.range(0.34, 0.48) };
}
function f(t) {
  return e(t, 0.44, 0.72, 0.36, 0.92);
}
function p(t) {
  let n = d(t),
    r = a(t.n()),
    i = e(t, 1, 1.8, 0.82, 2.25),
    o = [i * t.range(0.78, 1.14), i * t.range(0.78, 1.14)];
  return { shapes: [n, n], large: o, colour: r, second: n };
}
function m(e, t) {
  return e.jags !== 4 || t.jags !== 4
    ? [e, t]
    : [
        e,
        {
          ...t,
          jags: 5,
          lengths: [...t.lengths, (t.lengths[0] + t.lengths[2]) / 2],
          offset: [...t.offset, -t.offset[1]],
        },
      ];
}
function h(e) {
  let t = d(e),
    n = f(e),
    r = p(e);
  return { shapes: m(t, r.second), size: n, large: r.large, colour: r.colour };
}
var g = {
    line: [
      [-0.5, -0.04],
      [0, 0.06],
      [0.5, -0.02],
    ],
    smile: [
      [-0.5, -0.26],
      [0, 0.44],
      [0.5, -0.22],
    ],
    small: [
      [-0.26, -0.1],
      [0, 0.22],
      [0.26, -0.08],
    ],
    wave: [
      [-0.5, 0.1],
      [-0.16, -0.18],
      [0.16, 0.2],
      [0.5, -0.1],
    ],
    crooked: [
      [-0.5, 0.06],
      [-0.14, 0.2],
      [0.24, 0.02],
      [0.5, -0.34],
    ],
    grin: [
      [-0.52, -0.26],
      [0, 0.46],
      [0.52, -0.22],
    ],
  },
  _ = [`line`, `smile`, `small`];
function v(e) {
  return {
    underlay: e.pick(_),
    width: e.range(0.84, 1.26),
    height: e.range(0.82, 1.22),
    notch: e.range(0.35, 0.85),
  };
}
var y = 0.38,
  b = -0.09,
  x = 0.24,
  S = 0.22,
  C = 0.24,
  w = [
    -0.38, -0.32, -0.26, -0.19, -0.12, -0.06, 0, 0.06, 0.12, 0.19, 0.26, 0.32,
    0.38,
  ];
function T(e) {
  return [
    ...w.map((t) => {
      let n = Math.min(1, Math.abs(t) / y),
        r = b - x * (1 - n * n) ** 0.35,
        i = Math.abs(t) / S;
      return [t, r + (i >= 1 ? 0 : e * C * 0.5 * (1 + Math.cos(Math.PI * i)))];
    }),
    [0.26, 0.21],
    [0, 0.31],
    [-0.26, 0.21],
  ];
}
var E = (e) => -0.18 + e * e * 0.26,
  D = (e) => 0.36 - e * e * 1.1,
  O = [-0.55, -0.28, 0, 0.28, 0.55],
  k = (e) => 0.16 - e * e * 1.8,
  A = 0.3,
  j = [
    [-0.16, -0.02],
    [0.02, 0.16],
  ],
  M = { cy: 0.1, rx: 0.3, ry: 0.55, n: 20 },
  N = 0.16;
function P(e, t, n, r, i) {
  let a = [];
  for (let o = 0; o < i; o++) {
    let s = (o / i) * 6.2832;
    a.push([e + Math.cos(s) * n, t + Math.sin(s) * r]);
  }
  return a;
}
function F(e) {
  let t = e.length / 2,
    n = e.slice(0, t + 1).reverse();
  return { top: [...e.slice(t), e[0]], bottom: n };
}
function I(e, t, n) {
  let r = Math.min(1, (e - N) / 0.84);
  return { o: r, rx: 0.28 + r * 0.08, ry: (0.16 + r * 0.5) * (t / n) * 0.5 };
}
function L(e, t) {
  return [...e, ...t.slice(1, -1).reverse()];
}
function R(e, t, n, r, i, a) {
  let o = 1 + i * 0.22,
    s = n * o,
    c = (r, i, a, s = L(i, a)) => ({
      type: e,
      state: r,
      wide: t,
      high: n,
      extend: o,
      top: i,
      bottom: a,
      outline: s,
      angle: [i[0], i[i.length - 1]],
    }),
    l = (e) => c(`closed`, [...e], [...e], [...e]);
  if (r > N) {
    let { o: e, rx: i, ry: a } = I(r, t, n),
      o = P(0, 0.14, i, a, 20),
      { top: s, bottom: l } = F(o),
      u = e > 0.35 ? P(0, 0.14 + a * 0.6, i * 0.55, a * 0.35, 14) : void 0;
    return { ...c(`babbles`, s, l, o), ...(u ? { tongue: u } : {}) };
  }
  let u = g[e];
  switch (e) {
    case `grin`: {
      let e = u,
        t = [e[0], [-0.3, 0.3], [0, 0.62], [0.3, 0.32], e[e.length - 1]];
      return c(`closed`, [...e], t);
    }
    case `teeth`: {
      let e = O.map((e) => [e, E(e)]);
      return c(`closed`, e, [
        e[0],
        ...[-0.36, 0, 0.36].map((e) => [e, D(e)]),
        e[e.length - 1],
      ]);
    }
    case `bucktooth`: {
      let e = [-0.42, 0, 0.42].map((e) => [e, k(e)]),
        [t, n] = j;
      return c(`closed`, e, [
        e[0],
        [t[0], k(t[0]) + A],
        [n[1], k(n[1]) + A],
        e[2],
      ]);
    }
    case `zigzag`: {
      let e = [];
      for (let t = 0; t <= 5; t++) {
        let n = t / 5;
        e.push([
          -0.5 + n,
          (t === 0 || t === 5 ? 0 : t % 2 ? -0.16 : 0.16) + 0.02,
        ]);
      }
      return l(e);
    }
    case `open`: {
      let e = P(0, M.cy, M.rx, M.ry, M.n),
        { top: t, bottom: n } = F(e);
      return c(`open`, t, n, e);
    }
    case `lips`: {
      let e = g[a.underlay] ?? g.line,
        n = t * 0.55,
        r = e[Math.floor(e.length / 2)][1],
        i = T(a.notch).map(([e, i]) => [
          (e * n * a.width) / t,
          r + (i * n * a.height) / s,
        ]),
        o = w.length,
        l = i.slice(0, o),
        u = i.slice(o).reverse();
      return {
        ...c(
          `closed`,
          [e[0], ...l, e[e.length - 1]],
          [e[0], l[0], ...u, l[o - 1], e[e.length - 1]],
        ),
        heart: i,
        seam: [...e],
      };
    }
    default:
      return l(u ?? g.line);
  }
}
function z(e, t, n, r, i, a, o = 12) {
  let s = [];
  for (let c = 0; c <= o; c++) {
    let l = i + ((a - i) * c) / o;
    s.push(e(t + Math.cos(l) * r, n + Math.sin(l) * r));
  }
  return s;
}
function B(e, t, n, r, i) {
  let a = r.jags,
    o = (Math.PI * 2) / a,
    s = [];
  for (let c = 0; c < a; c++) {
    let l = n + c * o + r.offset[c],
      u = t * r.lengths[c];
    s.push({ x: e.x + Math.cos(l) * u, y: e.y + Math.sin(l) * u * i });
    let d = n + (c + 0.5) * o + (r.offset[c] + r.offset[(c + 1) % a]) / 2;
    s.push({
      x: e.x + Math.cos(d) * t * r.inner,
      y: e.y + Math.sin(d) * t * r.inner * i,
    });
  }
  return s;
}
var V = (e, t) => e.shapes[t < 0 ? 0 : 1];
function H(e, t, n, r, i, a, o, s, c, l, d = 1 / 0) {
  let f = n * (1 + a.awake * 0.08),
    p = Math.max(0.06, 1 - a.lids * 0.94),
    m = (e, n) => t.to(e * f, -n * f * p),
    h = 0.7 + o * 0.7,
    g = (e, t = 22) => z(m, 0, 0, e, 0, 6.2832, t),
    _ = (e, t) => m((e - t) * a.x * 0.78, (e - t) * a.y * 0.7),
    v = { ex: t.ex, ey: t.ey, fx: t.fx, fy: t.fy * p },
    y = (t, n) => e.dot(t, n, s.ink, { trace: `${c}-p`, field: v }),
    b = (t, n) => {
      let r = -0.36 * n,
        i = 0.4 * n;
      e.dot(
        {
          x: t.x + v.ex.x * r * v.fx + v.ey.x * i * v.fy,
          y: t.y + v.ex.y * r * v.fx + v.ey.y * i * v.fy,
        },
        n * 0.3,
        s.blank,
        {
          coverage: 0.95,
          trace: `${c}-g`,
          stretch: 1.25,
          turn: -0.7,
          noHem: !0,
          field: v,
        },
      );
    },
    x = { w: u, wobble: 0.004 };
  if (a.lids > 0.72 && r !== `sparkle`) {
    e.stroke([m(-0.66, 0.06), m(0, -0.26), m(0.66, 0.06)], {
      trace: `${c}-shut`,
      ...x,
    });
    return;
  }
  let S = Math.max(0.35, p);
  switch (r) {
    case `dot`:
      y(_(0.12, 0), f * 0.36 * h * S);
      break;
    case `button`: {
      let e = f * 0.5 * h * S,
        t = _(0.1, 0);
      (y(t, e), b(t, e));
      break;
    }
    case `ring`:
      (e.stroke(g(0.56), { trace: c, ...x, w: u * 0.9, closed: !0 }),
        y(_(0.56, 0.24), f * 0.24 * h * S));
      break;
    case `wide`: {
      e.stroke(g(0.74), { trace: c, ...x, w: u * 0.85, closed: !0 });
      let t = f * 0.2 * h * S,
        n = _(0.74, 0.3);
      (y(n, t), b(n, t));
      break;
    }
    case `open`: {
      (e.stroke(z(m, 0, 0.02, 0.7, Math.PI * 1.06, Math.PI * 1.94), {
        trace: `${c}-o`,
        ...x,
      }),
        e.stroke(z(m, 0, -0.02, 0.66, Math.PI * 0.1, Math.PI * 0.9), {
          trace: `${c}-u`,
          w: u * 0.6,
          wobble: 0.004,
          coverage: 0.45,
          singleLayer: !0,
        }));
      let t = f * 0.34 * h * S,
        n = _(0.62, 0.3);
      (y(n, t), b(n, t));
      break;
    }
    case `monolid`: {
      let t = -i,
        n = (e, n) => m(e * t, n);
      (e.stroke([n(-0.7, 0.04), n(-0.24, 0.3), n(0.24, 0.24), n(0.6, -0.06)], {
        trace: `${c}-o`,
        ...x,
      }),
        e.stroke([n(0.6, -0.06), n(0.46, -0.24)], {
          trace: `${c}-f`,
          w: u * 0.8,
          wobble: 0.004,
        }),
        e.stroke([n(-0.62, 0), n(-0.1, -0.34), n(0.44, -0.16)], {
          trace: `${c}-u`,
          w: u * 0.6,
          wobble: 0.004,
          coverage: 0.45,
          singleLayer: !0,
        }));
      let r = f * 0.3 * h * S,
        a = _(0.42, 0.16);
      (y({ x: a.x, y: a.y - r * 0.18 * S }, r), b(a, r));
      break;
    }
    case `almond`:
      (e.stroke([m(-0.66, 0.02), m(0, -0.46), m(0.66, 0.02)], {
        trace: `${c}-o`,
        ...x,
      }),
        e.stroke([m(-0.66, 0.02), m(0, 0.32), m(0.66, 0.02)], {
          trace: `${c}-u`,
          w: u * 0.7,
          wobble: 0.004,
        }),
        y(_(0.34, 0.06), f * 0.22 * h * S));
      break;
    case `happy`:
      e.stroke(z(m, 0, 0.16, 0.66, Math.PI * 1.1, Math.PI * 1.9), {
        trace: c,
        ...x,
        w: u * 1.15,
      });
      break;
    case `line`:
      e.stroke([m(-0.6, 0), m(0, 0.06), m(0.6, 0)], { trace: c, ...x });
      break;
    case `wink`:
      if (i < 0)
        e.stroke(z(m, 0, 0.16, 0.6, Math.PI * 1.1, Math.PI * 1.9), {
          trace: c,
          ...x,
          w: u * 1.1,
        });
      else {
        let e = f * 0.4 * h * S,
          t = _(0.1, 0);
        (y(t, e), b(t, e));
      }
      break;
    case `sleepy`:
      (e.stroke([m(-0.66, -0.12), m(0.05, -0.22), m(0.66, -0.06)], {
        trace: c,
        ...x,
      }),
        e.stroke([m(-0.44, -0.08), m(0, 0.28), m(0.44, -0.04)], {
          trace: `${c}-u`,
          w: u * 0.65,
          wobble: 0.003,
        }),
        y(_(0.26, 0.06), f * 0.2 * h));
      break;
    case `cross`:
      (e.stroke([m(-0.42, -0.42), m(0.42, 0.42)], { trace: `${c}-a`, ...x }),
        e.stroke([m(-0.42, 0.42), m(0.42, -0.42)], { trace: `${c}-b`, ...x }));
      break;
    case `star`: {
      e.stroke(g(0.7), { trace: c, ...x, w: u * 0.85, closed: !0 });
      let t = B(
        _(0.7, Math.min(l.size, 0.7)),
        f * l.size * S,
        a.time * 0.5 + i,
        V(l, i),
        S,
      );
      e.surface(t, {
        colour: l.colour,
        square: !0,
        coverage: 0.92,
        trace: `${c}-star`,
        wobble: 0.004,
        dry: !0,
      });
      break;
    }
    case `sparkle`: {
      let t = V(l, i),
        n = B(
          _(0.34, 0),
          f * Math.min(l.large[i < 0 ? 0 : 1], d),
          a.time * 0.05 + i * 1.7,
          t,
          S,
        );
      (e.surface(n, {
        colour: l.colour,
        square: !0,
        coverage: 0.88,
        trace: `${c}-sparkle`,
        wobble: 0.006,
      }),
        e.stroke(n, {
          trace: `${c}-sparkle-edge`,
          w: u * 0.62,
          wobble: 0.007,
          square: !0,
          closed: !0,
        }));
      break;
    }
    case `scribble`: {
      let t = [
        [0.06, -0.08, 0.6, 0.3, 4.2],
        [-0.1, 0.06, 0.52, 2.4, 6.9],
        [0.08, 0.1, 0.66, 1.1, 5.4],
        [-0.04, -0.12, 0.46, 3.6, 8.2],
      ];
      for (let n = 0; n < 4; n++) {
        let [r, a, o, s, l] = t[n];
        e.stroke(z(m, r * i, a, o, s, l, 8), {
          trace: `${c}-k${n}`,
          w: u * 0.85,
          wobble: 0.005,
        });
      }
      break;
    }
  }
}
function U(e) {
  return {
    high: e.range(0.36, 0.72),
    wide: e.range(0.1, 0.26),
    thickness: e.range(0.9, 1.1),
    lean: e.range(0, 0.3),
    both: e.n() < 0.6,
  };
}
var W = {
  ring: { r: 0.56, gentle: 1 },
  wide: { r: 0.74, gentle: 1 },
  open: { r: 0.7, gentle: 0.62 },
  monolid: { r: 0.6, gentle: 0.7 },
  star: { r: 0.7, gentle: 1 },
  button: { r: 0.5, gentle: 1 },
};
function G(e, t) {
  let n = !1;
  for (let r = 0, i = t.length - 1; r < t.length; i = r++) {
    let a = t[r],
      o = t[i];
    a.y > e.y != o.y > e.y &&
      e.x < ((o.x - a.x) * (e.y - a.y)) / (o.y - a.y) + a.x &&
      (n = !n);
  }
  return n;
}
function K(e, t, n, r, i, a, o, c, l, d, f) {
  let p = W[r];
  if (!p || c > 0.72) {
    f();
    return;
  }
  let m = p.r,
    h = (e, r) => t.to(e * n, -r * n),
    g = i * m * 0.1,
    _ = m * 1,
    v = _ - m * a.high,
    y = Math.PI * 1.15,
    b = Math.PI * 1.92,
    x = 1 / Math.cos(Math.PI * 0.15),
    S = -i * a.lean,
    C = (e, t) =>
      h(
        g + e * Math.cos(S) - t * Math.sin(S),
        _ + e * Math.sin(S) + t * Math.cos(S),
      ),
    w = (e) => {
      let t = [];
      for (let n = 0; n <= 14; n++) {
        let r = y + ((b - y) * n) / 14;
        t.push(C(-i * Math.cos(r) * e * x, Math.sin(r) * v));
      }
      return t;
    },
    T = o.map((e) => ({ x: e.x * 0.94, y: e.y * 0.94 })),
    E = m + a.wide,
    D;
  for (; E >= m * 0.85;) {
    let e = w(E);
    if (e.every((e) => G(e, T))) {
      D = e;
      break;
    }
    E -= 0.04;
  }
  if (!D) {
    f();
    return;
  }
  let O = e.ctx;
  (O.save(), O.beginPath());
  let k = [...s(D, !1, !0), h(g - i * (E + 1), -3), h(g + i * (E + 1), -3)];
  O.moveTo(k[0].x, k[0].y);
  for (let e of k.slice(1)) O.lineTo(e.x, e.y);
  (O.closePath(),
    O.clip(),
    f(),
    O.restore(),
    e.stroke(D, {
      trace: d,
      w: u * a.thickness * p.gentle,
      wobble: 0.004,
      colour: l.ink,
      pointed: 0.85,
      coverage: 0.9 * (0.4 + 0.6 * p.gentle) * (1 - c / 0.72),
      singleLayer: p.gentle < 1,
    }));
}
function q(e, t, n, r, i, a, o, s) {
  if (r === `none`) return;
  let c = -a * 0.38,
    l = (e, r) => t.to(e * n, -(r + c) * n),
    d = r === `thick` ? u * 1.9 : u * 1.05,
    f;
  switch (r) {
    case `angled`:
      f = [l(-0.7 * i, 0.26), l(0.7 * i, -0.2)];
      break;
    case `worried`:
      f = [l(-0.7 * i, -0.24), l(0.7 * i, 0.16)];
      break;
    case `high`:
      f = [l(-0.66, 0.14), l(0, -0.4), l(0.66, 0.1)];
      break;
    default:
      f = [l(-0.7, 0.04), l(0, -0.16), l(0.7, 0.02)];
  }
  e.stroke(f, {
    trace: s,
    w: d,
    wobble: 0.005,
    colour: o.ink,
    pointed: r === `thick` ? 0.5 : 0.75,
  });
}
function J(e, t, n, r, i, a, o) {
  let s = i,
    c = a * 0.5,
    l = (e, r) => t.to((e + c * (r + 0.6) * 0.5) * n, -r * n),
    d = { trace: `nose`, w: u * 0.95, wobble: 0.004, colour: o.ink };
  switch (r) {
    case `hook`:
      e.stroke(
        [
          l(s * 0.06, -0.62),
          l(s * 0.32, -0.02),
          l(s * 0.28, 0.42),
          l(-s * 0.22, 0.46),
        ],
        d,
      );
      break;
    case `comma`:
      e.stroke([l(s * 0.14, -0.26), l(s * 0.3, 0.26), l(-s * 0.1, 0.4)], d);
      break;
    case `line`:
      e.stroke([l(s * 0.06, -0.5), l(s * 0.14, 0.42)], d);
      break;
    case `wave`:
      e.stroke([l(-s * 0.34, 0.16), l(0, 0.42), l(s * 0.34, 0.12)], d);
      break;
    case `button`:
      e.stroke(z(l, s * 0.06, 0.16, 0.26, 0, 6.2832, 16), {
        ...d,
        closed: !0,
        w: u * 0.85,
      });
      break;
    case `long`:
      e.stroke(
        [
          l(s * 0.02, -0.74),
          l(s * 0.24, 0.1),
          l(s * 0.3, 0.5),
          l(-s * 0.14, 0.58),
        ],
        d,
      );
      break;
    case `dots`:
      (e.dot(l(-0.26, 0.34), n * 0.09, o.ink, {
        coverage: 0.9,
        trace: `nostril-l`,
        field: t,
      }),
        e.dot(l(0.26, 0.34), n * 0.09, o.ink, {
          coverage: 0.9,
          trace: `nostril-r`,
          field: t,
        }),
        e.stroke(z(l, 0, 0.1, 0.24, Math.PI * 1.2, Math.PI * 1.8), {
          ...d,
          w: u * 0.7,
          coverage: 0.65,
        }));
  }
}
function Y(e, t, n, r) {
  let i = (e, r) => t.to(e * n.wide, -r * n.high * n.extend),
    a = (e) => e.map(([e, t]) => i(e, t)),
    o = { trace: `mouth`, w: u * 1.05, wobble: 0.005, colour: r.ink };
  if (n.state === `babbles`) {
    let t = a(n.outline);
    (e.surface(t, {
      colour: r.ink,
      trace: `mouth-top`,
      wobble: 0.004,
      coverage: 0.88,
      dry: !0,
    }),
      n.tongue &&
        e.surface(a(n.tongue), {
          colour: r.accent,
          trace: `tongue`,
          wobble: 0.003,
          coverage: 0.85,
          dry: !0,
        }),
      e.stroke(t, { ...o, trace: `mouth-top-edge`, closed: !0, w: u * 0.9 }));
    return;
  }
  switch (n.type) {
    case `grin`:
      (e.stroke(a(n.top), o),
        e.stroke(a(n.bottom.slice(1, -1)), {
          ...o,
          trace: `lowerLip`,
          w: u * 0.6,
          coverage: 0.45,
          singleLayer: !0,
        }));
      break;
    case `teeth`: {
      let t = a(n.outline);
      (e.surface(t, {
        colour: r.blank,
        trace: `teeth`,
        wobble: 0.003,
        coverage: 0.95,
        dry: !0,
      }),
        e.stroke(t, { ...o, trace: `teeth-edge`, closed: !0 }));
      for (let [t, n] of [-0.3, -0.1, 0.1, 0.3].entries())
        e.stroke([i(n, E(n)), i(n, D(n))], {
          ...o,
          trace: `tooth${t}`,
          w: u * 0.65,
          coverage: 0.7,
          singleLayer: !0,
        });
      break;
    }
    case `bucktooth`:
      e.stroke(a(n.top), o);
      for (let [t, [n, a]] of j.entries()) {
        let s = [i(n, k(n)), i(a, k(a)), i(a, k(a) + A), i(n, k(n) + A)];
        (e.surface(s, {
          colour: r.blank,
          trace: `bucktooth${t}`,
          wobble: 0.002,
          coverage: 0.95,
          square: !0,
          dry: !0,
        }),
          e.stroke(s, {
            ...o,
            trace: `bucktooth-edge${t}`,
            closed: !0,
            square: !0,
            w: u * 0.7,
          }));
      }
      break;
    case `crooked`:
      (e.stroke(a(n.top), o),
        e.stroke([i(0.46, -0.3), i(0.6, -0.5)], {
          ...o,
          trace: `mouth-tick`,
          w: u * 0.7,
          coverage: 0.7,
          singleLayer: !0,
        }));
      break;
    case `zigzag`:
      e.stroke(a(n.top), { ...o, square: !0 });
      break;
    case `open`: {
      let t = a(n.outline);
      (e.surface(t, {
        colour: r.ink,
        trace: `mouth-top`,
        wobble: 0.004,
        coverage: 0.88,
        dry: !0,
      }),
        e.stroke(t, { ...o, trace: `mouth-top-edge`, closed: !0, w: u * 0.85 }));
      break;
    }
    case `lips`:
      (e.surface(a(n.heart), {
        colour: r.accent,
        trace: `lips`,
        wobble: 0.003,
        coverage: 0.88,
      }),
        e.stroke(a(n.seam), o));
      break;
    default:
      e.stroke(a(n.top), o);
  }
}
var X = [
  [-0.5, 0.8, 0.1],
  [-0.2, 1.2, -0.12],
  [0.1, 1.05, 0.16],
  [0.4, 0.75, -0.06],
  [0.66, 0.5, 0.18],
];
function ee(e, t, n, r, a, o, s, c) {
  if (r === `none`) return;
  let l = r === `rosy`,
    d = r === `dots`,
    f = r === `freckles`,
    p = Math.min(n.eyeV * 0.3 + n.mouthV * 0.7, n.eyeV - 0.4);
  for (let r of [-1, 1]) {
    let m = r * Math.min(0.9, n.eyeU + 0.22),
      h = i(m, p, t);
    if (!(h.nz < 0.1)) {
      if (l)
        for (let [t, [n, i, c]] of X.entries()) {
          let l = n * s,
            d = (i * s) / 2;
          e.stroke(
            [h.to(-d + c * s, -l + s * 0.04), h.to(d + c * s, -l - s * 0.04)],
            {
              trace: `cheek${r}${t}`,
              w: u * 0.9,
              wobble: 0.006,
              colour: a.accent,
              coverage: 0.7 + o * 0.3,
              pointed: 1,
              singleLayer: !0,
            },
          );
        }
      if (d) {
        let t = s * 0.4 * c,
          n = r * 0.35,
          i = [];
        for (let e = 0; e < 16; e++) {
          let r = (e / 16) * 6.2832,
            a = Math.cos(r) * t,
            o = Math.sin(r) * t * 0.88;
          i.push(
            h.to(
              a * Math.cos(n) - o * Math.sin(n),
              a * Math.sin(n) + o * Math.cos(n),
            ),
          );
        }
        e.surface(i, {
          colour: a.accent,
          trace: `dot${r}`,
          wobble: 0.005,
          coverage: 0.55 + o * 0.3,
        });
      }
      if (f)
        for (let t = 0; t < 7; t++) {
          let n = t * 2.399,
            i = Math.sqrt((t + 0.6) / 7);
          e.dot(
            h.to(Math.cos(n) * i * s * 0.62, Math.sin(n) * i * s * 0.5),
            s * 0.065,
            a.freckle,
            { coverage: 0.6, trace: `freckle${r}${t}`, field: h },
          );
        }
    }
  }
}
function te(e, t, n, r, a, o, s, c = 1) {
  if (r === `none` || r === `cheekbones`) return;
  let l = {
    w: u * 0.55,
    wobble: 0.003,
    colour: s.ink,
    coverage: 0.4,
    singleLayer: !0,
    calm: !0,
  };
  if (r === `undereyes`) {
    for (let r of [-1, 1]) {
      let a = i(r * n.eyeU, n.eyeV - 0.02, t);
      if (a.nz < 0.1) continue;
      let s = (e, t) => a.to(e * o, -t * o);
      for (let t = 0; t < c; t++)
        e.stroke(
          z(
            s,
            0,
            0.24 + t * 0.3,
            0.72 - t * 0.16,
            Math.PI * 0.12,
            Math.PI * 0.88,
            8,
          ),
          { ...l, trace: `ring${r}${t}` },
        );
    }
    return;
  }
  if (r === `hatching`) {
    for (let r = 0; r < 6; r++) {
      let o = i(a * (0.86 + r * 0.05), n.eyeV + 0.34, t),
        s = i(a * (1.02 + r * 0.05), n.eyeV + 0.06, t);
      o.nz < 0.05 ||
        s.nz < 0.05 ||
        e.stroke(
          [
            { x: o.x, y: o.y },
            { x: s.x, y: s.y },
          ],
          { ...l, trace: `hatch${r}`, coverage: 0.36 },
        );
    }
    return;
  }
  let d = n.browV + 0.22;
  for (let n = 0; n < 2; n++) {
    let r = d + n * 0.14,
      a = [];
    for (let e = 0; e <= 6; e++) {
      let o = -0.42 + (e / 6) * 0.84,
        s = i(o, r + Math.sin(e * 1.9 + n) * 0.02, t);
      a.push({ x: s.x, y: s.y });
    }
    e.stroke(a, { ...l, trace: `fold${n}` });
  }
}
var ne = {
    hook: 0.46,
    comma: 0.4,
    line: 0.42,
    wave: 0.42,
    button: 0.42,
    long: 0.58,
    dots: 0.43,
  },
  Z = 0.25;
function Q(e, t) {
  let n = e.top;
  if (t <= n[0][0]) return n[0][1];
  for (let e = 1; e < n.length; e++) {
    let [r, i] = n[e - 1],
      [a, o] = n[e];
    if (t <= a) {
      let e = a === r ? 0 : (t - r) / (a - r);
      return i + (o - i) * e;
    }
  }
  return n[n.length - 1][1];
}
function $(e, t, n, r) {
  let i = 0.03,
    a = e.zones.nose.v - ne[t.type] * t.large - i,
    o = -1 / 0;
  for (let e of [-0.25, 0, Z]) o = Math.max(o, -Q(n, e));
  for (let [e, t] of n.top) Math.abs(e) <= Z && (o = Math.max(o, -t));
  let s = e.zones.mouth.v + o * n.high * n.extend + i;
  return {
    noseTip: a,
    lip: s,
    b: Math.min(r * 0.4, Math.max(0.05, (a - s) / 0.7)),
  };
}
var re = 1.78;
function ie(e, t, n, r, a, o, s, c, l, d) {
  if (r === `none`) return;
  let { noseTip: f, lip: p, b: m } = $(n, s, c, o),
    h = p + 0.28 * m,
    g = h + (Math.max(h, f - 0.42 * m) - h) * d - n.zones.mouth.v,
    _ = 0.03,
    v = (e) => -Q(c, (e * m) / c.wide) * c.high * c.extend + _,
    y = g - 0.28 * m,
    b = y - (p - n.zones.mouth.v),
    x = r === `handlebar` ? 1.98 : re,
    S = { [-1]: Math.max(0, v(-x) - y), 1: Math.max(0, v(x) - y) },
    C = (e, t) => {
      let n = Math.min(1, Math.abs(e) / x),
        i = g - t * m + S[e < 0 ? -1 : 1] * n;
      if (t > 0) {
        let t =
          r === `handlebar`
            ? Math.max(0, Math.min(1, (1.55 - Math.abs(e)) / 0.35))
            : 1;
        i += (v(e) + b - i) * 0.4 * t;
      }
      return l.to(e * m, Math.max(i, v(e)));
    },
    w = (t, n) => {
      for (let r of [-1, 1]) {
        let i = t.map(([e, t]) => C(r * e, t));
        (e.surface(i, { colour: a.hair, trace: `${n}${r}`, wobble: 0.004 }),
          e.stroke(i, {
            trace: `${n}-edge${r}`,
            w: u * 0.7,
            wobble: 0.004,
            colour: a.ink,
            closed: !0,
            coverage: 0.7,
          }));
      }
    };
  if (r === `moustache`) {
    w(
      [
        [0.05, -0.24],
        [0.42, -0.42],
        [0.85, -0.36],
        [1.3, -0.1],
        [1.78, 0.28],
        [1.55, 0.24],
        [1.15, 0.1],
        [0.7, 0.02],
        [0.3, 0.06],
        [0.05, 0.14],
      ],
      `moustache`,
    );
    return;
  }
  if (r === `handlebar`) {
    w(
      [
        [0.05, -0.24],
        [0.42, -0.42],
        [0.85, -0.36],
        [1.25, -0.14],
        [1.55, -0.04],
        [1.8, -0.12],
        [1.96, -0.32],
        [1.9, -0.52],
        [1.74, -0.56],
        [1.68, -0.46],
        [1.8, -0.34],
        [1.76, -0.16],
        [1.58, 0.1],
        [1.3, 0.14],
        [1.15, 0.1],
        [0.7, 0.02],
        [0.3, 0.06],
        [0.05, 0.14],
      ],
      `handlebar`,
    );
    return;
  }
  if (r === `walrus`) {
    let t = f - n.zones.mouth.v,
      r = 0.55,
      i = (0.5 * c.wide) / m,
      o = Math.min(2.2, i * 1.75),
      s = p - n.zones.mouth.v,
      d = (e) => {
        let t = v(e),
          n = Math.abs(e);
        if (n <= i) return Math.max(t, s + (t - s) * 0.5) + 0.1 * m;
        let r = Math.min(1, (n - i) / Math.max(0.2, o - i));
        return t + 0.1 * m - 0.22 * m * r * r;
      },
      h = (e, t) => l.to(e * m, t),
      g = (e, n) => {
        let i = e * (r + (o - r) * n ** 0.7),
          a = t - 0.08 * m,
          s = d(i);
        return h(i, a + (s - a) * n);
      },
      _ = [];
    for (let e = 0; e <= 6; e++) {
      let n = -0.55 + (e / 6) * 2 * r,
        i = 1 - (Math.abs(n) / r) ** 2;
      _.push(
        h(
          n,
          t -
            0.1 * m +
            0.1 * m * i -
            0.06 * m * Math.max(0, 1 - Math.abs(n) / 0.25),
        ),
      );
    }
    for (let e of [0.3, 0.6, 0.85]) _.push(g(1, e));
    for (let e = 0; e <= 12; e++) {
      let t = o - (e / 12) * 2 * o,
        n = e % 2 == 1 ? 0.09 * m : 0;
      _.push(h(t, d(t) + n));
    }
    for (let e of [0.85, 0.6, 0.3]) _.push(g(-1, e));
    (e.surface(_, { colour: a.hair, trace: `walrus`, wobble: 0.004 }),
      e.stroke(_, {
        trace: `walrus-edge`,
        w: u * 0.7,
        wobble: 0.004,
        colour: a.ink,
        closed: !0,
        coverage: 0.7,
      }));
    for (let n of [-1, 1])
      for (let [i, s] of [0.25, 0.55, 0.85].entries()) {
        let c = n * r * s,
          l = n * o * (0.35 + 0.6 * s),
          f = t - 0.22 * m,
          p = d(l) + 0.16 * m;
        e.stroke([h(c, f), h((c + l) / 2 + n * 0.05 * m, (f + p) / 2), h(l, p)], {
          trace: `walrus-strand${n}${i}`,
          w: u * 0.6,
          wobble: 0.004,
          colour: a.ink,
          coverage: 0.4,
          singleLayer: !0,
        });
      }
    return;
  }
  if (r === `stubblemoustache`) {
    for (let t = 0; t < 9; t++) {
      let n = (t / 8) * 2 - 1,
        r = n * 1.45,
        i = -0.02 - (1 - n * n) * 0.24,
        o = 0.34 + (0.14 * ((t * 7) % 3)) / 2,
        s = n * 0.2;
      e.stroke([C(r, i), C(r + s, i + o)], {
        trace: `stubblemoustache${t}`,
        w: u * 0.85,
        wobble: 0.005,
        colour: a.ink,
        coverage: 0.72,
        pointed: 1,
        singleLayer: !0,
      });
    }
    return;
  }
  let T = (e) => {
      let t = c.bottom;
      if (e <= t[0][0]) return t[0][1];
      for (let n = 1; n < t.length; n++) {
        let [r, i] = t[n - 1],
          [a, o] = t[n];
        if (e <= a) return i + (o - i) * (a === r ? 0 : (e - r) / (a - r));
      }
      return t[t.length - 1][1];
    },
    E = -0.9,
    D = 0;
  for (let [, e] of c.bottom) D = Math.max(D, e);
  for (let r = 0; r < 30; r++) {
    let s = (r * 2.399) % 6.2832,
      l = Math.sqrt((r + 0.5) / 30),
      u = Math.abs(Math.sin(s)) * l,
      d = Math.abs(Math.cos(s)) * l,
      f = Math.cos(s) * l * 0.55 * (1 - 0.35 * u),
      p = f / c.wide,
      m = Math.abs(p) > 0.65 ? D : T(p),
      h = n.mouthV - m * c.high * c.extend - 3 * _ - 0.16 * d;
    if (h - E < 0.05) continue;
    let g = h + (E - h) * u,
      v = i(f, g, t);
    if (v.nz < 0.14) continue;
    let y = (r * 7) % 3 == 0 ? u : 0;
    e.dot({ x: v.x, y: v.y }, o * (0.035 + 0.008 * y), a.ink, {
      coverage: 0.4 + 0.45 * y,
      trace: `stubble${r}`,
      field: v,
    });
  }
}
function ae(t) {
  return { colour: o(t.n()), strength: e(t, 0.02, 0.13, 0, 0.26) };
}
function oe(e, a, o, s, c, l, d, f, p) {
  if (d === `none`) return;
  let { head: m, pose: h, F: g } = a,
    _ = (e) => {
      let t = n(r(e, h), g);
      return { x: t.x, y: t.y };
    },
    v = (e) => {
      let n = t(e, o.eyeV, m);
      return { x: n.x, y: n.y, z: n.z + m.rz * 0.08 };
    },
    y = v(s),
    b = v(c),
    x = (b.x - y.x) / 2,
    S = Math.min(l * 1.45, x * 0.86, m.rx * 0.36),
    C = (e) => {
      let t = [];
      for (let n = 0; n < 24; n++) {
        let r = (n / 24) * 6.2832,
          i = Math.cos(r),
          a = Math.sin(r);
        if (d === `square`) {
          let e = 0.42;
          ((i = Math.sign(i) * Math.abs(i) ** e),
            (a = Math.sign(a) * Math.abs(a) ** e * 0.82));
        }
        t.push(_({ x: e.x + i * S, y: e.y + a * S, z: e.z }));
      }
      return t;
    },
    w = (t, n) => {
      let r = C(t);
      (f.strength > 0.02 &&
        e.surface(r, {
          colour: f.colour,
          coverage: f.strength,
          trace: `lensTone${n}`,
          wobble: 0.005,
          dry: !0,
        }),
        e.stroke(r, {
          trace: `lens${n}`,
          w: u * 0.85,
          wobble: 0.003,
          closed: !0,
          colour: p.ink,
        }));
    };
  (w(y, 0), w(b, 1));
  let T = _({ x: y.x + S * 0.96, y: y.y + S * 0.08, z: y.z }),
    E = _({ x: b.x - S * 0.96, y: b.y + S * 0.08, z: b.z }),
    D = _({ x: (y.x + b.x) / 2, y: y.y + S * 0.34, z: y.z });
  e.stroke([T, D, E], {
    trace: `bridge`,
    w: u * 0.75,
    wobble: 0.003,
    colour: p.ink,
  });
  for (let [n, r] of [-1, 1].entries()) {
    if (i(r * 1.48, o.earV, a).nz < -0.05) continue;
    let s = r < 0 ? y : b,
      c = t(r * 1.42, o.earV + 0.08, m);
    e.stroke(
      [
        _({ x: s.x + r * S * 0.98, y: s.y + S * 0.02, z: s.z }),
        _({ x: c.x, y: c.y, z: c.z }),
      ],
      {
        trace: `temple${n}`,
        w: u * 0.65,
        wobble: 0.003,
        colour: p.ink,
        coverage: 0.85,
        singleLayer: !0,
      },
    );
  }
}
function se(e, t) {
  let n = c(e, t.zones.eyeL, t.fill),
    r = c(e, t.zones.nose, t.fill),
    i = c(e, t.zones.mouth, t.fill),
    a = (e, t, n) => Math.max(t, Math.min(n, e));
  return {
    eye: a(
      Math.min(0.23 * t.eyeScale, n.width * 1.05, n.height * 4.5),
      0.13,
      0.27,
    ),
    nose: a(Math.min(0.24 * t.scale, r.height * 1.35), 0.13, 0.3),
    mouthWide: a(Math.min(0.46 * t.scale, i.width * 1.15), 0.26, 0.52),
    mouthHigh: a(Math.min(0.17 * t.scale, i.height * 1.9), 0.08, 0.2),
  };
}
export {
  c as C,
  te as S,
  q as _,
  R as a,
  J as b,
  v as c,
  f as d,
  p as f,
  ie as g,
  ee as h,
  se as i,
  h as l,
  H as m,
  g as n,
  m as o,
  U as p,
  $ as r,
  ae as s,
  _ as t,
  d as u,
  oe as v,
  l as w,
  K as x,
  Y as y,
};
