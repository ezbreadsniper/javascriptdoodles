import { i as e, n as t, r as n, t as r } from "./typeset.js";
import { j as i } from "./core.js";
var a = 100,
  o = 0.04,
  s = {
    rotation: 12.6,
    offset: 0.4,
    size: 0.32,
    gap: 0.39,
    gapVar: 0.4,
    balance: 0.65,
  },
  c = 0.9,
  l = 3.5,
  u = 2.6,
  d = 0.16,
  f = 0.13,
  p = 1.9,
  m = 1.71,
  h = 0.14,
  g = document.createElement(`canvas`).getContext(`2d`);
function _(e, t) {
  ((g.font = `${a}px ${t}`), (g.letterSpacing = `${o * a}px`));
  let n = g.measureText(e);
  return {
    width: n.width / a,
    top: n.actualBoundingBoxAscent / a,
    bottom: n.actualBoundingBoxDescent / a,
  };
}
function v(e, t) {
  let n = t % 1e3;
  return `<filter id="${e}" x="-8%" y="-14%" width="116%" height="128%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${n}" result="grain"/>
    <feDisplacementMap in="SourceGraphic" in2="grain" scale="${p}" xChannelSelector="R" yChannelSelector="G" result="shape"/>
    <feGaussianBlur in="shape" stdDeviation="${(m * 0.6).toFixed(2)}" result="soft"/>
    <feComponentTransfer in="soft" result="colour">
      <feFuncA type="linear" slope="6" intercept="-2.2"/>
    </feComponentTransfer>
    <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="${(n + 7) % 1e3}" result="flecks"/>
    <feColorMatrix in="flecks" type="matrix" result="holes"
      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 ${(h * 3).toFixed(2)} 0 ${(-0.14 * 1.35).toFixed(2)}"/>
    <feComposite in="colour" in2="holes" operator="out"/>
  </filter>`;
}
function y(p, m, h) {
  let g = e(i(m, `mark`).n),
    y = p.toLowerCase().trim().split(/\s+/).filter(Boolean),
    b = y.map((e) => {
      let t = /^\*.+\*$/.test(e),
        r = t ? e.slice(1, -1) : e,
        i = n(g, s, a, t ? { degree: 1.08, turn: 1.4 } : {}),
        o = _(r, h);
      return {
        ...i,
        word: r,
        isAccent: t,
        width: o.width * i.degree,
        top: o.top * i.degree,
        bottom: o.bottom * i.degree,
        turner: [...r].map(() => g(c)),
        boxTurn: g(l),
        register: [g(u), g(u)],
      };
    });
  r(b, s.balance);
  let x = new Map();
  for (let e of b) {
    if (!e.isAccent) continue;
    let t = (e.boxTurn * Math.PI) / 180,
      n = e.degree * d,
      r = e.degree * f,
      i = Math.abs(Math.sin(t)) * (e.width / 2 + n);
    x.set(e, {
      x: -n,
      y: -(e.top + r + i),
      w: e.width + n * 2,
      h: e.top + e.bottom + (r + i) * 2,
    });
  }
  t(b, (e) => e.width);
  let S = [];
  for (let e of b) {
    let t = (e.turn * Math.PI) / 180,
      n = Math.cos(t),
      r = Math.sin(t),
      i = (t, i) => {
        S.push([e.px + t * n - i * r, e.py + t * r + i * n]);
      },
      a = x.get(e);
    if (a) {
      let t = (e.boxTurn * Math.PI) / 180,
        n = a.x + a.w / 2,
        r = a.y + a.h / 2;
      for (let [o, s] of [
        [a.x, a.y],
        [a.x + a.w, a.y],
        [a.x, a.y + a.h],
        [a.x + a.w, a.y + a.h],
      ])
        i(
          n + (o - n) * Math.cos(t) - (s - r) * Math.sin(t) + e.register[0],
          r + (o - n) * Math.sin(t) + (s - r) * Math.cos(t) + e.register[1],
        );
    } else
      for (let [t, n] of [
        [0, -e.top],
        [e.width, -e.top],
        [0, e.bottom],
        [e.width, e.bottom],
      ])
        i(t, n);
  }
  let C = S.map((e) => e[0]),
    w = S.map((e) => e[1]),
    T = a * 0.2,
    E = Math.min(...C) - T,
    D = Math.min(...w) - T,
    O = Math.max(...C) - E + T,
    k = Math.max(...w) - D + T,
    A = b
      .map((e) => {
        let t = `rotate(${e.turn.toFixed(2)} ${e.px.toFixed(1)} ${e.py.toFixed(1)})`,
          n = ``,
          r = x.get(e);
        if (r) {
          let i = e.px + r.x + e.register[0],
            a = e.py + r.y + e.register[1],
            o = i + r.w / 2,
            s = a + r.h / 2;
          n = `<rect x="${i.toFixed(1)}" y="${a.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" transform="${t} rotate(${e.boxTurn.toFixed(2)} ${o.toFixed(1)} ${s.toFixed(1)})" fill="var(--foreground)"/>`;
        }
        let i = [...e.word]
            .map(
              (t, n) =>
                `<tspan dy="${(e.turner[n] * e.degree * 0.006).toFixed(2)}">${t}</tspan>`,
            )
            .join(``),
          a = e.isAccent ? `var(--surface)` : `var(--foreground)`;
        return `${n}<text x="${e.px.toFixed(1)}" y="${e.py.toFixed(1)}" transform="${t}" font-size="${e.degree.toFixed(1)}" letter-spacing="${(o * e.degree).toFixed(2)}" fill="${a}">${i}</text>`;
      })
      .join(``),
    j = `press-${m.toString(36)}`,
    M = y.join(` `).replace(/\*/g, ``);
  return `<svg viewBox="${E.toFixed(1)} ${D.toFixed(1)} ${O.toFixed(1)} ${k.toFixed(1)}" role="img" aria-label="${M}" xmlns="http://www.w3.org/2000/svg"><defs>${v(j, m)}</defs><g filter="url(#${j})">${A}</g></svg>`;
}
function b(e, t) {
  let n = getComputedStyle(e).fontFamily,
    r = null;
  return {
    set(i) {
      i !== r && ((r = i), (e.innerHTML = y(t, i, n)));
    },
  };
}
export { b as n, y as t };
