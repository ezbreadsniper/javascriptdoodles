var e = (e, t) => Math.max(-t, Math.min(t, e));
function t(t, n, r = 1) {
  return {
    yaw: e(t.yaw * r, n.yaw),
    pitch: e(t.pitch * r, n.pitch),
    roll: e(t.roll * r, n.roll),
  };
}
export { t };
