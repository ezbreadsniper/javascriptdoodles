import { j as e } from "./core.js";
function t(t, n) {
  let r = e(t, `feather`).n;
  return {
    yaw: 0,
    pitch: 0,
    vYaw: 0,
    vPitch: 0,
    gazeX: 0,
    gazeY: 0,
    awake: 0,
    blinksUntil: 0,
    blinkLength: BLINK,
    blinkAgainAt: 1 / 0,
    nextBlink: n + 0.5 + r() * 5,
    stiff: 7 + r() * 9,
    breathPhase: r() * 6.28,
    breathRate: 0.5 + r() * 0.3,
    babblesUntil: 0,
    nextBabble: n + 3 + r() * 14,
    babbleRate: 7 + r() * 4,
    random: r,
  };
}
var n = (e, t = 1) => (e < -t ? -t : e > t ? t : e),
  r = (e, t, n) => {
    let r = (e - t) / (n - t),
      i = r < 0 ? 0 : r > 1 ? 1 : r;
    return i * i * (3 - 2 * i);
  },
  i = 3.4,
  a = 1.6,
  o = 0.05;

/** Blink lengths in seconds: an ordinary blink, a double blink's second half, a slow one. */
const BLINK = 0.14;
const BLINK_AGAIN = 0.12;
const BLINK_SLOW = 0.46;

/**
 * Starts a blink. `kind` is "single", "double" (two quick blinks) or "slow"
 * (the contented blink of someone at ease); without one, it is picked at random.
 */
function blink(e, time, kind) {
  let roll = e.random();
  kind ??= roll < 0.16 ? `double` : roll < 0.26 ? `slow` : `single`;
  e.blinkLength = kind === `slow` ? BLINK_SLOW : BLINK;
  e.blinksUntil = time + e.blinkLength;
  e.blinkAgainAt = kind === `double` ? e.blinksUntil + 0.09 + e.random() * 0.06 : 1 / 0;
}

function s(e, t, s, c, l, u = {}) {
  let d = Math.min(o, Math.max(0, c)),
    f = u.headRotation ?? 0.4,
    p = (u.reach ?? 7) * t.mass,
    m = 0,
    h = 0,
    g = 0,
    _ = 0,
    v = 0;
  if (s.da) {
    let e = (s.x - t.cx) / p,
      o = (s.y - t.cy) / p;
    ((m = n(e) * f),
      (h = n(o) * f * 0.6),
      (g = n(e * 2.1)),
      (_ = n(o * 2.1)),
      (v = r(Math.hypot(s.x - t.cx, s.y - t.cy) / t.mass, i, a)));
  } else {
    let t = l * 0.24 + e.breathPhase;
    ((m = Math.sin(t) * f * 0.35),
      (h = Math.sin(t * 0.61 + 1.7) * f * 0.16),
      (g = Math.sin(t * 1.13) * 0.5),
      (_ = Math.sin(t * 0.77 + 2.2) * 0.3));
  }
  // Ambient life can point the eyes, and partly the head, at a spot of its
  // own (`u.look`: {x, y, head, weight}), blended over the pointer by weight.
  let look = u.look;
  if (look?.weight > 0) {
    let w = look.weight,
      head = look.head ?? 1,
      x = (look.x - t.cx) / p,
      y = (look.y - t.cy) / p;
    ((m += (n(x) * f * head - m) * w),
      (h += (n(y) * f * 0.6 * head - h) * w),
      (g += (n(x * 2.1) - g) * w),
      (_ += (n(y * 2.1) - _) * w),
      (v *= 1 - w));
  }
  let y = e.stiff,
    b = 2 * Math.sqrt(y);
  ((e.vYaw += (y * (m - e.yaw) - b * e.vYaw) * d),
    (e.vPitch += (y * (h - e.pitch) - b * e.vPitch) * d),
    (e.yaw += e.vYaw * d),
    (e.pitch += e.vPitch * d));
  let x = 1 - Math.exp(-d * 12);
  ((e.gazeX += (g - e.gazeX) * x),
    (e.gazeY += (_ - e.gazeY) * x),
    (e.awake += (v - e.awake) * (1 - Math.exp(-d * 7))),
    l > e.blinkAgainAt &&
      ((e.blinkLength = BLINK_AGAIN),
      (e.blinksUntil = l + BLINK_AGAIN),
      (e.blinkAgainAt = 1 / 0)),
    l > e.nextBlink &&
      (blink(e, l),
      (e.nextBlink = l + (e.awake > 0.5 ? 1.6 : 3) + e.random() * 4)),
    l > e.nextBabble &&
      ((e.babblesUntil = l + 1.2 + e.random() * 1.8),
      (e.nextBabble =
        e.babblesUntil + (e.awake > 0.5 ? 4 : 10) + e.random() * 16)));
}
function c(e, t) {
  if (t >= e.babblesUntil) return 0;
  let n = e.babblesUntil - t,
    r = Math.min(1, n / 0.3),
    i = 0.5 + 0.5 * Math.sin(t * e.babbleRate),
    a = 0.6 + 0.4 * Math.sin(t * e.babbleRate * 0.37 + 1);
  return Math.max(0, r * i * a);
}
function l(e, t, n) {
  let r = Math.sin(t * e.breathRate + e.breathPhase),
    i = 0;
  if (t < e.blinksUntil) {
    let n = 1 - (e.blinksUntil - t) / e.blinkLength;
    i = e.blinkLength > BLINK ? Math.min(1, Math.sin(n * Math.PI) * 1.5) : Math.sin(n * Math.PI);
  }
  return {
    pose: {
      yaw: e.yaw + n.yaw * 0.5,
      pitch: e.pitch + n.pitch * 0.5 + r * 0.012,
      roll: n.roll + r * 0.006,
    },
    gazeX: e.gazeX,
    gazeY: e.gazeY,
    lids: i,
    awake: e.awake,
    mouth: c(e, t),
    time: t,
  };
}
export { l as a, c as i, a as n, s as o, t as r, r as s, i as t, blink };
