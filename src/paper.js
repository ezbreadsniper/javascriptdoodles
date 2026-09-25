import { a as e, i as t, n, r, t as i } from "./palette.js";
import { n as a, r as o } from "./pen.js";
var s,
  c = 0,
  l;
function u(e, t) {
  let n = document.createElement(`canvas`);
  ((n.width = Math.round(128 * t)), (n.height = Math.round(128 * t)));
  let i = n.getContext(`2d`);
  if (!i) return;
  i.scale(t, t);
  let a = 2654435769,
    o = () => {
      a = (a + 1831565813) | 0;
      let e = Math.imul(a ^ (a >>> 15), 1 | a);
      return (
        (e = (e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ e),
        ((e ^ (e >>> 14)) >>> 0) / 4294967296
      );
    };
  i.fillStyle = r;
  for (let e = 0; e < 900; e++)
    ((i.globalAlpha = 0.02 + o() * 0.05),
      i.fillRect(o() * 128, o() * 128, 1, 1));
  ((i.strokeStyle = r), (i.lineWidth = 0.6), (i.lineCap = `round`));
  for (let e = 0; e < 70; e++) {
    let e = o() * 128,
      t = o() * 128,
      n = o() * 6.2832,
      r = 2 + o() * 5;
    ((i.globalAlpha = 0.03 + o() * 0.04),
      i.beginPath(),
      i.moveTo(e, t),
      i.lineTo(e + Math.cos(n) * r, t + Math.sin(n) * r),
      i.stroke());
  }
  return e.createPattern(n, `repeat`) ?? void 0;
}
function d(e, n, r, a) {
  (e.save(),
    e.setTransform(1, 0, 0, 1, 0, 0),
    e.clearRect(0, 0, n * a, r * a),
    e.restore(),
    (e.fillStyle = i),
    e.fillRect(0, 0, n, r));
  let o = Math.hypot(n, r) * 0.62,
    d = e.createRadialGradient(
      n * 0.5,
      r * 0.42,
      o * 0.15,
      n * 0.5,
      r * 0.42,
      o,
    );
  (d.addColorStop(0, `rgba(0,0,0,0)`),
    d.addColorStop(1, t),
    (e.fillStyle = d),
    e.fillRect(0, 0, n, r),
    (!s || c !== a || l !== e) && ((s = u(e, a)), (c = a), (l = e)),
    s && (e.save(), (e.fillStyle = s), e.fillRect(0, 0, n, r), e.restore()));
}
var f = 3.6,
  p = { x: 0.03, y: 0.055 },
  m = 0.055;
function h(e, t) {
  return [
    ...g(0, 0, e, 0),
    ...g(e, 0, e, t),
    ...g(e, t, 0, t),
    ...g(0, t, 0, 0),
  ];
}
function g(e, t, n, r) {
  let i = [],
    a = Math.max(2, Math.round(Math.hypot(n - e, r - t) / 0.28));
  for (let o = 0; o < a; o++) {
    let s = o / a;
    i.push({ x: e + (n - e) * s, y: t + (r - t) * s });
  }
  return i;
}
function _(e, t, n, r) {
  let i = Math.hypot(n - e, r - t),
    a = ((n - e) / i) * m,
    o = ((r - t) / i) * m;
  return [
    { x: e - a, y: t - o },
    ...g(e, t, n, r).slice(1),
    { x: n + a, y: r + o },
  ];
}
function v(e, t) {
  let n = new Path2D();
  return (
    e.forEach((e, r) => {
      let i = e.x * t,
        a = e.y * t;
      r === 0 ? n.moveTo(i, a) : n.lineTo(i, a);
    }),
    n.closePath(),
    n
  );
}
function y(t, r, i, s) {
  let c = r / f,
    l = f,
    u = i / c,
    d = h(l, u),
    m = a(t, s, e, o(c), 0),
    g = (e) => {
      (t.save(), t.scale(c, c), e(), t.restore());
    };
  return {
    shadow() {
      g(() => {
        (t.save(),
          t.translate(p.x, p.y),
          m.surface(d, {
            colour: e,
            trace: `arc-shadow`,
            slab: `arc`,
            wobble: 0.004,
          }),
          t.restore());
      });
    },
    path() {
      return v(d, c);
    },
    edge() {
      g(() => {
        let e = [
          [`top`, _(0, 0, l, 0)],
          [`right`, _(l, 0, l, u)],
          [`bottom`, _(l, u, 0, u)],
          [`left`, _(0, u, 0, 0)],
        ];
        for (let [t, r] of e)
          m.stroke(r, {
            trace: `arc-edge-${t}`,
            w: 0.028,
            wobble: 0.009,
            colour: n,
            pointed: 0.7,
            square: !0,
          });
      });
    },
  };
}
export { d as n, y as t };
