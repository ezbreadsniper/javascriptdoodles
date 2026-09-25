import { p as e } from "./core-Calr4rc2.js";
import { d as t, i as n, r } from "./cloud-D0bWzE4O.js";
import { n as i, t as a } from "./field-Byd-702U.js";
import { i as o, u as s } from "./shell-DWEMSj-6.js";
import { c, l, r as u, s as d } from "./afro-Cb9KCHLH.js";
function f(e) {
  return Math.max(e.layout.browV + 0.36, e.hairlineV + 0.12);
}
function p(e) {
  let t = s(e, `headwear`, `hatShape`),
    n = t.weighted([
      [`fedora`, 0.3],
      [`trilby`, 0.2],
      [`sun`, 0.18],
      [`tophat`, 0.14],
      [`bucket`, 0.18],
    ]),
    r = t.range(-0.01, 0.05),
    i = t.range(0.05, 0.11),
    a = t.chance(0.3) ? t.range(0.1, 0.26) : t.range(0, 0.05);
  return n === `trilby`
    ? {
        kind: n,
        taper: t.range(0.84, 0.9),
        high: t.range(0.34, 0.44),
        brimX: t.range(1.16, 1.3),
        brimZ: t.range(1.12, 1.24),
        sweep: t.range(-0.04, 0),
        tilt: r,
        dent: t.range(0.05, 0.09),
        finger: !0,
        bandWidth: i,
        fit: a,
      }
    : n === `sun`
      ? {
          kind: n,
          taper: t.range(0.9, 0.98),
          high: t.range(0.26, 0.34),
          brimX: t.range(1.75, 2.05),
          brimZ: t.range(1.6, 1.85),
          sweep: t.range(0.04, 0.12),
          tilt: r,
          dent: t.range(0, 0.03),
          finger: !1,
          bandWidth: i,
          fit: a,
        }
      : n === `tophat`
        ? {
            kind: n,
            taper: t.range(0.98, 1.06),
            high: t.range(0.72, 0.92),
            brimX: t.range(1.2, 1.34),
            brimZ: t.range(1.16, 1.28),
            sweep: t.range(-0.06, -0.02),
            tilt: r,
            dent: 0,
            finger: !1,
            bandWidth: t.range(0.08, 0.14),
            fit: a,
          }
        : n === `bucket`
          ? {
              kind: n,
              taper: t.range(1.02, 1.12),
              high: t.range(0.3, 0.4),
              brimX: t.range(1.3, 1.48),
              brimZ: t.range(1.26, 1.42),
              sweep: t.range(0.06, 0.14),
              tilt: r * 0.5,
              dent: 0,
              finger: !1,
              bandWidth: i,
              fit: a,
            }
          : {
              kind: n,
              taper: t.range(0.8, 0.88),
              high: t.range(0.46, 0.58),
              brimX: t.range(1.42, 1.62),
              brimZ: t.range(1.34, 1.5),
              sweep: t.range(0, 0.05),
              tilt: r + 0.02,
              dent: t.range(0.07, 0.12),
              finger: !0,
              bandWidth: i,
              fit: a,
            };
}
function m(e) {
  let t = p(e),
    n = _(e);
  return {
    top: Math.max(n.y0 + e.head.ry * t.high, n.dome + 0.05) + 0.08,
    side: Math.max(n.bx * t.brimX, e.head.rx * 1.14) + 0.06,
  };
}
function h(e) {
  return _(e).y0 - 0.005;
}
function g(t) {
  let n = t.head.ry;
  if (t.features.hair === `afro`) {
    let e = u(t, !0),
      n = o(t, e),
      r = n * e.high,
      i = n * e.higher;
    return {
      dome: i + r,
      rAt: (e) => {
        let t = (e - i) / r;
        return t * t >= 1 ? 0 : n * Math.sqrt(1 - t * t);
      },
    };
  }
  return { dome: n + (e.has(t.features.hair) ? 0.05 : 0), rAt: () => 0 };
}
function _(e) {
  let n = Math.min(f(e) + p(e).fit, 1.2),
    r = 0,
    i = 0;
  for (let a = 0; a < 24; a++) {
    let o = t((a / 24) * 6.2832, n, e.head);
    ((r = Math.max(r, Math.abs(o.x))), (i = Math.max(i, Math.abs(o.z))));
  }
  let a = t(0, n, e.head).y,
    o = g(e),
    s = 1.1;
  return {
    bx: Math.max(r * s, o.rAt(a) + 0.03),
    bz: Math.max(i * s, o.rAt(a) * (e.head.rz / e.head.rx) + 0.03),
    y0: a,
    dome: o.dome,
  };
}
function v(e, t) {
  let { ry: n } = e.head,
    r = p(t),
    { bx: i, bz: a, y0: o, dome: s } = _(t),
    l = i * r.taper,
    u = a * r.taper,
    d = Math.max(n * r.high, s + 0.05 - o),
    f = Math.max(i * r.brimX, e.head.rx * 1.14),
    m = Math.max(a * r.brimZ, e.head.rz * 1.1),
    h = [],
    g = [],
    v = [],
    b = [],
    x = [],
    S = e.pose.yaw,
    C = (e, t) => Math.atan2(e * Math.sin(S), t * Math.cos(S)),
    w = (t, n, r, i) => {
      let a = C(t, n),
        o = [];
      for (let s = 0; s <= 32; s++) {
        let l = r ? a + (s / 32) * Math.PI : a - (s / 32) * Math.PI;
        o.push(c(e, Math.cos(l) * t, i(l), Math.sin(l) * n));
      }
      return o;
    },
    T = (e) => o - 0.01 - r.sweep - r.tilt * Math.sin(e),
    E = (e) => o + d - r.dent * n * Math.abs(Math.sin(e)),
    D = () => o,
    O = Math.min(0.5, (0.035 + d * 0.06) / Math.max(d, 0.001)),
    k = Math.min(0.75, O + r.bandWidth / Math.max(d, 0.001));
  (h.push(...w(f, m, !1, T)), g.push(...w(f, m, !0, T)));
  let A = 0.03,
    j = w(f, m, !1, (e) => T(e) - A),
    M = w(f, m, !0, (e) => T(e) - A);
  (b.push(...w(i, a, !0, D)), x.push(...w(l, u, !0, E)));
  let N = (e) => w(i + (l - i) * e, a + (u - a) * e, !0, () => o + d * e),
    P = N(O),
    F = N(k);
  v.push(...x, ...w(l, u, !1, E));
  let I = b[0],
    L = b[32];
  v.push(I, L);
  let R = y(v),
    z = R.indexOf(I),
    B = R.indexOf(L),
    V;
  if (z < 0 || B < 0) V = R;
  else {
    let e = R.length,
      t = (B + 1) % e === z ? -1 : 1,
      n = [];
    for (let r = B; n.push(R[r]), r !== z; r = (r + t + e) % e);
    V = n.concat(b.slice(1, 32));
  }
  let H = [];
  if (r.finger) {
    let t = C(l, u);
    for (let r of [-1, 1]) {
      let s = Math.PI / 2 + r * 0.62;
      if ((((s - t) % 6.2832) + 6.2832) % 6.2832 > Math.PI) continue;
      let f = 0.42,
        p = l + (i - l) * f,
        m = u + (a - u) * f;
      H.push([
        c(e, Math.cos(s) * l, E(s) - n * 0.02, Math.sin(s) * u),
        c(e, Math.cos(s) * p, o + d * 0.5800000000000001, Math.sin(s) * m),
      ]);
    }
  }
  return {
    brimBack: h,
    brimFront: g,
    brimBackBottom: j,
    brimFrontBottom: M,
    crownShell: V,
    crownBottomFront: b,
    crownTopFront: x,
    bandBottom: P,
    bandTop: F,
    fingerDents: H,
    shape: r,
  };
}
function y(e) {
  let t = [...e].sort((e, t) => e.x - t.x || e.y - t.y),
    n = (e, t, n) => (t.x - e.x) * (n.y - e.y) - (t.y - e.y) * (n.x - e.x),
    r = [];
  for (let e of t) {
    for (; r.length >= 2 && n(r[r.length - 2], r[r.length - 1], e) <= 0;)
      r.pop();
    r.push(e);
  }
  let i = [];
  for (let e = t.length - 1; e >= 0; e--) {
    let r = t[e];
    for (; i.length >= 2 && n(i[i.length - 2], i[i.length - 1], r) <= 0;)
      i.pop();
    i.push(r);
  }
  return (r.pop(), i.pop(), r.concat(i));
}
function b(e, t, n, r, o) {
  let s = (e) => 0.1 + 1.25 * Math.sin(Math.PI * e),
    c = [],
    l = [];
  for (let e = 0; e <= 26; e++) {
    let n = e / 26,
      r = -1.42 + n * 2.84;
    (c.push(d(t, r, s(n), 0.09)), l.push(i(r, s(n), t).nz > 0.05));
  }
  let u = { w: 0.05, wobble: 0.004, colour: r.ink, pointed: 0.2, coverage: 0.9 };
  if (o === `back`) e.stroke(c, { trace: `temple`, ...u });
  else {
    let t = [],
      n = 0,
      r = () => {
        (t.length >= 2 && e.stroke(t, { trace: `temple-v${n++}`, ...u }), (t = []));
      };
    for (let e = 0; e <= 26; e++) l[e] ? t.push(c[e]) : r();
    r();
  }
  for (let s of [-1, 1]) {
    let c = i(s * 1.44, n.layout.earV, t);
    if (c.nz >= 0.05 != (o === `front`)) continue;
    let l = 0.2,
      u = a(c, l, l * 1.05, 18, 0.02),
      d = a(c, l, l * 1.05, 18, 0.15);
    (e.surface(y(u.concat(d)), {
      colour: r.ink,
      trace: `concha-k${s}`,
      wobble: 0.004,
      coverage: 0.92,
      dry: !0,
    }),
      o !== `back` &&
        (e.surface(d, {
          colour: r.ink,
          trace: `concha-d${s}`,
          wobble: 0.004,
          dry: !0,
        }),
        e.stroke(d, {
          trace: `concha-r${s}`,
          w: 0.014,
          wobble: 0.003,
          colour: r.blank,
          closed: !0,
          coverage: 0.55,
          singleLayer: !0,
        }),
        c.nz > 0.35 &&
          e.stroke(a(c, l * 0.5, l * 0.52, 14, 0.15), {
            trace: `concha-i${s}`,
            w: 0.012,
            wobble: 0.003,
            colour: r.blank,
            closed: !0,
            coverage: 0.6,
            singleLayer: !0,
          })));
  }
}
function x(e, t, n, r, i) {
  if (r === `headphones`) {
    b(e, t, n, i, `back`);
    return;
  }
  if (r !== `hat`) return;
  let a = v(t, n);
  (e.surface(a.brimBack.concat([...a.brimFront].reverse()), {
    colour: i.fabric,
    trace: `brim`,
    wobble: 0.004,
  }),
    e.surface(a.brimBack.concat([...a.brimBackBottom].reverse()), {
      colour: i.fabric,
      trace: `brim-back-k`,
      wobble: 0.004,
      dry: !0,
    }),
    e.stroke(a.brimBack, {
      trace: `brim-back`,
      w: 0.022,
      wobble: 0.004,
      colour: i.ink,
      coverage: 0.7,
    }),
    e.stroke(a.brimBackBottom, {
      trace: `brim-back-under`,
      w: 0.014,
      wobble: 0.003,
      colour: i.ink,
      coverage: 0.45,
      singleLayer: !0,
    }));
}
function S(e, t, i, a, o, s, c) {
  if (a === `none`) return;
  if (a === `headband`) {
    let a = Math.max(i.layout.browV + 0.3, i.hairlineV + 0.02),
      [o, s] = n(t.head, () => a, t.m),
      l = (s - o) * 0.03,
      u = [],
      d = [];
    for (let e = 0; e <= 24; e++) {
      let n = o + l + ((s - o - 2 * l) * e) / 24;
      (u.push(r(t.head, n, a + 0.09, 0, t.m)),
        d.push(r(t.head, n, a - 0.07, 0, t.m)));
    }
    (e.surface(u.concat([...d].reverse()), {
      colour: c.fabric,
      trace: `band`,
      wobble: 0.004,
    }),
      e.stroke(u, {
        trace: `band-top`,
        w: 0.012,
        wobble: 0.003,
        colour: c.ink,
        coverage: 0.5,
      }),
      e.stroke(d, {
        trace: `band-under`,
        w: 0.012,
        wobble: 0.003,
        colour: c.ink,
        coverage: 0.5,
      }));
    return;
  }
  if (a === `headphones`) {
    b(e, t, i, c, `front`);
    return;
  }
  if (a === `hat`) {
    let n = v(t, i);
    (e.surface(n.crownShell, {
      colour: c.fabric,
      trace: `crown`,
      wobble: 0.005,
      square: !0,
    }),
      e.stroke(n.crownShell, {
        trace: `crown-edge`,
        w: 0.024,
        wobble: 0.005,
        colour: c.ink,
        closed: !0,
        coverage: 0.8,
        square: !0,
      }),
      e.stroke(n.crownTopFront, {
        trace: `crown-top`,
        w: 0.016,
        wobble: 0.004,
        colour: c.ink,
        coverage: 0.45,
        singleLayer: !0,
      }));
    for (let [t, r] of n.fingerDents.entries())
      e.stroke(r, {
        trace: `dent${t}`,
        w: 0.013,
        wobble: 0.004,
        colour: c.ink,
        coverage: 0.4,
        pointed: 0.5,
        singleLayer: !0,
      });
    (e.surface(n.brimFront.concat([...n.crownBottomFront].reverse()), {
      colour: c.fabric,
      trace: `brim-front`,
      wobble: 0.004,
    }),
      e.surface(n.brimFront.concat([...n.brimFrontBottom].reverse()), {
        colour: c.fabric,
        trace: `brim-front-k`,
        wobble: 0.004,
        dry: !0,
      }),
      e.stroke(n.brimFront, {
        trace: `brim-front`,
        w: 0.026,
        wobble: 0.004,
        colour: c.ink,
        coverage: 0.85,
      }),
      e.stroke(n.brimFrontBottom, {
        trace: `brim-front-under`,
        w: 0.016,
        wobble: 0.003,
        colour: c.ink,
        coverage: 0.5,
        singleLayer: !0,
      }),
      e.stroke(n.crownBottomFront, {
        trace: `brim-base`,
        w: 0.016,
        wobble: 0.003,
        colour: c.ink,
        coverage: 0.5,
        singleLayer: !0,
      }),
      e.surface(n.bandTop.concat([...n.bandBottom].reverse()), {
        colour: c.fabricDeep,
        trace: `hatband`,
        wobble: 0.003,
        dry: !0,
      }),
      e.stroke(n.bandTop, {
        trace: `hatband-top`,
        w: 0.016,
        wobble: 0.003,
        colour: c.ink,
        coverage: 0.7,
        singleLayer: !0,
      }),
      e.stroke(n.bandBottom, {
        trace: `hatband-under`,
        w: 0.016,
        wobble: 0.003,
        colour: c.ink,
        coverage: 0.55,
        singleLayer: !0,
      }));
    return;
  }
  if (!o) return;
  let u = l(t, o, s);
  if (u.polygon.length < 4) return;
  (e.surface(u.polygon, { colour: c.fabric, trace: `cap`, wobble: 0.005 }),
    e.stroke(u.outer, {
      trace: `cap-edge`,
      w: 0.02,
      wobble: 0.004,
      colour: c.ink,
      coverage: 0.6,
    }));
  let [d, f] = n(t.head, o.bottom, t.m),
    p = [];
  for (let e = 0; e <= 24; e++) {
    let n = d + ((f - d) * e) / 24;
    p.push(r(t.head, n, o.bottom(n), 0.045, t.m));
  }
  (e.stroke(p, {
    trace: `hem`,
    w: 0.034,
    wobble: 0.004,
    colour: c.fabric,
    pointed: 0.25,
  }),
    e.stroke(p, {
      trace: `hem-l`,
      w: 0.011,
      wobble: 0.004,
      colour: c.ink,
      coverage: 0.45,
    }));
}
export { S as a, m as i, v as n, x as o, p as r, h as t };
