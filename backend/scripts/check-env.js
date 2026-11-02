import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (!fs.existsSync(envPath)) {
  console.log(".env file: missing");
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf-8");
const lines = content.split(/\r?\n/);
const keys = new Set();

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();
    if (val.length > 0) {
      keys.add(key);
    }
  }
}

const requiredKeys = [
  "SHOP",
  "CLIENT_ID",
  "CLIENT_SECRET",
  "SESSION_SECRET",
  "EMS_DB_HOST",
  "EMS_DB_USER",
  "EMS_DB_PASSWORD",
  "EMS_DB_NAME"
];

console.log("=== .ENV KEY NAMES CHECK (VALUES REDACTED) ===");
for (const k of requiredKeys) {
  const alias = k.replace(/^EMS_/, "");
  const isPresent = keys.has(k) || keys.has(alias);
  console.log(`${k}: ${isPresent ? "present" : "missing"}`);
}
