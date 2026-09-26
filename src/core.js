function e(e) {
  return function () {
    ((e |= 0), (e = (e + 1831565813) | 0));
    let t = Math.imul(e ^ (e >>> 15), 1 | e);
    return (
      (t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t),
      ((t ^ (t >>> 14)) >>> 0) / 4294967296
    );
  };
}
function t(t) {
  let r = e((t * 2654435761) % 4294967296);
  for (let e = 0; e < 8; e++) r();
  return n(r);
}
function n(e) {
  return {
    n: e,
    range: (t, n) => t + e() * (n - t),
    int: (t, n) => Math.floor(t + e() * (n - t + 1)),
    pick: (t) => t[Math.floor(e() * t.length)],
    chance: (t) => e() < t,
    weighted: (t) => {
      let n = 0;
      for (let e of t) n += e[1];
      let r = e() * n;
      for (let e of t) if (((r -= e[1]), r <= 0)) return e[0];
      return t[t.length - 1][0];
    },
  };
}
function r(e, t, n, r, i, a = 0.1) {
  let o = e.n();
  if (o < a) return r + (o / a) * (t + a * (n - t) - r);
  if (o > 1 - a) {
    let e = (o - (1 - a)) / a;
    return n - a * (n - t) + e * (i - (n - a * (n - t)));
  }
  return t + o * (n - t);
}
function i(e, t) {
  let n = 2166136261;
  for (let e = 0; e < t.length; e++)
    ((n ^= t.charCodeAt(e)), (n = Math.imul(n, 16777619)));
  return (e ^ (n >>> 0)) >>> 0;
}
function a(e, n) {
  return t(i(e, n));
}
var o = [
    `dot`,
    `button`,
    `ring`,
    `almond`,
    `line`,
    `wink`,
    `sleepy`,
    `wide`,
    `open`,
    `happy`,
    `monolid`,
    `cross`,
    `star`,
    `scribble`,
    `sparkle`,
    `halfmoon`,
    `sideeye`,
    `lashes`,
  ],
  s = [`hook`, `comma`, `line`, `wave`, `button`, `long`, `dots`],
  c = [
    `line`,
    `smile`,
    `small`,
    `wave`,
    `open`,
    `lips`,
    `grin`,
    `teeth`,
    `bucktooth`,
    `crooked`,
    `zigzag`,
  ],
  l = [
    `none`,
    `stubble`,
    `moustache`,
    `handlebar`,
    `walrus`,
    `stubblemoustache`,
  ],
  u = [`none`, `rosy`, `dots`, `freckles`],
  d = [`none`, `thin`, `thick`, `high`, `angled`, `worried`],
  f = [
    `none`,
    `v`,
    `round`,
    `shirt`,
    `knit`,
    `hoodie`,
    `bowtie`,
    `tie`,
    `chain`,
    `scarf`,
    `lanyard`,
  ],
  p = [`none`, `undereyes`, `hatching`, `foreheadlines`, `cheekbones`],
  m = [`ring`, `wide`, `open`, `star`, `button`, `monolid`],
  h = [
    `none`,
    `earring`,
    `plaster`,
    `studs`,
    `hoops`,
    `flower`,
    `lollipop`,
  ],
  g = (e) => e.map((e) => ({ id: e, weight: 1 })),
  _ = (e) => e.map(([e, t]) => ({ id: e, weight: t })),
  v = (e, t) => e.map((e) => (t[e.id] ? { ...e, ...t[e.id] } : e)),
  y = {
    egg: {
      rx: 0.66,
      ry: 0.94,
      rz: 0.66,
      cone: 0.22,
      partingHigh: 0.02,
      bump: 0,
      bumpPhase: 0,
      boxy: 0,
    },
    round: {
      rx: 0.8,
      ry: 0.8,
      rz: 0.74,
      cone: 0.04,
      partingHigh: 0,
      bump: 0,
      bumpPhase: 0,
      boxy: 0.1,
    },
    long: {
      rx: 0.6,
      ry: 1,
      rz: 0.6,
      cone: 0.24,
      partingHigh: 0,
      bump: 0,
      bumpPhase: 0,
      boxy: 0.3,
    },
    pear: {
      rx: 0.7,
      ry: 0.88,
      rz: 0.68,
      cone: -0.16,
      partingHigh: -0.06,
      bump: 0,
      bumpPhase: 0,
      boxy: 0.2,
    },
    block: {
      rx: 0.76,
      ry: 0.86,
      rz: 0.72,
      cone: 0.02,
      partingHigh: 0.05,
      bump: 0,
      bumpPhase: 0,
      boxy: 0.8,
    },
    knobbly: {
      rx: 0.72,
      ry: 0.84,
      rz: 0.66,
      cone: 0.14,
      partingHigh: 0.03,
      bump: 0.5,
      bumpPhase: 2.1,
      boxy: 0.3,
    },
  },
  snugClash = [
    `fuzz`,
    `curls`,
    `spikes`,
    `pigtails`,
    `bun`,
    `mohawk`,
    `afro`,
    `antenna`,
    `curlcloud`,
    `straightbacks`,
    `ghanabraids`,
    `sweptbob`,
  ],
  b = new Set([
    `bowl`,
    `fringe`,
    `sidepart`,
    `curlcloud`,
    `crop`,
    `pigtails`,
    `bun`,
    `afro`,
    `mohawk`,
  ]),
  x = [
    { id: `head`, label: `Head shape`, entries: g(Object.keys(y)) },
    {
      id: `eye`,
      label: `Eyes`,
      entries: v(
        _([
          [`dot`, 1.4],
          [`button`, 1.6],
          [`ring`, 1],
          [`almond`, 1.2],
          [`line`, 0.6],
          [`wink`, 0.7],
          [`sleepy`, 0.9],
          [`wide`, 1.2],
          [`open`, 2],
          [`monolid`, 1.5],
          [`happy`, 1],
          [`cross`, 0.35],
          [`star`, 0.4],
          [`scribble`, 0.5],
          [`sparkle`, 0.16],
          [`halfmoon`, 0.8],
          [`sideeye`, 0.45],
          [`lashes`, 0.9],
        ]),
        {
          lashes: { onlyWith: { eyeSpacing: [`normal`, `wide`] } },
          sideeye: { onlyWith: { eyeSpacing: [`normal`, `wide`] } },
          wide: { onlyWith: { eyeSpacing: [`normal`, `wide`] } },
          ring: { onlyWith: { eyeSpacing: [`normal`, `wide`] } },
          open: { onlyWith: { eyeSpacing: [`normal`, `wide`] } },
          dot: { prefers: { eyeSpacing: [`narrow`] } },
          line: { prefers: { eyeSpacing: [`narrow`] } },
        },
      ),
    },
    {
      id: `nose`,
      label: `Noses`,
      entries: v(
        _([
          [`hook`, 1.4],
          [`comma`, 1],
          [`line`, 0.8],
          [`wave`, 0.8],
          [`button`, 1],
          [`long`, 1.2],
        ]),
        {
          hook: { prefers: { faceSize: [`normal`, `large`] } },
          long: { prefers: { faceSize: [`normal`, `large`] } },
          comma: { prefers: { faceSize: [`small`] } },
        },
      ),
    },
    {
      id: `mouth`,
      label: `Mouths`,
      entries: v(
        _([
          [`line`, 1],
          [`smile`, 2],
          [`small`, 1],
          [`wave`, 0.8],
          [`open`, 0.8],
          [`lips`, 0.9],
          [`grin`, 1.2],
          [`teeth`, 0.8],
          [`bucktooth`, 0.7],
          [`crooked`, 1],
          [`zigzag`, 0.6],
        ]),
        {
          open: { onlyWith: { faceSize: [`normal`, `large`] } },
          grin: { onlyWith: { faceSize: [`normal`, `large`] } },
          teeth: { onlyWith: { faceSize: [`normal`, `large`] } },
          small: { prefers: { faceSize: [`small`] } },
        },
      ),
    },
    {
      id: `hair`,
      label: `Hairstyles`,
      entries: _([
        [`none`, 1.4],
        [`fuzz`, 1.4],
        [`bowl`, 1.4],
        [`fringe`, 1.2],
        [`curls`, 1],
        [`spikes`, 0.8],
        [`antenna`, 0.6],
        [`sidepart`, 1.4],
        [`curlcloud`, 1.1],
        [`crop`, 1],
        [`pigtails`, 0.8],
        [`bun`, 0.8],
        [`mohawk`, 0.45],
        [`afro`, 1.2],
        [`straightbacks`, 0.9],
        [`ghanabraids`, 0.8],
        [`sweptbob`, 0.7],
      ]),
    },
    {
      id: `headwear`,
      label: `Headwear`,
      entries: v(
        _([
          [`none`, 9],
          [`headband`, 1],
          [`cap`, 1],
          [`hat`, 1],
          [`headphones`, 0.9],
          [`beanie`, 1],
          [`backcap`, 0.8],
          [`flatcap`, 0.8],
          [`bucketcap`, 0.8],
        ]),
        {
          headband: { notWith: { hair: [...b] } },
          cap: { notWith: { hair: [...b] } },
          headphones: { notWith: { hair: [...b] } },
          hat: { notWith: { hair: [`pigtails`, `bun`, `mohawk`] } },
          beanie: { notWith: { hair: [...snugClash] } },
          backcap: { notWith: { hair: [...snugClash] } },
          flatcap: { notWith: { hair: [...snugClash] } },
          bucketcap: { notWith: { hair: [...snugClash] } },
        },
      ),
    },
    {
      id: `eyewear`,
      label: `Eyewear`,
      entries: _([
        [`none`, 8],
        [`round`, 1.4],
        [`square`, 1],
      ]),
    },
    {
      id: `beard`,
      label: `Beards`,
      entries: v(
        _([
          [`none`, 12],
          [`stubble`, 1],
          [`moustache`, 0.8],
          [`handlebar`, 0.4],
          [`walrus`, 0.4],
          [`stubblemoustache`, 0.7],
        ]),
        { walrus: { notWith: { mouth: [`lips`] } } },
      ),
    },
    {
      id: `cheek`,
      label: `Cheeks`,
      entries: v(
        _([
          [`none`, 2],
          [`rosy`, 3],
          [`dots`, 1.6],
          [`freckles`, 1.6],
        ]),
        {
          freckles: { prefers: { faceSize: [`small`, `normal`] } },
        },
      ),
    },
    {
      id: `brow`,
      label: `Brows`,
      entries: _([
        [`none`, 2],
        [`thin`, 2],
        [`thick`, 1.2],
        [`high`, 1.2],
        [`angled`, 1],
        [`worried`, 0.8],
      ]),
    },
    {
      id: `collar`,
      label: `Collar`,
      entries: _([
        [`none`, 1.5],
        [`v`, 0.6],
        [`round`, 2.6],
        [`shirt`, 1.5],
        [`knit`, 1.3],
        [`hoodie`, 1],
        [`bowtie`, 0.6],
        [`tie`, 0.8],
        [`chain`, 0.8],
        [`scarf`, 0.8],
        [`lanyard`, 0.6],
      ]),
    },
    {
      id: `mark`,
      label: `Marks`,
      entries: v(
        _([
          [`none`, 6],
          [`undereyes`, 1],
          [`hatching`, 1],
          [`foreheadlines`, 1],
          [`cheekbones`, 1.4],
        ]),
        {
          undereyes: { notWith: { cheek: [`rosy`] } },
          cheekbones: { notWith: { eye: o.filter((e) => !m.includes(e)) } },
        },
      ),
    },
    {
      id: `extras`,
      label: `Extras`,
      entries: v(
        _([
          [`none`, 7],
          [`earring`, 1.2],
          [`plaster`, 0.8],
          [`studs`, 0.9],
          [`hoops`, 0.8],
          [`flower`, 0.7],
          [`lollipop`, 0.6],
        ]),
        {
          studs: { notWith: { headwear: [`headphones`] } },
          hoops: { notWith: { headwear: [`headphones`] } },
          flower: {
            notWith: {
              headwear: [
                `headphones`,
                `hat`,
                `cap`,
                `beanie`,
                `backcap`,
                `flatcap`,
                `bucketcap`,
              ],
            },
          },
          lollipop: {
            notWith: {
              beard: [`walrus`, `handlebar`, `moustache`, `stubblemoustache`],
              mouth: [`open`],
            },
          },
        },
      ),
    },
    {
      id: `piercing`,
      label: `Piercings`,
      entries: v(
        _([
          [`none`, 8],
          [`nosering`, 1.6],
          [`lipring`, 0.4],
        ]),
        {
          nosering: {
            notWith: {
              beard: [`moustache`, `handlebar`, `walrus`, `stubblemoustache`],
            },
          },
          lipring: {
            notWith: {
              beard: [`moustache`, `handlebar`, `walrus`, `stubblemoustache`],
              extras: [`lollipop`],
            },
          },
        },
      ),
    },
  ];
function S(e) {
  let t = x.find((t) => t.id === e);
  if (!t) throw Error(`Unknown Category: ${e}`);
  return t;
}
var C = (e, t) => !e || Object.keys(e).every((n) => e[n].includes(t[n])),
  w = (e, t) => {
    if (!e) return !0;
    for (let n of Object.keys(e)) {
      let r = t[n];
      if (r !== void 0 && e[n].includes(r)) return !1;
    }
    return !0;
  };
function T(e, t, n = {}) {
  let r = S(e).entries,
    i = r.filter((e) => w(e.notWith, n));
  if (!t) return (i.length ? i : r).map((e) => [e.id, e.weight]);
  let a = i.filter((e) => C(e.onlyWith, t));
  return (a.length ? a : i.length ? i : r).map((e) => [
    e.id,
    e.weight * (C(e.prefers, t) && e.prefers ? 3 : 1),
  ]);
}
function E(e, t, n) {
  let r = { ...n };
  delete r[e];
  let i = S(e).entries.find((e) => e.id === t)?.notWith;
  if (i)
    for (let e of Object.keys(i)) {
      let t = r[e];
      if (t !== void 0 && i[e].includes(t)) return e;
    }
  for (let n of Object.keys(r))
    if (
      S(n)
        .entries.find((e) => e.id === r[n])
        ?.notWith?.[e]?.includes(t)
    )
      return n;
}
function D(e, t, n, r = !1) {
  let i = S(e).entries,
    a = i.filter((t) => !E(e, t.id, n)),
    o = a.length ? a : i,
    s = o.filter((e) => C(e.onlyWith, t)),
    c = s.length ? s : o,
    l = r ? c : c.filter((t) => t.id !== n[e]);
  return (l.length ? l : c).map((e) => [
    e.id,
    C(e.prefers, t) && e.prefers ? 3 : 1,
  ]);
}
var O = (e, t, n) => Math.min(n, Math.max(t, e)),
  k = 0.34,
  A = 0.5,
  j = 0.45,
  ee = 1.35,
  te = 0.62,
  M = (e, t, n, r) => (e < t ? r[0] : e > n ? r[2] : r[1]);
function N(e) {
  return {
    eyeU: r(e, 0.3, 0.8, 0.2, 0.9),
    middle: r(e, -0.36, 0.14, -0.55, 0.28),
    spread: r(e, 0.62, 1.1, 0.5, 1.3),
    scale: r(e, 0.78, 1.3, 0.66, 1.55),
  };
}
function P({ eyeU: e, middle: t, spread: n, scale: r }) {
  let i = O(t + 0.26 * n, -0.7, 0.5),
    a = O(t - 0.36 * n, -0.86, 0.06),
    o = i + 0.1 + 0.1 * n,
    s = Math.max(0.04, i - a),
    c = (k * s) / 2,
    l = (A * s) / 2,
    u = i + c,
    d = a + l,
    f = e * j,
    p = Math.max(0.03, Math.min(e - f, ee - e)),
    m = (t) => ({ u: t * e, v: i, halfU: p, halfV: c });
  return {
    eyeU: e,
    eyeV: i,
    browV: o,
    noseV: t,
    mouthV: a,
    zones: {
      eyeL: m(-1),
      eyeR: m(1),
      nose: { u: 0, v: (u + d) / 2, halfU: f, halfV: (u - d) / 2 },
      mouth: { u: 0, v: a, halfU: te, halfV: l },
    },
    fill: O(0.68 + (r - 0.78) * 0.62, 0.63, 1),
    earV: i * 0.6 + 0.02,
    scale: r,
    eyeScale: Math.max(0.7, r * O(e / 0.36, 0.62, 1)),
    placement: {
      eyeSpacing: M(e, 0.38, 0.62, [`narrow`, `normal`, `wide`]),
      facePlacement: M(t, -0.32, -0.05, [`deep`, `middle`, `high`]),
      faceSize: M(r, 0.92, 1.12, [`small`, `normal`, `large`]),
    },
  };
}
function F(e) {
  return P(N(e));
}
function I(e) {
  return {
    rx: r(e, 0.6, 0.86, 0.5, 0.98),
    ry: r(e, 0.8, 1.08, 0.74, 1.2),
    rz: e.range(0.6, 0.78),
    cone: r(e, -0.34, 0.34, -0.58, 0.58),
    partingHigh: r(e, -0.1, 0.16, -0.14, 0.24),
    bump: r(e, 0, 0.5, 0, 0.7),
    bumpPhase: e.range(0, 6.28),
    boxy: e.range(0, 1),
  };
}
function L(e) {
  return {
    yaw: e.range(-0.2, 0.2),
    pitch: e.range(-0.1, 0.1),
    roll: e.range(-0.09, 0.09),
  };
}
function R(e) {
  return e.range(0.34, 0.66);
}
function z(e) {
  return {
    skinT: e.n(),
    hairT: e.n(),
    accentT: e.n(),
    inkT: e.n(),
    clothT: e.n(),
  };
}
function B(e) {
  let n = t(e),
    r = F(a(e, `layout`)),
    i = I(n),
    o = L(n),
    s = R(n),
    c = r.placement,
    l = {},
    u = (e) => {
      let t = n.weighted(T(e, c, l));
      return ((l[e] = t), t);
    },
    d = u(`eye`),
    f = u(`nose`),
    p = u(`mouth`),
    m = u(`hair`),
    h = u(`headwear`),
    g = u(`eyewear`),
    _ = u(`beard`),
    v = u(`brow`),
    y = u(`cheek`),
    b = n.range(-0.05, 0.05),
    x = n.n(),
    S = n.n(),
    C = n.n(),
    w = n.n(),
    E = u(`collar`),
    D = u(`mark`),
    O = n.n(),
    k = u(`extras`),
    A = { skinT: x, hairT: S, accentT: C, inkT: w, clothT: n.n() },
    piercing = u(`piercing`);
  return {
    seed: e,
    head: i,
    pose: o,
    hairlineV: s,
    features: {
      eye: d,
      nose: f,
      mouth: p,
      hair: m,
      headwear: h,
      eyewear: g,
      beard: _,
      brow: v,
      cheek: y,
      collar: E,
      mark: D,
      extras: k,
      piercing,
    },
    layout: r,
    asym: b,
    palette: A,
    pupil: O,
  };
}
var V = [`headShape`, `posture`, `proportions`, `colours`],
  H = [
    `eye`,
    `brow`,
    `nose`,
    `mouth`,
    `cheek`,
    `mark`,
    `hair`,
    `headwear`,
    `eyewear`,
    `beard`,
    `collar`,
    `extras`,
    `piercing`,
  ],
  U = [`headShape`, `proportions`, `posture`, ...H, `colours`],
  W = new Set(H);
function G(e) {
  return W.has(e);
}
var K = new Set([
    `eye`,
    `mouth`,
    `beard`,
    `cheek`,
    `collar`,
    `mark`,
    `hair`,
    `headwear`,
    `eyewear`,
  ]),
  q = {
    eye: (e) => e === `star` || e === `sparkle` || e === `sideeye`,
    mouth: (e) => e === `lips`,
    beard: (e) => e !== `none`,
    cheek: (e) => e === `dots` || e === `freckles`,
    mark: (e) =>
      e === `undereyes` || e === `hatching` || e === `cheekbones`,
    hair: (e) => e !== `none`,
    headwear: (e) =>
      e === `hat` ||
      e === `cap` ||
      e === `beanie` ||
      e === `backcap` ||
      e === `flatcap` ||
      e === `bucketcap`,
    eyewear: (e) => e !== `none`,
    collar: (e) => e !== `none`,
  };
function J(e, t) {
  return t !== void 0 && (q[e]?.(t) ?? !1);
}
function Y(e) {
  return { seed: e, features: {}, counter: {}, revision: {} };
}
var X = (e, t, n) => a(e, `${t}#${n}`),
  Z = (e, t, n, r = 1) =>
    i(e, r > 1 ? `hand:${t}:${n}#${r}` : `hand:${t}:${n}`),
  ne = 40;
function Q(e) {
  let t = B(e.seed),
    n = { ...t.features, ...e.features },
    r = {};
  for (let t of H) {
    let n = e.features[t];
    n === void 0 || !K.has(t) || (r[t] = Z(e.seed, t, n, e.revision[t]));
  }
  let i = e.counter.headShape ?? 0,
    o = i ? I(X(e.seed, `headShape`, i)) : t.head,
    s = e.counter.posture ?? 0,
    c = t.pose,
    l = t.asym;
  if (s) {
    let t = X(e.seed, `posture`, s);
    ((c = L(t)), (l = t.range(-0.05, 0.05)));
  }
  let u = e.counter.proportions ?? 0,
    d = t.layout;
  if (u) {
    let t = X(e.seed, `proportions`, u);
    for (let e = 0; e < ne && ((d = P(N(t))), !re(d.placement, n)); e++);
  }
  let f = e.counter.colours ?? 0,
    p = f ? z(X(e.seed, `colours`, f)) : t.palette;
  f && (r.colours = Z(e.seed, `colours`, String(f)));
  let m = e.features.hair,
    h =
      m === void 0
        ? t.hairlineV
        : R(a(Z(e.seed, `hair`, m, e.revision.hair), `hairline`)),
    g = e.features.eye,
    _ =
      g === void 0
        ? t.pupil
        : a(Z(e.seed, `eye`, g, e.revision.eye), `pupil`).n();
  return {
    ...t,
    head: o,
    pose: c,
    hairlineV: h,
    features: n,
    layout: d,
    asym: l,
    palette: p,
    pupil: _,
    ...(Object.keys(r).length ? { style: r } : {}),
  };
}
function re(e, t) {
  for (let n of H) if (!D(n, e, {}).some(([e]) => e === t[n])) return !1;
  return !0;
}
function ie(e, t, n) {
  if (!G(t))
    return { ...e, counter: { ...e.counter, [t]: (e.counter[t] ?? 0) + 1 } };
  let r = Q(e),
    i = { ...r.features },
    a = n.weighted(D(t, r.layout.placement, i, J(t, i[t]))),
    o = { ...e.revision };
  return (
    e.features[t] !== void 0 && (o[t] = (e.revision[t] ?? 1) + 1),
    { ...e, features: { ...e.features, [t]: a }, revision: o }
  );
}
function $(e, t) {
  let n = Q(e),
    r = { ...n.features },
    i = n.layout.placement;
  return S(t).entries.map((e) => {
    let n = E(t, e.id, r);
    if (n) return { value: e.id, lock: n };
    let a = e.onlyWith;
    return !a || Object.keys(a).every((e) => a[e].includes(i[e]))
      ? { value: e.id }
      : { value: e.id, lock: `placement` };
  });
}
function ae(e, t) {
  return !G(t) || $(e, t).filter((e) => !e.lock).length > 1;
}
var oe = () => n(Math.random),
  se = new Set(V);
function ce(e) {
  let t = [`head=${e.seed}`];
  for (let n of U)
    if (G(n)) {
      let r = e.features[n],
        i = e.revision[n] ?? 1;
      r !== void 0 && t.push(`${n}=${r}${i > 1 ? `.${i}` : ``}`);
    } else {
      let r = e.counter[n] ?? 0;
      r > 0 && t.push(`${n}=${r}`);
    }
  return t.join(`&`);
}
function le(e, t) {
  let n = new URLSearchParams(e.startsWith(`?`) ? e.slice(1) : e),
    r = Number(n.get(`head`)),
    i = Y(Number.isFinite(r) && r > 0 ? Math.floor(r) : t);
  for (let [e, t] of n) {
    if (e === `head`) continue;
    if (se.has(e)) {
      let n = Math.floor(Number(t));
      Number.isFinite(n) && n > 0 && (i.counter[e] = Math.min(n, 9999));
      continue;
    }
    if (!W.has(e)) continue;
    let n = e,
      [r, a] = t.split(`.`, 2);
    if (S(n).entries.some((e) => e.id === r)) {
      i.features[n] = r;
      let e = Math.floor(Number(a));
      Number.isFinite(e) && e > 1 && (i.revision[n] = Math.min(e, 9999));
    }
  }
  return i;
}
export {
  e as A,
  c as C,
  i as D,
  h as E,
  n as M,
  t as O,
  f as S,
  p as T,
  S as _,
  G as a,
  l as b,
  ie as c,
  B as d,
  F as f,
  T as g,
  y as h,
  ae as i,
  a as j,
  r as k,
  ce as l,
  x as m,
  Q as n,
  Y as o,
  b as p,
  oe as r,
  $ as s,
  U as t,
  le as u,
  o as v,
  s as w,
  d as x,
  u as y,
};
