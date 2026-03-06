import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

let version;
try {
  version = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
} catch {
  version = Date.now().toString(36);
}

const swPath = "public/sw.js";
const content = readFileSync(swPath, "utf8");
const updated = content.replace(
  /const CACHE_NAME = "to-live-long-[^"]+";/,
  `const CACHE_NAME = "to-live-long-${version}";`
);
writeFileSync(swPath, updated);
console.log(`sw.js cache version → to-live-long-${version}`);
