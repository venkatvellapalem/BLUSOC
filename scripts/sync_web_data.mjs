import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const write = process.argv.includes("--write");
for (const name of ["alerts_sanitized.json", "alert_taxonomy.json", "enterprise_topology.json"]) {
  const source = await readFile(path.join(root, "data", name), "utf8");
  const target = path.join(root, "web", "src", "data", name);
  const current = await readFile(target, "utf8");
  if (source.replaceAll("\r\n", "\n") !== current.replaceAll("\r\n", "\n")) {
    if (!write) throw new Error(`Bundled data differs: ${name}. Run npm run data:sync.`);
    await writeFile(target, source);
  }
}
console.log(write ? "Web data synchronized." : "Bundled web data matches the source datasets.");
