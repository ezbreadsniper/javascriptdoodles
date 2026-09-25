(function () {
  let e = document.createElement(`link`).relList;
  if (e && e.supports && e.supports(`modulepreload`)) return;
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
  new MutationObserver((e) => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes)
          e.tagName === `LINK` && e.rel === `modulepreload` && n(e);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(e) {
    let t = {};
    return (
      e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      (t.credentials =
        e.crossOrigin === `use-credentials`
          ? `include`
          : e.crossOrigin === `anonymous`
            ? `omit`
            : `same-origin`),
      t
    );
  }
  function n(e) {
    if (e.ep) return;
    e.ep = !0;
    let n = t(e);
    fetch(e.href, n);
  }
})();
function e(e) {
  return (t) => (e() * 2 - 1) * t;
}
function t(e, t, n, r = {}) {
  let i = n * (1 + e(t.size)) * (r.degree ?? 1);
  return {
    degree: i,
    turn: e(t.rotation) * (r.turn ?? 1),
    dy: e(t.offset) * i,
    gap: n * t.gap * (1 + e(t.gapVar)),
    px: 0,
    py: 0,
  };
}
function n(e, t) {
  if (e.length === 0) return;
  let n = (t) => e.reduce((e, n) => e + t(n), 0) / e.length,
    r = n((e) => e.dy),
    i = n((e) => e.turn);
  for (let n of e) ((n.dy -= r * t), (n.turn -= i * t));
}
function r(e, t) {
  let n = 0;
  return (
    e.forEach((r, i) => {
      ((r.px = n),
        (r.py = r.dy),
        (n += t(r, i) + (i < e.length - 1 ? r.gap : 0)));
    }),
    n
  );
}
export { e as i, r as n, t as r, n as t };
