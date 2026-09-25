import { A as e } from "./core-Calr4rc2.js";
var t = { x: 1, y: 0 },
  n = { x: 0, y: 1 },
  r = 12,
  i = 40,
  a = 52;
function o(e, t = 95) {
  return Math.max(0.62, Math.min(1.3, (t / Math.max(1, e)) ** 0.4));
}
function s(r, i, o, s = 1, l = 0, u = !0) {
  let d = new Map(),
    f = Math.imul(l | 0, 2654435761) >>> 0,
    p = (t, n = !1) => {
      let r = n ? `${t}!` : t,
        o = d.get(r);
      if (o) return o;
      let s = 2166136261;
      for (let e = 0; e < t.length; e++)
        ((s ^= t.charCodeAt(e)), (s = Math.imul(s, 16777619)));
      let c = e((i ^ (s >>> 0)) >>> 0),
        l = e((i ^ (s >>> 0) ^ f) >>> 0);
      for (let e = 0; e < 6; e++) (c(), l());
      o = new Float32Array(a);
      for (let e = 0; e < a; e++) {
        let t = c() * 2 - 1;
        o[e] = n ? t : t * 0.62 + (l() * 2 - 1) * 0.5;
      }
      return (d.set(r, o), o);
    },
    v = (e, t) => {
      if (t >= 1) return p(e);
      if (t <= 0) return p(e, !0);
      let n = `${e}#${Math.round(t * 8)}`,
        r = d.get(n);
      if (r) return r;
      let i = p(e, !0),
        o = p(e);
      r = new Float32Array(a);
      for (let e = 0; e < a; e++) r[e] = i[e] * (1 - t) + o[e] * t;
      return (d.set(n, r), r);
    },
    y = (e, t) => {
      if (e.length < 2) return;
      let n = (t.w ?? 0.024) * s,
        i = t.colour ?? o,
        a = t.coverage ?? 0.9,
        l = c(e, !!t.closed, !t.square);
      if (l.length < 2) return;
      let u = 0;
      for (let e = 1; e < l.length; e++)
        u += Math.hypot(l[e].x - l[e - 1].x, l[e].y - l[e - 1].y);
      let d = Math.max(0.5, Math.min(1, u / 0.5)),
        f = (t.wobble ?? 0.007) * d,
        p = t.calm ? 0 : Math.max(0, Math.min(1, (u - 0.4) / 0.8));
      (_(r, g(l, n, f, v(t.trace, p), t.pointed ?? 0.75), i, a),
        !t.singleLayer &&
          _(
            r,
            g(l, n * 0.5, f * 1.7 + 0.004, v(`${t.trace}~`, p), t.pointed ?? 0.75),
            i,
            a * 0.32,
          ));
    },
    b = new Map(),
    x = (e) => {
      let t = b.get(e);
      if (t) return t;
      let n = p(e ? `register-${e}` : `register`, !0),
        r = n[0] * Math.PI,
        i = 0.008 + Math.abs(n[1]) * 0.008;
      return (
        (t = {
          dx: Math.cos(r) * i,
          dy: Math.sin(r) * i,
          scale: 1 + n[2] * 0.015,
        }),
        b.set(e, t),
        t
      );
    };
  return {
    stroke: y,
    surface: (e, t) => {
      if (e.length < 3) return;
      let n = t.trace
          ? h(c(e, !0, !t.square), p(t.trace), t.wobble ?? 0.006)
          : c(e, !0, !t.square),
        i = t.coverage ?? 1;
      if (u && !t.dry) {
        let e = x(t.slab ?? ``);
        ((n = m(n, e.scale, e.dx, e.dy)), _(r, m(n, 1.03), t.colour, i * 0.14));
      }
      _(r, n, t.colour, i);
    },
    dot: (e, i, a, o = {}) => {
      if (i <= 0) return;
      let s = p(o.trace ?? `dot`, !0),
        c = o.coverage ?? 1,
        l = o.stretch ?? 1,
        u = 0.86 + Math.abs(s[7]) * 0.16,
        d = (o.turn ?? 0) + s[6] * 0.6,
        f = Math.cos(d),
        g = Math.sin(d),
        v = e.x + s[4] * i * 0.07,
        y = e.y + s[5] * i * 0.07,
        b = o.field?.ex ?? t,
        x = o.field?.ey ?? n,
        S = o.field?.fx ?? 1,
        C = o.field?.fy ?? 1,
        w = Math.max(8, Math.min(24, Math.round((6.2832 * i) / 0.028))),
        T = [];
      for (let e = 0; e < w; e++) {
        let t = (e / w) * 6.2832,
          n = Math.cos(t) * i * l,
          r = Math.sin(t) * i * u,
          a = n * f - r * g,
          o = n * g + r * f;
        T.push({
          x: v + b.x * a * S + x.x * o * C,
          y: y + b.y * a * S + x.y * o * C,
        });
      }
      let E = h(T, s, Math.min(0.007, i * 0.15));
      (o.noHem || _(r, m(E, 1.07), a, c * 0.16), _(r, E, a, c * 0.94));
    },
    ctx: r,
  };
}
function c(e, t, n) {
  let r = t ? e : l(e);
  if (r.length < 2) return r;
  let i = n && r.length > 2 ? u(r, t) : r,
    a = 0,
    o = t ? i.length : i.length - 1;
  for (let e = 0; e < o; e++) {
    let t = i[e],
      n = i[(e + 1) % i.length];
    a += Math.hypot(n.x - t.x, n.y - t.y);
  }
  if (a < 1e-6) return i;
  let s = Math.max(6, Math.min(180, Math.round(a / 0.022))),
    c = [],
    d = a / s,
    f = 0;
  c.push(i[0]);
  for (let e = 0; e < o; e++) {
    let t = i[e],
      n = i[(e + 1) % i.length],
      r = Math.hypot(n.x - t.x, n.y - t.y);
    if (r < 1e-9) continue;
    let a = 0;
    for (; f + (1 - a) * r >= d;)
      ((a += (d - f) / r),
        c.push({ x: t.x + (n.x - t.x) * a, y: t.y + (n.y - t.y) * a }),
        (f = 0));
    f += (1 - a) * r;
  }
  if (!t) {
    let e = i[i.length - 1],
      t = c[c.length - 1];
    Math.hypot(e.x - t.x, e.y - t.y) > d * 0.5
      ? c.push(e)
      : (c[c.length - 1] = e);
  }
  if (t) {
    let e = Math.max(2, Math.round(c.length * 0.035));
    for (let t = 0; t < e; t++) c.push(c[t % c.length]);
  }
  return c;
}
function l(e) {
  let t = [e[0]];
  for (let n = 1; n < e.length; n++) {
    let r = e[n],
      i = t[t.length - 1];
    Math.hypot(r.x - i.x, r.y - i.y) > 1e-7 && t.push(r);
  }
  return t;
}
function u(e, t) {
  let n = [],
    r = e.length,
    i = (n) => (t ? e[((n % r) + r) % r] : e[Math.max(0, Math.min(r - 1, n))]),
    a = t ? r : r - 1;
  for (let e = 0; e < a; e++) {
    let t = i(e - 1),
      r = i(e),
      a = i(e + 1),
      o = i(e + 2);
    for (let e = 0; e < 6; e++) {
      let i = e / 6,
        s = i * i,
        c = s * i;
      n.push({
        x:
          0.5 *
          (2 * r.x +
            (-t.x + a.x) * i +
            (2 * t.x - 5 * r.x + 4 * a.x - o.x) * s +
            (-t.x + 3 * r.x - 3 * a.x + o.x) * c),
        y:
          0.5 *
          (2 * r.y +
            (-t.y + a.y) * i +
            (2 * t.y - 5 * r.y + 4 * a.y - o.y) * s +
            (-t.y + 3 * r.y - 3 * a.y + o.y) * c),
      });
    }
  }
  return (t || n.push(e[r - 1]), n);
}
function d(e, t, n, r) {
  let i = r * (n - 3),
    a = Math.floor(i),
    o = i - a,
    s = (r) => e[t + Math.max(0, Math.min(n - 1, r))],
    c = s(a - 1),
    l = s(a),
    u = s(a + 1),
    d = s(a + 2),
    f = o * o;
  return (
    0.5 *
    (2 * l +
      (-c + u) * o +
      (2 * c - 5 * l + 4 * u - d) * f +
      (-c + 3 * l - 3 * u + d) * f * o)
  );
}
function f(e, t) {
  return d(e, 0, r, t) + 0.35 * d(e, r, i, t);
}
function p(e) {
  let t = [];
  for (let n = 0; n < e.length; n++) {
    let r = e[Math.max(0, n - 1)],
      i = e[Math.min(e.length - 1, n + 1)],
      a = i.x - r.x,
      o = i.y - r.y,
      s = Math.hypot(a, o) || 1;
    t.push({ x: -o / s, y: a / s });
  }
  return t;
}
function m(e, t, n = 0, r = 0) {
  let i = 0,
    a = 0;
  for (let t of e) ((i += t.x), (a += t.y));
  return (
    (i /= e.length),
    (a /= e.length),
    e.map((e) => ({ x: i + (e.x - i) * t + n, y: a + (e.y - a) * t + r }))
  );
}
function h(e, t, n) {
  let r = p(e);
  return e.map((i, a) => {
    let o = f(t, a / (e.length - 1)) * n;
    return { x: i.x + r[a].x * o, y: i.y + r[a].y * o };
  });
}
function g(e, t, n, r, i) {
  let a = p(e),
    o = e.length - 1,
    s = [],
    c = [];
  for (let l = 0; l <= o; l++) {
    let u = l / o,
      d = f(r, u) * n,
      p = Math.min(1, Math.sin(Math.PI * Math.min(1, Math.max(0, u))) ** 0.35),
      m = (t * ((1 - i + i * p) * (0.9 + 0.1 * f(r, (u + 0.37) % 1)))) / 2,
      h = a[l].x,
      g = a[l].y,
      _ = e[l].x + h * d,
      v = e[l].y + g * d;
    (s.push({ x: _ + h * m, y: v + g * m }),
      c.push({ x: _ - h * m, y: v - g * m }));
  }
  return (c.reverse(), s.concat(c));
}
function _(e, t, n, r) {
  (e.save(),
    (e.globalAlpha = r),
    (e.fillStyle = n),
    e.beginPath(),
    e.moveTo(t[0].x, t[0].y));
  for (let n = 1; n < t.length; n++) e.lineTo(t[n].x, t[n].y);
  (e.closePath(), e.fill(), e.restore());
}
export { s as n, o as r, c as t };
