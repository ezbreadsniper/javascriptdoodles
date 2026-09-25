function e(e, t, n) {
  let r = Math.cos(t),
    i = n.rx * r * Math.sin(e),
    a = n.ry * Math.sin(t),
    o = n.rz * r * Math.cos(e),
    s = t / (Math.PI / 2),
    c = (n.partingHigh + n.cone) / 2,
    l = (n.partingHigh - n.cone) / 2,
    u = 1 + c * s + l * s * s,
    d =
      Math.sin(s * Math.PI + n.bumpPhase) * Math.cos(e + n.bumpPhase * 2.3);
  u *= 1 + n.bump * d * 0.045;
  let f = Math.sin(2 * t),
    p = r * Math.sin(2 * e),
    m = 1 + n.boxy * 0.26 * (0.5 * f * f + 0.5 * p * p);
  return { x: i * u * m, y: a * m, z: o * u * m };
}
function t({ yaw: e, pitch: t, roll: n }) {
  let r = Math.cos(e),
    i = Math.sin(e),
    a = Math.cos(t),
    o = Math.sin(t),
    s = Math.cos(n),
    c = Math.sin(n);
  return [
    s * r - c * o * i,
    -c * a,
    s * i + c * o * r,
    c * r + s * o * i,
    s * a,
    c * i - s * o * r,
    -a * i,
    o,
    a * r,
  ];
}
function n(e, t) {
  return {
    x: e[0] * t.x + e[1] * t.y + e[2] * t.z,
    y: e[3] * t.x + e[4] * t.y + e[5] * t.z,
    z: e[6] * t.x + e[7] * t.y + e[8] * t.z,
  };
}
function r(e, r) {
  return n(t(r), e);
}
function i(e, t) {
  let n = t / (t - e.z);
  return { x: e.x * n, y: -e.y * n, z: e.z, s: n };
}
var a = 4.2,
  o = 0.012;
function s(t, n, r) {
  let i = e(t, n, r),
    a = e(t + o, n, r),
    s = e(t, n + o, r),
    c = a.x - i.x,
    l = a.y - i.y,
    u = a.z - i.z,
    d = s.x - i.x,
    f = s.y - i.y,
    p = s.z - i.z,
    m = l * p - u * f,
    h = u * d - c * p,
    g = c * f - l * d,
    _ = Math.hypot(m, h, g) || 1;
  return (
    (m /= _),
    (h /= _),
    (g /= _),
    m * i.x + h * i.y + g * i.z < 0
      ? { x: -m, y: -h, z: -g }
      : { x: m, y: h, z: g }
  );
}
var c = (e) => (typeof e == `number` ? () => e : e);
function l(t, n = {}) {
  let r = n.nu ?? 72,
    i = n.nv ?? 88,
    a = n.uFrom ?? -Math.PI,
    o = n.uTo ?? Math.PI,
    l = c(n.vFrom ?? -Math.PI / 2),
    u = c(n.vTo ?? Math.PI / 2),
    d = new Float32Array((r + 1) * (i + 1) * 3),
    f = 0;
  for (let c = 0; c <= r; c++) {
    let p = a + ((o - a) * c) / r,
      m = l(p),
      h = u(p);
    if (h !== m)
      for (let r = 0; r <= i; r++) {
        let a = m + ((h - m) * r) / i,
          o = e(p, a, t);
        if (n.thickness) {
          let e = n.thickness(p, a);
          if (e !== 0) {
            let n = s(p, a, t);
            ((o.x += n.x * e), (o.y += n.y * e), (o.z += n.z * e));
          }
        }
        ((d[f++] = o.x), (d[f++] = o.y), (d[f++] = o.z));
      }
  }
  return { xyz: d, n: f / 3 };
}
function u(e, t) {
  let n = t < 0 ? -t : t,
    r = e < 0 ? -e : e;
  if (n === 0 && r === 0) return 0;
  let i = n < r ? n / r : r / n,
    a = i * i,
    o = ((-0.0464964749 * a + 0.15931422) * a - 0.327622764) * a * i + i;
  return (
    r > n && (o = 1.57079633 - o),
    t < 0 && (o = 3.14159265 - o),
    e < 0 ? -o : o
  );
}
function d(e, t, n = {}) {
  let r = n.bins ?? 96,
    i = new Float32Array(r),
    o = a,
    s = r / 6.28318531,
    { xyz: c, n: l } = e,
    d = n.behind,
    h = d?.length ?? 0,
    g = h / 6.28318531,
    _;
  if (d && h > 0) {
    _ = new Float32Array(h);
    for (let e = 0; e < h; e++) {
      let t = d[e];
      _[e] = t.x * t.x + t.y * t.y;
    }
  }
  for (let e = 0, n = 0; e < l; e++, n += 3) {
    let e = c[n],
      a = c[n + 1],
      l = c[n + 2],
      d = t[6] * e + t[7] * a + t[8] * l,
      f = o / (o - d),
      p = (t[0] * e + t[1] * a + t[2] * l) * f,
      m = -(t[3] * e + t[4] * a + t[5] * l) * f,
      v = p * p + m * m,
      y = u(m, p) + 3.14159265;
    if (_ && d < -0.15) {
      let e = (y * g) | 0;
      if ((e >= h ? (e = h - 1) : e < 0 && (e = 0), v <= _[e])) continue;
    }
    let b = (y * s) | 0;
    (b >= r ? (b = r - 1) : b < 0 && (b = 0), v > i[b] && (i[b] = v));
  }
  let v = new Float32Array(r);
  for (let e = 0; e < r; e++) v[e] = Math.sqrt(i[e]);
  if (n.arcAround === void 0)
    return (f(v, r), p(v, r, n.smoothing ?? 3), m(v, r, 0, r - 1));
  let y = ((n.arcAround + Math.PI) * s) | 0;
  y = ((y % r) + r) % r;
  let b = (e) => v[((e % r) + r) % r] > 0;
  if (!b(y))
    for (let e = 1; e < r; e++) {
      if (b(y + e)) {
        y = (y + e) % r;
        break;
      }
      if (b(y - e)) {
        y = (((y - e) % r) + r) % r;
        break;
      }
    }
  if (!b(y)) return [];
  let x = Math.max(2, Math.round(r / 48)),
    S = (e) => {
      let t = 0,
        n = 0;
      for (let i = 1; i < r; i++)
        if (b(y + e * i)) ((t = i), (n = 0));
        else if (++n > x) break;
      return t;
    },
    C = S(-1),
    w = S(1);
  C + w + 1 >= r && ((C = Math.floor((r - 1) / 2)), (w = r - 1 - C));
  let T = new Float32Array(r);
  for (let e = -C; e <= w; e++) {
    let t = (((y + e) % r) + r) % r;
    T[t] = v[t] || (v[(t - 1 + r) % r] + v[(t + 1) % r]) / 2;
  }
  return (p(T, r, n.smoothing ?? 2, y - C, y + w), m(T, r, y - C, y + w));
}
function f(e, t) {
  for (let n = 0; n < t; n++) {
    if (e[n] > 0) continue;
    let r = n,
      i = n,
      a = 0;
    for (; e[(r - 1 + t) % t] === 0 && a++ < t;) r--;
    for (a = 0; e[(i + 1) % t] === 0 && a++ < t;) i++;
    let o = e[(r - 1 + t) % t],
      s = e[(i + 1) % t];
    if (o === 0 || s === 0) continue;
    let c = i - r + 2;
    for (let n = r; n <= i; n++)
      e[((n % t) + t) % t] = o + ((s - o) * (n - r + 1)) / c;
    n = i;
  }
}
function p(e, t, n, r = 0, i = t - 1) {
  let a = new Float32Array(t);
  for (let o = 0; o < n; o++) {
    for (let n = r; n <= i; n++) {
      let o = ((n % t) + t) % t,
        s = 0,
        c = 0;
      for (let a = -3; a <= 3; a++) {
        let o = n + a;
        if (o < r || o > i) continue;
        let l = e[((o % t) + t) % t];
        if (l === 0) continue;
        let u = 1 / (1 + a * a);
        ((s += l * u), (c += u));
      }
      a[o] = c ? s / c : e[o];
    }
    for (let n = r; n <= i; n++) {
      let r = ((n % t) + t) % t;
      e[r] = a[r];
    }
  }
}
function m(e, t, n, r) {
  let i = [];
  for (let a = n; a <= r; a++) {
    let n = ((a % t) + t) % t,
      r = -Math.PI + ((n + 0.5) / t) * Math.PI * 2;
    i.push({ x: Math.cos(r) * e[n], y: Math.sin(r) * e[n] });
  }
  return i;
}
function h(t, n, r, i, o) {
  let c = e(n, r, t);
  if (i !== 0) {
    let e = s(n, r, t);
    ((c.x += e.x * i), (c.y += e.y * i), (c.z += e.z * i));
  }
  let l = a / (a - (o[6] * c.x + o[7] * c.y + o[8] * c.z));
  return {
    x: (o[0] * c.x + o[1] * c.y + o[2] * c.z) * l,
    y: -(o[3] * c.x + o[4] * c.y + o[5] * c.z) * l,
  };
}
function g(e, t, n, r) {
  let i = s(t, n, e);
  return r[6] * i.x + r[7] * i.y + r[8] * i.z;
}
function _(e, t, n, r = 64) {
  let i = 0,
    a = -1 / 0;
  for (let o = 0; o < r; o++) {
    let s = -Math.PI + (o / r) * Math.PI * 2,
      c = g(e, s, t(s), n);
    c > a && ((a = c), (i = s));
  }
  let o = (Math.PI * 2) / r,
    s = (a) => {
      let s = i;
      for (let i = 0; i < r; i++) {
        let r = s + a * o;
        if (g(e, r, t(r), n) <= 0) {
          let i = s,
            a = r;
          for (let r = 0; r < 14; r++) {
            let r = (i + a) / 2;
            g(e, r, t(r), n) > 0 ? (i = r) : (a = r);
          }
          return a;
        }
        s = r;
      }
      return s;
    };
  return [s(-1), s(1)];
}
export {
  d as a,
  n as c,
  e as d,
  i as f,
  _ as i,
  t as l,
  s as n,
  l as o,
  h as r,
  g as s,
  a as t,
  r as u,
};
