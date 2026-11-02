import fs from "fs";
import path from "path";

const LINKS_FILE = path.resolve("data", "links.json");

function ensureFile() {
  const dir = path.dirname(LINKS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LINKS_FILE)) {
    fs.writeFileSync(LINKS_FILE, "{}", "utf-8");
  }
}

export function getLinks() {
  ensureFile();
  try {
    const raw = fs.readFileSync(LINKS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch (err) {
    console.error("[LinksStore] Error reading links.json:", err.message);
    return {};
  }
}

function writeLinks(links) {
  ensureFile();
  const tmp = `${LINKS_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(links, null, 2), "utf-8");
  fs.renameSync(tmp, LINKS_FILE);
}

export function getLinkByEmsId(emsId) {
  if (!emsId) return null;
  const links = getLinks();
  return links[String(emsId)] || null;
}

export function getEmsIdByShopifyId(shopifyId) {
  if (!shopifyId) return null;
  const links = getLinks();
  for (const [emsId, info] of Object.entries(links)) {
    if (info && info.shopifyId === shopifyId) {
      return emsId;
    }
  }
  return null;
}

export function saveLink(emsId, { shopifyId, handle, listedAt, listedBy, storefrontUrl, adminUrl }) {
  if (!emsId) return;
  const links = getLinks();
  links[String(emsId)] = {
    shopifyId: shopifyId || "",
    handle: handle || "",
    listedAt: listedAt || new Date().toISOString(),
    listedBy: listedBy || "staff",
    storefrontUrl: storefrontUrl || null,
    adminUrl: adminUrl || null
  };
  writeLinks(links);
}

export function removeLinkByShopifyId(shopifyId) {
  if (!shopifyId) return;
  const links = getLinks();
  let modified = false;
  for (const [emsId, info] of Object.entries(links)) {
    if (info && info.shopifyId === shopifyId) {
      delete links[emsId];
      modified = true;
    }
  }
  if (modified) {
    writeLinks(links);
  }
}
