import "./typeset-CUjnR0Vm.js";
/* empty css              */ import { d as e } from "./core-Calr4rc2.js";
import { a as t } from "./renderer-C3DGeLHd.js";
import { n, t as r } from "./styles-zTSe_jfC.js";
import { n as i, r as a, t as o } from "./grid-BvhlnsKk.js";
import { a as s, o as c, r as l } from "./gaze-aE3KNnIw.js";
import { t as u } from "./names-sz4Uk_9t.js";
import { n as d } from "./logo-D0SOOUt5.js";
var ee = {
    duration: 420,
    easing: `cubic-bezier(0.16, 0.9, 0.3, 1)`,
    fill: `forwards`,
  },
  te = { duration: 130, easing: `ease-in`, fill: `forwards` },
  ne = 7;
function re(e) {
  let t = document.createElement(`div`);
  t.className = `names`;
  let n = document.createElement(`span`);
  ((n.className = `name-large`), (n.hidden = !0), document.body.append(t, n));
  let r = [],
    i = -1,
    a = -1,
    o = null,
    s = null,
    c = 0,
    l = null;
  function u(e, t) {
    ((e.style.left = `${t.x}px`),
      (e.style.top = `${t.y}px`),
      (e.style.fontSize = `${t.px}px`));
  }
  function d() {
    if (((s = o), s === null || l === null)) {
      ((n.hidden = !0), (n.textContent = ``));
      return;
    }
    if (((n.textContent = s), u(n, l), (n.hidden = !1), e)) {
      n.style.opacity = `1`;
      return;
    }
    (n.style.removeProperty(`opacity`),
      n.animate(
        [
          { opacity: 0, transform: `translate(-50%, ${ne}px)` },
          { opacity: 1, transform: `translate(-50%, 0)` },
        ],
        ee,
      ));
  }
  return {
    setGrid(e) {
      ((r = e.map((e) => {
        let t = document.createElement(`span`);
        return ((t.textContent = e.text), u(t, e.spot), t);
      })),
        t.replaceChildren(...r),
        (a = -1));
    },
    state(e, n) {
      (e !== i && ((t.style.opacity = String(e)), (i = e)),
        n !== a &&
          (r[a]?.style.removeProperty(`visibility`),
          r[n]?.style.setProperty(`visibility`, `hidden`),
          (a = n)));
    },
    setLarge(t, r) {
      if ((r && (l = r), r && s !== null && s === o && u(n, r), t === o))
        return;
      o = t;
      let i = ++c;
      if (s === null || e) return d();
      n.animate([{ opacity: 0 }], te)
        .finished.then(() => {
          i === c && d();
        })
        .catch(() => {});
    },
  };
}
var f = Math.min(window.devicePixelRatio || 1, 2),
  ie = n(r[0].id),
  p = matchMedia(`(prefers-reduced-motion: reduce)`).matches,
  m = { top: 74, bottom: 56 },
  ae = 0.33,
  oe = 0.13,
  se = 40,
  ce = 0.9,
  h = document.getElementById(`sheet`),
  g = h.getContext(`2d`),
  _ = re(p),
  le = `all my *friends* are made of *javascript*`,
  ue = document.querySelector(`.head`),
  de = d(document.getElementById(`logo`), le),
  v = 0,
  y = 0,
  b = [],
  x = 1,
  S = new Map(),
  C = new Map(),
  w = [],
  T = -1;
function E(t) {
  let n = C.get(t);
  return (n || ((n = e(t)), C.set(t, n)), n);
}
var D = { x: 0, y: 0, da: !1 },
  O = 0,
  k = { i: -1, t: 0, target: 0 },
  A = 0,
  j = 0;
function fe() {
  (K.clear(),
    (v = document.documentElement.clientWidth),
    (y = document.documentElement.clientHeight),
    (h.width = Math.round(v * f)),
    (h.height = Math.round(y * f)),
    (h.style.width = `${v}px`),
    (h.style.height = `${y}px`),
    g.setTransform(f, 0, 0, f, 0, 0),
    M(),
    U());
}
function M() {
  let e = w[T] ?? 1;
  de.set(e);
  let t = ue.querySelector(`svg`)?.getBoundingClientRect().height ?? 0;
  ((m.top = Math.round(ue.getBoundingClientRect().height + t * ae)),
    (b = o(v, y, e, m).cells),
    (x = ge()));
  let n = new Set(b.map((e) => e.seed));
  for (let e of S.keys()) n.has(e) || S.delete(e);
  for (let e of C.keys()) n.has(e) || C.delete(e);
  for (let e of b) S.has(e.seed) || S.set(e.seed, l(e.seed, A));
  (k.i >= b.length && R(), pe());
}
function pe() {
  (h.setAttribute(`aria-label`, `Sheet of ${b.length} rolled heads`),
    _.setGrid(b.map((e) => ({ text: u(e.seed), spot: ve(G(e, 0)) }))));
}
function N(e = Math.floor(Math.random() * 9e5) + 1) {
  (w.splice(T + 1), w.push(e), (T = w.length - 1), S.clear(), v > 0 && M());
}
function P() {
  (R(), N(), U());
}
function F(e) {
  let t = T + e;
  t < 0 || t >= w.length || ((T = t), M(), U());
}
var I = new Set();
function L(e) {
  e < 0 ||
    e >= b.length ||
    (I.clear(), B(e), (k.target = 1), document.body.classList.add(`large`), U());
}
function R() {
  ((k.target = 0), document.body.classList.remove(`large`), U());
}
var z = document.getElementById(`to-workshop`);
function B(e) {
  ((k.i = e), I.add(e));
  let t = b[e];
  z && t && (z.href = `/workshop.html?head=${t.seed}&sheet=${w[T]}`);
}
function V(e) {
  (B(e), (k.t = Math.min(k.t, 0.82)));
}
function H() {
  (I.clear(), (k.i = 0), N());
}
function me() {
  if (k.target === 0 || b.length < 2) return;
  let e = b.map((e, t) => t).filter((e) => !I.has(e));
  (e.length === 0 && (H(), (e = b.map((e, t) => t))),
    V(e[Math.floor(Math.random() * e.length)]));
}
function he(e, t) {
  let n = b[k.i];
  if (!n) return !1;
  let r = G(n, 1);
  return (
    Math.abs(e - r.cx) < r.mass * 1.3 &&
    t > r.cy - r.mass * 1.5 &&
    t < r.cy + r.mass * 1.95
  );
}
function U() {
  p && ((k.t = k.target), k.target === 0 && (k.i = -1), v > 0 && q());
}
function W(e) {
  if (k.target !== 0) {
    if (I.size >= b.length) return (H(), V(e > 0 ? 0 : b.length - 1));
    V((k.i + e + b.length) % b.length);
  }
}
function ge() {
  let e = 1;
  for (let n of b) {
    let r = ie.space?.(E(n.seed)) ?? t,
      i = a(n);
    e = Math.min(e, i.top / r.top, i.side / r.side);
  }
  return e;
}
function G(e, t) {
  let n = e.mass * x;
  if (t <= 0) return { cx: e.cx, cy: e.cy, mass: n };
  let r = t,
    i = Math.min(v * 0.32, (y - m.top - m.bottom) * 0.31) * x;
  return {
    cx: e.cx + (v / 2 - e.cx) * r,
    cy: e.cy + ((m.top + y - m.bottom) / 2 - e.cy) * r,
    mass: n + (i - n) * r,
  };
}
var K = new Map();
function _e(e, t) {
  let n = K.get(e);
  return (
    n === void 0 &&
      ((n = getComputedStyle(document.body).getPropertyValue(e).trim() || t),
      K.set(e, n)),
    n
  );
}
function ve(e) {
  let t = Math.max(9, Math.min(13, e.mass * 0.13));
  return { x: e.cx + t * 0.11, y: e.cy + e.mass * 1.68, px: t };
}
function q() {
  let e = ie.makeSheet(g, v, y, w[T] ?? 1, f),
    t = k.t;
  for (let t = 0; t < b.length; t++) {
    let n = b[t];
    if (t === k.i && k.t > 0) continue;
    let r = S.get(n.seed),
      i = E(n.seed);
    e.drawHead(i, G(n, 0), s(r, A, i.pose));
  }
  let n = k.t > 0.001 ? Math.min(1, t * 1.25) : 0;
  if (n > 0) {
    (g.save(),
      (g.globalAlpha = n),
      (g.fillStyle = _e(`--surface`, `#f7f5f1`)),
      g.fillRect(0, 0, v, y),
      g.restore());
    let t = b[k.i],
      r = S.get(t.seed),
      i = E(t.seed);
    e.drawHead(i, G(t, k.t), s(r, A, i.pose));
  }
  _.state(1 - n, k.t > 0 ? k.i : -1);
  let r = k.t > ce ? b[k.i] : void 0;
  (_.setLarge(r ? u(r.seed) : null, r ? ve(G(r, 1)) : null), e.done());
}
function ye(e) {
  requestAnimationFrame(ye);
  let t = Math.min(0.05, (e - j) / 1e3);
  if (
    ((j = e),
    (A += t),
    !(!D.da && A - O > 12 && k.target === 0 && Math.floor(A * 30) % 2 == 0))
  ) {
    for (let e of b) {
      let n = S.get(e.seed);
      n && c(n, e, D, t, A, { headRotation: 0.34 });
    }
    (be(t), q());
  }
}
function be(e) {
  ((k.t += (k.target - k.t) * (1 - Math.exp(-e / oe))),
    k.target === 1 && k.t > 0.998 && (k.t = 1),
    k.target === 0 && k.t < 0.002 && ((k.t = 0), (k.i = -1)));
}
function xe(e) {
  ((D.x = e.clientX), (D.y = e.clientY), (D.da = !0), (O = A), Z());
}
addEventListener(`pointermove`, xe);
var J = { x: 0, y: 0, moving: !1 };
addEventListener(`pointerdown`, (e) => {
  e.pointerType === `touch` &&
    (xe(e), (J.x = e.clientX), (J.y = e.clientY), (J.moving = !1));
});
function Se(e) {
  if (e.pointerType !== `touch`) return;
  D.da = !1;
  let t = e.clientX - J.x,
    n = e.clientY - J.y;
  e.type === `pointerup` &&
    k.target === 1 &&
    Math.abs(t) > se &&
    Math.abs(t) > Math.abs(n) * 1.5 &&
    (W(t < 0 ? 1 : -1), (J.moving = !0));
}
(addEventListener(`pointerup`, Se),
  addEventListener(`pointercancel`, Se),
  addEventListener(`pointerleave`, () => {
    D.da = !1;
  }),
  addEventListener(`click`, (e) => {
    if (
      !e.target?.closest(`.bar, .head, .to-workshop`) &&
      getSelection()?.isCollapsed !== !1
    ) {
      if (J.moving) {
        J.moving = !1;
        return;
      }
      if (k.target === 1) return he(e.clientX, e.clientY) ? me() : R();
      L(i(b, e.clientX, e.clientY));
    }
  }));
var Y = { passive: !1 };
(addEventListener(`gesturestart`, (e) => e.preventDefault(), Y),
  addEventListener(
    `touchmove`,
    (e) => {
      e.touches.length > 1 && e.preventDefault();
    },
    Y,
  ),
  addEventListener(`dblclick`, (e) => e.preventDefault(), Y),
  addEventListener(`keydown`, (e) => {
    if (e.key === `Escape`) return R();
    if (e.key === `ArrowLeft`) return k.target === 1 ? W(-1) : F(-1);
    if (e.key === `ArrowRight`) return k.target === 1 ? W(1) : F(1);
    (e.key === ` ` || e.key === `r` || e.key === `R`) &&
      (e.preventDefault(), P());
  }),
  document.getElementById(`roll`)?.addEventListener(`click`, P));
var X;
function Z() {
  (document.body.classList.remove(`rest`),
    clearTimeout(X),
    (X = window.setTimeout(() => document.body.classList.add(`rest`), 3200)));
}
for (let e of [`pointerdown`, `keydown`]) addEventListener(e, Z);
var Ce = ``;
new ResizeObserver(() => {
  let e = `${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`;
  e !== Ce && ((Ce = e), fe());
}).observe(document.documentElement);
var Q = new URLSearchParams(location.search),
  $ = Number(Q.get(`sheet`)),
  we = Number(Q.get(`head`));
(R(), N(Number.isFinite($) && $ > 0 ? Math.floor($) : void 0), fe());
var Te = b.findIndex((e) => e.seed === we);
(Te >= 0 && (L(Te), (k.t = 1)),
  (Q.has(`sheet`) || Q.has(`head`)) && history.replaceState(null, ``, `/`),
  Z(),
  p
    ? q()
    : requestAnimationFrame((e) => {
        ((j = e), ye(e));
      }));
