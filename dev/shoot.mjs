import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Dev-only: renders pages of this repo in headless Chromium and saves PNGs,
 * so a drawing change can be looked at without a desktop browser.
 *
 *   node dev/shoot.mjs out.png "/dev/preview.html?extras=lollipop&count=6&columns=3"
 *   node dev/shoot.mjs out.png "/?sheet=777" --size 1400x900 --wait 1500
 *   node dev/shoot.mjs out.png "/dev/preview.html?..." --clip 0,300,700,400
 *
 * Several `out url` pairs can follow each other; they share one browser.
 * Console errors and page errors are printed and make the exit code 1.
 */
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("/opt/node22/lib/node_modules/playwright"));
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback) => {
  let index = args.indexOf(name);
  if (index < 0) return fallback;
  let [value] = args.splice(index, 2).slice(1);
  return value;
};
const [width, height] = option("--size", "1200x800").split("x").map(Number);
const wait = Number(option("--wait", "400"));
const scale = Number(option("--scale", "1"));
const clip = option("--clip", null)?.split(",").map(Number);
const pairs = [];
for (let i = 0; i + 1 < args.length; i += 2) pairs.push([args[i], args[i + 1]]);
if (pairs.length === 0) {
  console.error("usage: node dev/shoot.mjs <out.png> <path> [<out.png> <path>...] [--size WxH] [--wait ms] [--scale n] [--clip x,y,w,h]");
  process.exit(2);
}

const port = 5100 + Math.floor(Math.random() * 800);
const server = spawn(process.execPath, [resolve(root, "server.mjs")], {
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "inherit"],
});
await new Promise((ready) => server.stdout.once("data", ready));

let failed = false;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  page.on("console", (message) => {
    if (message.type() === "error") {
      failed = true;
      console.error(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    failed = true;
    console.error(`pageerror: ${error.message}`);
  });
  for (const [out, path] of pairs) {
    await page.goto(`http://127.0.0.1:${port}${path.startsWith("/") ? path : `/${path}`}`);
    await page.waitForTimeout(wait);
    mkdirSync(dirname(resolve(out)), { recursive: true });
    await page.screenshot({
      path: out,
      ...(clip ? { clip: { x: clip[0], y: clip[1], width: clip[2], height: clip[3] } } : {}),
    });
    console.log(out);
  }
} finally {
  await browser.close();
  server.kill();
}
process.exitCode = failed ? 1 : 0;
