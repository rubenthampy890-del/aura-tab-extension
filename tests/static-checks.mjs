import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(path, "utf8");
const manifest = JSON.parse(read("manifest.json"));
const html = read("newtab.html");
const scripts = ["newtab.js", "background.js", "offscreen.js"];

for (const path of scripts) {
  new vm.Script(read(path), { filename: path });
}

for (const path of [
  manifest.chrome_url_overrides?.newtab,
  manifest.background?.service_worker,
  ...Object.values(manifest.icons || {})
]) {
  if (!path || !fs.existsSync(path)) {
    throw new Error(`Manifest references a missing file: ${path}`);
  }
}

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) {
  throw new Error(`Duplicate HTML ids: ${[...new Set(duplicateIds)].join(", ")}`);
}

const extensionCode = scripts.map(read).join("\n");
const forbidden = [
  ["eval()", /\beval\s*\(/],
  ["Function constructor", /\b(?:new\s+)?Function\s*\(/],
  ["inline event handler", /\bon(?:click|error|load|submit|change)=/i]
];
for (const [label, pattern] of forbidden) {
  if (pattern.test(extensionCode) || pattern.test(html)) {
    throw new Error(`Forbidden ${label} found in extension code`);
  }
}

const requiredPermissions = new Map([
  ["chrome.alarms", "alarms"],
  ["chrome.notifications", "notifications"],
  ["chrome.contextMenus", "contextMenus"],
  ["chrome.offscreen", "offscreen"]
]);
for (const [usage, permission] of requiredPermissions) {
  if (extensionCode.includes(usage) && !manifest.permissions?.includes(permission)) {
    throw new Error(`Code uses ${usage} without declaring ${permission}`);
  }
}

console.log("Aura Tab static checks passed.");
