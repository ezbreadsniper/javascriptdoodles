import { readFileSync, writeFileSync } from "node:fs";

const MAP = {
  "sheet-WUSomGc7": "sheet",
  "typeset-CUjnR0Vm": "typeset",
  "core-Calr4rc2": "core",
  "pose-DeHbWJSp": "pose",
  "cloud-D0bWzE4O": "cloud",
  "field-Byd-702U": "field",
  "palette-4j4QC37X": "palette",
  "pen-DmOxfjFV": "pen",
  "head-BchNi0R4": "head",
  "face-C4OA20fW": "face",
  "shell-DWEMSj-6": "shell",
  "afro-Cb9KCHLH": "afro",
  "hat-BsoxlaaB": "hat",
  "hair-nUioSJzB": "hair",
  "extras-BmqrM9B6": "extras",
  "paper-BSo6mD6L": "paper",
  "renderer-C3DGeLHd": "renderer",
  "styles-zTSe_jfC": "styles",
  "grid-BvhlnsKk": "grid",
  "gaze-aE3KNnIw": "gaze",
  "names-sz4Uk_9t": "names",
  "logo-D0SOOUt5": "logo",
};

const targets = [
  ["sheet-WUSomGc7.js", "../src/sheet.js"],
  ["typeset-CUjnR0Vm.js", "../src/typeset.js"],
  ["core-Calr4rc2.js", "../src/core.js"],
  ["palette-4j4QC37X.js", "../src/palette.js"],
  ["pen-DmOxfjFV.js", "../src/pen.js"],
  ["head-BchNi0R4.js", "../src/head.js"],
  ["face-C4OA20fW.js", "../src/face.js"],
  ["shell-DWEMSj-6.js", "../src/shell.js"],
  ["afro-Cb9KCHLH.js", "../src/afro.js"],
  ["hat-BsoxlaaB.js", "../src/hat.js"],
  ["hair-nUioSJzB.js", "../src/hair.js"],
  ["extras-BmqrM9B6.js", "../src/extras.js"],
  ["paper-BSo6mD6L.js", "../src/paper.js"],
  ["renderer-C3DGeLHd.js", "../src/renderer.js"],
  ["styles-zTSe_jfC.js", "../src/styles.js"],
  ["gaze-aE3KNnIw.js", "../src/gaze.js"],
  ["names-sz4Uk_9t.js", "../src/names.js"],
  ["logo-D0SOOUt5.js", "../src/logo.js"],
];

for (const [src, dest] of targets) {
  let content = readFileSync(src, "utf8");
  for (const [hash, stable] of Object.entries(MAP)) {
    content = content.split(`./${hash}.js`).join(`./${stable}.js`);
  }
  writeFileSync(dest, content);
  console.log(`${src} -> ${dest}`);
}
