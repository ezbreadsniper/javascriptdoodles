import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve("src");
const queue = [join(root, "sheet.js")];
const visited = new Set();
const missing = [];

while (queue.length > 0) {
  const file = queue.pop();
  if (visited.has(file)) continue;
  visited.add(file);

  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(
    /(?:from\s*|import\s*)["'](\.\/[^"']+)["']/g,
  )) {
    const dependency = resolve(dirname(file), match[1]);
    if (!existsSync(dependency)) missing.push(`${file} -> ${match[1]}`);
    else queue.push(dependency);
  }
}

if (missing.length > 0) {
  console.error(`Missing recovered modules:\n${missing.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Checked ${visited.size} recovered modules.`);
}
