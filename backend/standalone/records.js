import fs from "fs";
import path from "path";
import crypto from "crypto";

const RECORDS_FILE = path.resolve("data", "records.json");

function ensureFile() {
  const dir = path.dirname(RECORDS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(RECORDS_FILE)) {
    fs.writeFileSync(RECORDS_FILE, "[]", "utf-8");
  }
}

function readAll() {
  ensureFile();
  try {
    const raw = fs.readFileSync(RECORDS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading records.json:", err.message);
    return [];
  }
}

function writeAll(records) {
  ensureFile();
  const tempPath = `${RECORDS_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(records, null, 2), "utf-8");
  fs.renameSync(tempPath, RECORDS_FILE);
}

/**
 * Add an audit record
 * @param {Object} param0
 * @param {string} param0.user - user email
 * @param {"listed_from_ems"|"created"|"edited"|"deleted"|"status_changed"} param0.action
 * @param {string} param0.title
 * @param {string} param0.shopifyId
 * @param {string} [param0.emsId]
 * @param {string} param0.status
 * @param {string} [param0.note]
 */
export function addRecord({ user, action, title, shopifyId, emsId, status, note }) {
  const records = readAll();
  const newRecord = {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    user: user || "system",
    action,
    title: title || "",
    shopifyId: shopifyId || "",
    emsId: emsId || null,
    status: status || "UNKNOWN",
    note: note || ""
  };
  records.push(newRecord);
  writeAll(records);
  return newRecord;
}

/**
 * Get records, newest first
 * @param {Object} [options]
 * @param {number} [options.limit=100]
 */
export function getRecords({ limit = 100 } = {}) {
  const records = readAll();
  return records
    .slice()
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, limit);
}

/**
 * Find record by emsId (checks if already listed from EMS)
 * @param {string|number} emsId
 */
export function findByEmsId(emsId) {
  if (!emsId) return null;
  const records = readAll();
  const target = String(emsId);
  return records.find(
    (r) => String(r.emsId) === target && r.action === "listed_from_ems"
  ) || null;
}
