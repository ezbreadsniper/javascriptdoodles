import "./core-Calr4rc2.js";
import { n as e } from "./field-Byd-702U.js";
var t = 0.024;
function n(n, r, i, a, o, s, c) {
  switch (a) {
    case `none`:
      return;
    case `earring`:
      for (let [e, r] of o.entries()) {
        if (r.nz < -0.1) continue;
        let i = r.to(0, -0.11, 0.02),
          a = 0.04,
          o = [];
        for (let e = 0; e < 14; e++) {
          let t = (e / 14) * 6.2832;
          o.push({
            x: i.x + Math.cos(t) * a,
            y: i.y + a * 1.1 + Math.sin(t) * a,
          });
        }
        (n.stroke(o, {
          trace: `earring${e}`,
          w: t * 0.7,
          wobble: 0.003,
          colour: c.accent,
          closed: !0,
          coverage: 0.95,
        }),
          n.dot(i, 0.012, c.ink, { coverage: 0.7, trace: `extrasFoot${e}` }));
      }
      return;
    case `plaster`: {
      let a = i.layout,
        o = e(
          s * Math.min(0.88, a.eyeU + 0.3),
          a.eyeV * 0.2 + a.mouthV * 0.8,
          r,
        );
      if (o.nz < 0.15) return;
      let l = 0.14,
        u = (e, r) => {
          let i = Math.cos(e),
            a = Math.sin(e),
            s = [
              [-0.14, -0.14 * 0.28],
              [l, -0.14 * 0.28],
              [l, l * 0.28],
              [-0.14, l * 0.28],
            ].map(([e, t]) => o.to(e * i - t * a, -(e * a + t * i)));
          (n.surface(s, {
            colour: c.plaster,
            trace: `plaster${r}`,
            wobble: 0.003,
            square: !0,
            dry: !0,
          }),
            n.stroke(s, {
              trace: `plaster-edge${r}`,
              w: t * 0.6,
              wobble: 0.003,
              colour: c.ink,
              closed: !0,
              coverage: 0.6,
              square: !0,
            }));
        };
      (u(0.7, 0), u(-0.75, 1));
      return;
    }
  }
}
export { n as t };
