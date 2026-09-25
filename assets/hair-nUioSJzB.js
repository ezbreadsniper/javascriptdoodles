import "./core-Calr4rc2.js";
import { d as e, i as t, n, r } from "./cloud-D0bWzE4O.js";
import { t as i } from "./palette-4j4QC37X.js";
import {
  c as a,
  l as o,
  n as s,
  o as c,
  s as l,
  u,
} from "./shell-DWEMSj-6.js";
import {
  a as d,
  c as f,
  d as p,
  f as m,
  i as h,
  l as g,
  n as _,
  o as v,
  p as y,
  r as b,
  s as x,
  u as S,
} from "./afro-Cb9KCHLH.js";
import { t as C } from "./hat-BsoxlaaB.js";
function w(e, t, n = {}) {
  let r = n.turn ?? (t.chance(0.5) ? 1 : -1),
    i = n.direction ?? 1,
    a = n.mass ?? 1,
    o = { edge: e, wrap: [], turn: r },
    s = [];
  for (let t = 0; t + 1 < e.length; t++) {
    let n = e[t],
      r = e[t + 1],
      i = Math.max(1, Math.round(Math.hypot(r.x - n.x, r.y - n.y) / 0.008));
    for (let e = 0; e < i; e++)
      s.push({
        x: n.x + ((r.x - n.x) * e) / i,
        y: n.y + ((r.y - n.y) * e) / i,
      });
  }
  if ((s.push(e[e.length - 1]), s.length < 6)) return o;
  let c = [0];
  for (let e = 1; e < s.length; e++)
    c.push(c[e - 1] + Math.hypot(s[e].x - s[e - 1].x, s[e].y - s[e - 1].y));
  let l = c[c.length - 1];
  if (l < 0.2) return o;
  let [u, d] = n.division ?? [9, 13],
    f = l / t.range(u, d),
    p = [],
    m = 0;
  for (; m < l;) {
    let e = f * (t.chance(0.28) ? t.range(1.35, 2.2) : t.range(0.5, 1.05));
    (p.push(e), (m += e));
  }
  let h = l / m,
    g = [0];
  for (let e of p) g.push(g[g.length - 1] + e * h);
  g[g.length - 1] = l;
  let _ = r * t.range(0.22, 0.5),
    v = (t.chance(0.5) ? 1 : -1) * t.range(0.2, 0.42),
    y = p.map((e, n) => {
      let r = (g[n] + g[n + 1]) / (2 * l) - 0.5;
      return Math.min(0.12, e * h * t.range(0.36, 0.58)) * (1 + v * r * 2);
    }),
    b = Math.floor(t.n() * y.length);
  y[b] = Math.min(0.14, y[b] * 1.5);
  let x = p.map(() => t.range(0.78, 1.28)),
    S = p.map(() => ({ h: -1, p: { x: 0, y: 0 }, n: { x: 0, y: 0 } })),
    C = 0,
    w = s.map((e, t) => {
      for (; C + 1 < g.length - 1 && g[C + 1] <= c[t];) C++;
      let n = g[C],
        r = g[C + 1],
        o =
          Math.max(0, Math.min(1, (c[t] - n) / Math.max(1e-6, r - n))) ** +x[C],
        l = Math.sqrt(Math.max(0, 1 - (2 * o - 1) * (2 * o - 1))),
        u = y[C] * l * a,
        d = Math.hypot(e.x, e.y) || 1,
        f = (i * e.x) / d,
        p = (i * e.y) / d,
        m = s[Math.max(0, t - 1)],
        h = s[Math.min(s.length - 1, t + 1)],
        v = Math.hypot(h.x - m.x, h.y - m.y) || 1,
        b = u - y[C] * a * 0.16 * (1 - l),
        w = {
          x: e.x + f * b + ((h.x - m.x) / v) * u * _,
          y: e.y + p * b + ((h.y - m.y) / v) * u * _,
        };
      return (u > S[C].h && (S[C] = { h: u, p: w, n: { x: f, y: p } }), w);
    }),
    T = [];
  for (let e of S)
    e.h <= 0 ||
      T.push({
        c: { x: e.p.x - e.n.x * e.h * 0.55, y: e.p.y - e.n.y * e.h * 0.55 },
        r: e.h * t.range(0.42, 0.62),
        a0: Math.atan2(e.n.y, e.n.x) + t.range(-0.8, 0.8),
        turn: r,
      });
  return { edge: w, wrap: T, turn: r };
}
function T(e, t, n, r, i, a, s) {
  if (r === `afro`) {
    if (!i) return;
    let r = _(t, i, a, o(n, `hair`));
    if (r.length < 6) return;
    e.surface(r, { colour: s.hair, trace: `afro-ball`, wobble: 0.006 });
    return;
  }
  if (r !== `pigtails`) return;
  let { rx: c, ry: l, rz: u } = t.head,
    d = (e) => (e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e));
  for (let n of [-1, 1]) {
    let r = -u * 0.1,
      i = (e) => ({
        x: n * c * (0.62 + 0.55 * d(e / 0.42)),
        y: l * (0.82 - 1.72 * e),
      }),
      a = 0.84,
      o = (e) =>
        c *
        (0.1 +
          0.03 * Math.sin(Math.PI * Math.min(1, e / a)) +
          0.022 * Math.abs(Math.sin(Math.PI * 7 * (e / a)))),
      p = [],
      m = [];
    for (let e = 0; e <= 36; e++) {
      let n = (e / 36) * a,
        s = i(n),
        c = o(n);
      (p.push(f(t, s.x - c, s.y, r)), m.push(f(t, s.x + c, s.y, r)));
    }
    let h = p.concat([...m].reverse());
    (e.surface(h, { colour: s.hair, trace: `braid${n}`, wobble: 0.005 }),
      e.stroke(p, {
        trace: `braid-l${n}`,
        w: 0.024,
        wobble: 0.005,
        colour: s.ink,
        coverage: 0.8,
      }),
      e.stroke(m, {
        trace: `braid-r${n}`,
        w: 0.024,
        wobble: 0.005,
        colour: s.ink,
        coverage: 0.8,
      }));
    for (let c = 0; c < 7; c++) {
      let l = ((c + 0.15) / 7) * a,
        u = ((c + 0.85) / 7) * a,
        d = i(l),
        p = i(u),
        m = o(l) * 0.8,
        h = f(t, p.x, p.y, r);
      (e.stroke([f(t, d.x - m, d.y, r), h], {
        trace: `plait${n}${c}l`,
        w: 0.016,
        wobble: 0.003,
        colour: s.ink,
        coverage: 0.55,
        singleLayer: !0,
        pointed: 0.3,
      }),
        e.stroke([f(t, d.x + m, d.y, r), h], {
          trace: `plait${n}${c}r`,
          w: 0.016,
          wobble: 0.003,
          colour: s.ink,
          coverage: 0.55,
          singleLayer: !0,
          pointed: 0.3,
        }));
    }
    let g = [];
    for (let e = 0; e <= 8; e++) {
      let n = a + (e / 8) * 0.16000000000000003,
        o = (n - a) / 0.16000000000000003,
        s = i(n);
      g.push(
        f(
          t,
          s.x - c * (0.07 + 0.09 * Math.sin(Math.PI * o * 0.75)) * (1 - o * o),
          s.y,
          r,
        ),
      );
    }
    for (let e = 8; e >= 0; e--) {
      let n = a + (e / 8) * 0.16000000000000003,
        o = (n - a) / 0.16000000000000003,
        s = i(n);
      g.push(
        f(
          t,
          s.x + c * (0.07 + 0.09 * Math.sin(Math.PI * o * 0.75)) * (1 - o * o),
          s.y,
          r,
        ),
      );
    }
    (e.surface(g, { colour: s.hair, trace: `tassel${n}`, wobble: 0.005 }),
      e.stroke(g, {
        trace: `tassel-edge${n}`,
        w: 0.02,
        wobble: 0.005,
        colour: s.ink,
        closed: !0,
        coverage: 0.75,
      }));
    let _ = i(a),
      v = i(1);
    for (let i of [-0.05, 0, 0.05])
      e.stroke(
        [
          f(t, _.x + i * c * 0.6, _.y, r),
          f(t, v.x + i * c * 1.6, v.y + l * 0.03, r),
        ],
        {
          trace: `tassel-s${n}${i}`,
          w: 0.012,
          wobble: 0.003,
          colour: s.ink,
          coverage: 0.45,
          singleLayer: !0,
        },
      );
    let y = i(a),
      b = f(t, y.x - c * 0.13, y.y + l * 0.01, r),
      x = f(t, y.x + c * 0.13, y.y - l * 0.01, r);
    e.stroke([b, x], {
      trace: `braidband${n}`,
      w: 0.04,
      wobble: 0.003,
      colour: s.accent,
      pointed: 0.15,
      singleLayer: !0,
    });
  }
}
function E(e, t, n, r, a, c, l) {
  let f = s(n);
  switch (r) {
    case `none`:
      break;
    case `bowl`:
    case `fringe`:
    case `pigtails`:
    case `bun`:
      if (!a) break;
      if (
        (y(e, t, a, c, l.hair, l, `hair`),
        m(e, t, a, l, [-0.5, 0.25], o(n, `hair`)),
        r === `bun`)
      ) {
        let { r, flat: i } = D(n),
          o = x(t, 0, 1.42, a.thickness + r * 0.85),
          s = [];
        for (let e = 0; e < 18; e++) {
          let t = (e / 18) * 6.2832;
          s.push({ x: o.x + Math.cos(t) * r, y: o.y + Math.sin(t) * r * i });
        }
        (e.surface(s, { colour: l.hair, trace: `bun`, wobble: 0.005 }),
          e.stroke(s, {
            trace: `bun-edge`,
            w: 0.022,
            wobble: 0.005,
            colour: l.ink,
            closed: !0,
            coverage: 0.75,
          }));
        let c = [];
        for (let e = 0; e <= 14; e++) {
          let t = e / 14,
            n = t * 6.2832 * 1.6;
          c.push({
            x: o.x + Math.cos(n) * r * 0.6 * t,
            y: o.y + Math.sin(n) * r * 0.55 * t,
          });
        }
        e.stroke(c, {
          trace: `bun-curl`,
          w: 0.012,
          wobble: 0.003,
          colour: l.blank,
          coverage: 0.3,
          singleLayer: !0,
        });
      }
      break;
    case `sidepart`: {
      if (!a) break;
      y(e, t, a, c, l.hair, l, `hair`);
      let r = o(n, `hair`) % 2 == 0 ? 1 : -1,
        s = r * 0.42,
        u = a.bottom(s),
        d = Math.max(0.25, Math.cos(u)),
        f = (e, n, i) => {
          let o = [];
          for (let s = 0; s <= 6; s++) {
            let c = n + ((i - n) * s) / 6,
              l = u + (1.32 - u) * c;
            o.push(
              x(t, e + c * 0.08 * r * (Math.cos(l) / d), l, a.thickness * 0.75),
            );
          }
          return o;
        };
      (e.stroke(f(s, 0, 1), {
        trace: `parting`,
        w: 0.024,
        wobble: 0.002,
        colour: i,
        coverage: 0.52,
        singleLayer: !0,
        calm: !0,
      }),
        e.stroke(f(s + r * 0.055, 0.12, 0.88), {
          trace: `parting-d`,
          w: 0.022,
          wobble: 0.002,
          colour: l.ink,
          coverage: 0.68,
          pointed: 0.85,
          calm: !0,
        }),
        m(e, t, a, l, [s - r * 0.5, s - r * 0.95], o(n, `hair`)));
      break;
    }
    case `curlcloud`: {
      if (!a) break;
      let r = g(t, a, c, { tip: !1 });
      if (r.polygon.length < 4) break;
      let o = u(n, `hair`, `curls`),
        s = w(r.outer, o),
        d = w(r.hairline, o, {
          direction: -1,
          mass: 0.9,
          turn: s.turn,
          division: [3.5, 5.5],
        });
      (e.surface(s.edge.concat(d.edge), {
        colour: l.hair,
        trace: `hair`,
        wobble: 0.006,
      }),
        e.stroke(s.edge, {
          trace: `hair-edge`,
          w: 0.022,
          wobble: 0.004,
          colour: l.ink,
          coverage: 0.75,
        }),
        e.stroke(d.edge, {
          trace: `hair-hairline`,
          w: 0.02,
          wobble: 0.003,
          colour: l.ink,
          coverage: 0.7,
        }));
      let f = l.hairDark,
        m = {
          w: 0.014,
          wobble: 0.002,
          colour: f ? i : l.ink,
          coverage: f ? 0.38 : 0.6,
          singleLayer: !0,
          calm: !0,
        };
      for (let [t, n] of s.wrap.entries())
        e.stroke(p(n.c, n.r, n.turn, n.a0, o.range(4.2, 6.2)), {
          trace: `wrap${t}`,
          ...m,
        });
      for (let [t, n] of d.wrap.entries())
        e.stroke(p(n.c, n.r, n.turn, n.a0, o.range(4.2, 6.2)), {
          trace: `hairlineWrap${t}`,
          ...m,
        });
      for (let n = 0; n < 7; n++)
        for (let r = 0; r < 3; r++) {
          let i = -1.05 + ((n + 0.5 + o.range(-0.3, 0.3)) / 7) * 2.1,
            c = a.bottom(i),
            l = c + (1.5 - c) * ((r + 0.5 + o.range(-0.3, 0.3)) / 3);
          if (l <= c || l >= 1.5) continue;
          let u = x(t, i, l, a.thickness * 0.85);
          e.stroke(
            p(
              u,
              0.042 * o.range(0.55, 1.5),
              s.turn,
              o.range(0, 6.2832),
              o.range(4.2, 6.6),
            ),
            { trace: `ringlet${n}-${r}`, ...m },
          );
        }
      break;
    }
    case `afro`: {
      if (!a) break;
      let r = v(t, a, c, o(n, `hair`));
      if (r.outer.length < 6) break;
      (r.polygon.length >= 6 &&
        e.surface(r.polygon, { colour: l.hair, trace: `hair`, wobble: 0.006 }),
        e.stroke(r.outer, {
          trace: `hair-edge`,
          w: 0.022,
          wobble: 0.004,
          colour: l.ink,
          coverage: 0.75,
        }),
        e.stroke(r.hairline, {
          trace: `hair-hairline`,
          w: 0.02,
          wobble: 0.004,
          colour: l.ink,
          coverage: 0.7,
        }),
        h(e, r.outer, l, o(n, `hair`)),
        d(e, t, a, l, o(n, `hair`)));
      break;
    }
    case `crop`: {
      if (!a) break;
      let n = y(e, t, a, c, l.hair, l, `hair`),
        r = [];
      for (let e = 0; e < 28; e++)
        r.push(-Math.PI + ((e + 0.5) / 28) * 2 * Math.PI);
      for (let t of S(n.outer, r)) {
        let n = t.i,
          r = 0.08 + ((n * 7) % 5) * 0.018;
        e.stroke([t.p, { x: t.p.x + t.n.x * r, y: t.p.y + t.n.y * r }], {
          trace: `spike${n}`,
          w: 0.02,
          wobble: 0.003,
          colour: l.hair,
          pointed: 1,
          singleLayer: !0,
        });
      }
      break;
    }
    case `fuzz`:
      for (let n = 0; n < 5; n++) {
        let r = -0.7 + n * 0.35,
          i = 1.15 + (n % 2) * 0.12;
        e.stroke([x(t, r, i, 0.005), x(t, r + 0.1, i, 0.12 + (n % 3) * 0.03)], {
          trace: `fuzz${n}`,
          w: 0.013,
          wobble: 0.006,
          colour: l.hair,
          pointed: 1,
        });
      }
      break;
    case `curls`:
      for (let n = 0; n < 9; n++) {
        let r = n % 2,
          i = -0.95 + Math.floor(n / 2) * 0.46 + r * 0.22,
          a = Math.max(f(i) + 0.42, 1.02 - r * 0.2),
          o = x(t, i, a, 0.055),
          s = 0.05 - r * 0.008,
          c = [];
        for (let e = 0; e < 10; e++) {
          let t = (e / 10) * 6.2832;
          c.push({ x: o.x + Math.cos(t) * s, y: o.y + Math.sin(t) * s * 0.88 });
        }
        e.stroke(c, {
          trace: `curl${n}`,
          w: 0.014,
          wobble: 0.004,
          colour: l.hair,
          closed: !0,
        });
      }
      break;
    case `spikes`:
      for (let n = 0; n < 9; n++) {
        let r = -1.25 + (n / 8) * 2.5,
          i = f(r) + 0.22;
        e.stroke([x(t, r, i, 0), x(t, r + 0.06, i + 0.12, 0.13)], {
          trace: `spike${n}`,
          w: 0.016,
          wobble: 0.003,
          colour: l.hair,
          pointed: 1,
        });
      }
      break;
    case `mohawk`:
      N(e, t, n, c, l);
      break;
    case `antenna`: {
      let n = x(t, 0.06, 1.32, 0),
        r = x(t, 0.06, 1.5, 0.42);
      (e.stroke([n, { x: (n.x + r.x) / 2 - 0.03, y: (n.y + r.y) / 2 }, r], {
        trace: `antenna`,
        w: 0.013,
        wobble: 0.005,
        colour: l.hair,
        pointed: 0.4,
      }),
        e.dot(r, 0.036, l.hair, { trace: `antennaKnob` }));
      break;
    }
  }
}
function D(e) {
  let t = u(e, `hair`, `bun`);
  return { r: t.range(0.1, 0.24), flat: t.range(0.82, 1.02) };
}
function O(e, t) {
  let { r: n, flat: r } = D(e);
  return (e.head.ry + t + n * 0.85 + n * r) * 1.04;
}
function k(e) {
  let t = u(e, `hair`, `mohawk`),
    n = t.n() < 0.5 ? -1 : 1;
  return {
    n: t.int(6, 9),
    length: t.range(0.4, 0.7),
    windX: n * t.range(0, 0.7),
    windZ: t.range(-0.1, 0.25),
    fan: t.range(0.1, 0.5),
    bend: t.range(0.1, 0.5),
    root: t.range(0.14, 0.2),
    steep: t.range(0.55, 0.8),
  };
}
function A(e) {
  return s(e)(0) + 0.08;
}
function j(e) {
  let { length: t, windX: n, fan: r } = k(e);
  return {
    top:
      (e.head.ry * (1 + Math.max(0, e.head.partingHigh)) + t * 1.05 + 0.08) *
      1.04,
    side: e.head.rx + (Math.abs(n) + r) * t * 0.8 + 0.1,
  };
}
function M(e, n, i, a) {
  let o = e.head,
    s = e.m,
    [c, l] = t(o, () => n, s),
    u = [];
  for (let e = 0; e <= 40; e++) u.push(r(o, c + ((l - c) * e) / 40, n, 0, s));
  let d = u[0],
    f = u[40],
    p = (e) => {
      let t = Math.atan2(e.y, e.x) + Math.PI / 2;
      for (; t > Math.PI;) t -= 2 * Math.PI;
      for (; t <= -Math.PI;) t += 2 * Math.PI;
      return t;
    },
    m = p(d),
    h = p(f),
    g = Math.min(m, h),
    _ = Math.max(m, h),
    v = a
      .map((e) => ({ p: e, a: p(e) }))
      .filter((e) => e.a > g && e.a < _)
      .sort((e, t) => e.a - t.a);
  if (v.length < 4) return [];
  let y = h > m ? [...v].reverse() : v,
    b = y.map((e, t) => {
      let n = t / (y.length - 1),
        r = Math.min(1, Math.min(n, 1 - n) / 0.18),
        a =
          1 +
          (i * (r * r * (3 - 2 * r))) / Math.max(0.3, Math.hypot(e.p.x, e.p.y));
      return { x: e.p.x * a, y: e.p.y * a };
    });
  return [...u, ...b];
}
function N(t, r, i, a, o) {
  let s = k(i),
    c = u(i, `hair`, `mohawk-flames`),
    l = r.head,
    d = r.m,
    p = A(i),
    m = 0.045,
    h = M(r, p, m, a);
  if (h.length < 6) return;
  (t.surface(h, { colour: o.hair, trace: `hair`, wobble: 0.006 }),
    t.stroke(h, {
      trace: `hair-edge`,
      w: 0.024,
      wobble: 0.005,
      colour: o.ink,
      coverage: 0.75,
      closed: !0,
    }));
  let g = [],
    _ =
      0.5 +
      0.28 * (Math.sign(s.windX) || 1) * Math.min(1, Math.abs(s.windX) / 0.4);
  for (let t = 0; t < s.n; t++) {
    let i = s.n === 1 ? 0.5 : t / (s.n - 1),
      a = -1 + 2 * i,
      o = p + 0.05 + (t % 2) * 0.13,
      u = e(a, o, l),
      h = n(a, o, l),
      v = m * 0.6,
      y = { x: u.x + h.x * v, y: u.y + h.y * v, z: u.z + h.z * v },
      b = s.fan * (2 * i - 1) + s.windX,
      x = h.x * (1 - s.steep) + b,
      S = h.y * (1 - s.steep) + s.steep,
      C = h.z * (1 - s.steep) + s.windZ,
      w = Math.hypot(x, S, C) || 1;
    ((x /= w), (S /= w), (C /= w));
    let T = Math.abs(i - _),
      E = Math.max(0.5, 1 - (T / 0.6) * 0.55 * (T / 0.6)),
      D = s.length * E * c.range(0.94, 1.06),
      O = s.bend,
      k = [];
    for (let e = 0; e <= 9; e++) {
      let t = e / 9,
        n = O * t * t * D;
      k.push(
        f(
          r,
          y.x + x * D * t + (s.windX + s.fan * (2 * i - 1) * 0.5) * n,
          y.y + S * D * t + 0.15 * n,
          y.z + C * D * t + s.windZ * n,
        ),
      );
    }
    let A = p + 0.03,
      j = Math.min(
        0.4,
        s.root / Math.max(0.25, l.rx * Math.cos(A)),
        Math.max(0.08, 1.25 - Math.abs(a)),
      ),
      M = (t) => {
        let i = e(t, A, l),
          a = n(t, A, l);
        return f(r, i.x + a.x * v, i.y + a.y * v, i.z + a.z * v);
      },
      N = M(a - j),
      P = M(a + j),
      F = Math.hypot(P.x - N.x, P.y - N.y) / 2,
      I = [N],
      L = [P],
      R = k[1].x - k[0].x,
      z = k[1].y - k[0].y,
      B = Math.sign((N.x - k[0].x) * -z + (N.y - k[0].y) * R) || 1;
    for (let e = 1; e <= 9; e++) {
      let t = e / 9,
        n = k[Math.max(0, e - 1)],
        r = k[Math.min(9, e + 1)],
        i = r.x - n.x,
        a = r.y - n.y,
        o = Math.hypot(i, a) || 1,
        s = F * (1 - t) ** 0.75,
        c = (-a / o) * B,
        l = (i / o) * B;
      (I.push({ x: k[e].x + c * s, y: k[e].y + l * s }),
        L.push({ x: k[e].x - c * s, y: k[e].y - l * s }));
    }
    let V = [...I, ...[...L].reverse()],
      H = [...I.slice(1), ...[...L].reverse().slice(0, 9)],
      U = [];
    for (let e = 1; e <= 6; e++) {
      let t = (b >= 0 ? I : L)[e],
        n = k[e];
      U.push({ x: n.x + (t.x - n.x) * 0.45, y: n.y + (t.y - n.y) * 0.45 });
    }
    let W = d[6] * y.x + d[7] * y.y + d[8] * y.z;
    g.push({ poly: V, edge: H, line: U, depth: W, i: t });
  }
  g.sort((e, t) => e.depth - t.depth);
  for (let e of g)
    (t.surface(e.poly, {
      colour: o.hair,
      trace: `mohawk-flame${e.i}`,
      wobble: 0.005,
    }),
      t.stroke(e.edge, {
        trace: `mohawk-flame-edge${e.i}`,
        w: 0.022,
        wobble: 0.005,
        colour: o.ink,
        coverage: 0.75,
        pointed: 0.2,
      }),
      t.stroke(e.line, {
        trace: `mohawk-flame-line${e.i}`,
        w: 0.014,
        wobble: 0.004,
        colour: o.ink,
        coverage: 0.45,
        singleLayer: !0,
      }));
}
function P(e) {
  let t = {},
    n = e.features.headwear === `hat`,
    r = u(e, `hair`, `fullness`).range(0.85, 1.45),
    i = (e) => (n ? Math.min(e, 0.05) : e * r);
  switch (e.features.hair) {
    case `bowl`:
      t.hair = l(e, i(0.125), { jags: !0 });
      break;
    case `fringe`:
      t.hair = l(e, i(0.12), { depth: -0.16, jags: !0 });
      break;
    case `pigtails`:
    case `bun`:
      t.hair = l(e, i(0.095), {});
      break;
    case `sidepart`:
      t.hair = l(e, i(0.115), {
        lean: (o(e, `hair`) % 2 == 0 ? -1 : 1) * 0.16,
        jags: !0,
      });
      break;
    case `curlcloud`:
      t.hair = l(e, i(0.17), {
        wave: !0,
        lean: (o(e, `hair`) % 2 == 0 ? -1 : 1) * 0.12,
      });
      break;
    case `crop`:
      t.hair = l(e, i(0.035), {});
      break;
    case `mohawk`:
      t.hair = l(e, i(0.045), { fixed: A(e) });
      break;
    case `afro`:
      t.hair = c(e, b(e, n), {});
  }
  return (
    e.features.headwear === `cap` &&
      (t.hat = l(e, 0.085, { depth: 0.06 }, `headwear`)),
    n && t.hair && (t.hair = a(t.hair, C(e))),
    t
  );
}
export { T as a, E as i, j as n, P as r, O as t };
