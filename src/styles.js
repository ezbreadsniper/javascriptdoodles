import { r as e } from "./renderer.js";
var t = [e];
function n(e) {
  let n = t.find((t) => t.id === e);
  if (!n) throw Error(`Unknown Style: ${e}`);
  return n;
}
export { n, t };
