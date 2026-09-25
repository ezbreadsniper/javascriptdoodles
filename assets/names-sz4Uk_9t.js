import { j as e } from "./core-Calr4rc2.js";
var t =
    `ka.mi.to.ru.sen.bo.na.vel.ori.lum.tas.ked.pil.mor.yun.sab.edo.ris.qua.nim.ol.hes.dun.wai.per.gil`.split(
      `.`,
    ),
  n = [
    `la`,
    `ro`,
    `ni`,
    `ta`,
    `ke`,
    `su`,
    `mo`,
    `vi`,
    `ren`,
    `dal`,
    `ko`,
    `pes`,
    `tir`,
    `wen`,
    `sol`,
    `ja`,
    `mu`,
    `fen`,
    `rix`,
    `ova`,
    `nu`,
    `bek`,
    `sal`,
    `dim`,
  ];
function r(r) {
  let i = e(r, `name`).n,
    a = t[Math.floor(i() * t.length)],
    o = n[Math.floor(i() * n.length)],
    s = i() < 0.22 ? n[Math.floor(i() * n.length)] : ``;
  return (a + o + s).toUpperCase();
}
export { r as t };
