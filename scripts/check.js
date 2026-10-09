import { readdirSync, readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

for (const file of readdirSync("extension").filter((name) => name.endsWith(".js"))) {
  const result = spawnSync(process.execPath, ["--check", `extension/${file}`], { stdio: "inherit" });
  if (result.status !== 0) process.exit(1);
}
const manifest = JSON.parse(readFileSync("extension/manifest.json", "utf8"));
for (const file of [manifest.action.default_popup, manifest.options_ui.page, manifest.background?.service_worker, ...Object.values(manifest.icons || {}), ...Object.values(manifest.action.default_icon || {})]) {
  if (!existsSync(`extension/${file}`)) throw new Error(`Missing ${file}`);
}
if (!manifest.icons?.["128"] || manifest.description.length > 132) throw new Error("Check store icon and description.");
if (manifest.host_permissions || manifest.content_scripts) throw new Error("Use on-demand injection only.");
console.log("Extension syntax and manifest checks passed.");
