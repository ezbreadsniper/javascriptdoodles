/**
 * The title is re-rolled with every sheet and some rolls stand much taller
 * than others. Rows are counted against a standard header so a tall roll
 * shrinks the cells a little instead of dropping a whole row of heads.
 */
var STANDARD_HEADER = 74;
function e(e, t, n, r) {
  let i = e < 560 ? 2 : e < 900 ? 3 : e < 1300 ? 4 : e < 1800 ? 5 : 6,
    a = Math.max(120, t - r.top - r.bottom),
    o = e / i,
    s = Math.max(1, Math.round(Math.max(120, t - STANDARD_HEADER - r.bottom) / o)),
    c = a / s,
    l = [],
    u = Math.min(o * 0.33, c * 0.27);
  for (let e = 0; e < s; e++)
    for (let t = 0; t < i; t++)
      l.push({
        seed: n + e * i + t,
        cx: (t + 0.5) * o,
        cy: r.top + (e + 0.46) * c,
        mass: u,
        w: o,
        h: c,
      });
  return { cells: l, columns: i, rows: s };
}
function t(e) {
  return { top: (e.h * 0.46) / e.mass, side: (e.w * 0.5) / e.mass };
}
function n(e, t, n) {
  let r = -1,
    i = 1 / 0;
  for (let a = 0; a < e.length; a++) {
    let o = e[a],
      s = Math.hypot(o.cx - t, o.cy - n);
    s < i && ((i = s), (r = a));
  }
  return r;
}
export { n, t as r, e as t };
