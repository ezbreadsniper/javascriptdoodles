import { d as e, f as t, l as n, t as r, u as i } from "./cloud.js";
function a(i, a) {
  let o = { ...i.head },
    s = r,
    c = 0.012,
    l = t(e(0, 0, o), s),
    u = t(e(c, 0, o), s),
    d = t(e(0, c, o), s),
    f = Math.hypot(u.x - l.x, u.y - l.y) / c,
    p = Math.hypot(d.x - l.x, d.y - l.y) / c;
  return {
    head: o,
    pose: a,
    m: n(a),
    F: s,
    hairlineV: i.hairlineV,
    browV: i.layout.browV,
    refU: f,
    refV: p,
  };
}
function o(e, t, n, r, i = 0) {
  let a = [];
  for (let o = 0; o < r; o++) {
    let s = (o / r) * 6.2832;
    a.push(e.to(Math.cos(s) * t, Math.sin(s) * n, i));
  }
  return a;
}
function s(n, r, a) {
  let { head: o, pose: s, F: c } = a,
    l = 0.012,
    u = i(e(n, r, o), s),
    d = i(e(n + l, r, o), s),
    f = i(e(n, r + l, o), s),
    p = t(u, c),
    m = t(d, c),
    h = t(f, c),
    g = (m.x - p.x) / l,
    _ = (m.y - p.y) / l,
    v = (h.x - p.x) / l,
    y = (h.y - p.y) / l,
    b = Math.hypot(g, _) || 1e-6,
    x = Math.hypot(v, y) || 1e-6,
    S = { x: d.x - u.x, y: d.y - u.y, z: d.z - u.z },
    C = { x: f.x - u.x, y: f.y - u.y, z: f.z - u.z },
    w = S.y * C.z - S.z * C.y,
    T = S.z * C.x - S.x * C.z,
    E = S.x * C.y - S.y * C.x,
    D = Math.hypot(w, T, E) || 1;
  return (
    (w /= D),
    (T /= D),
    (E /= D),
    w * u.x + T * u.y + E * u.z < 0 && ((w = -w), (T = -T), (E = -E)),
    {
      x: p.x,
      y: p.y,
      z: p.z,
      ex: { x: g / b, y: _ / b },
      ey: { x: v / x, y: y / x },
      fx: b / a.refU,
      fy: x / a.refV,
      nrm: { x: w, y: -T },
      nz: E,
      to(e, t, n) {
        let r = this.x + this.ex.x * e * this.fx + this.ey.x * t * this.fy,
          i = this.y + this.ex.y * e * this.fx + this.ey.y * t * this.fy;
        return (
          n && ((r += this.nrm.x * n), (i += this.nrm.y * n)),
          { x: r, y: i }
        );
      },
    }
  );
}
export { s as n, a as r, o as t };
