import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ledgerPath = path.join(root, "docs", "environment_pair_audit.md");
const assetsPath = path.join(root, "src", "game", "data", "assets.ts");
const fingerprintPath = path.join(root, "docs", "environment_pair_certification_hashes.json");
const writeFingerprints = process.argv.includes("--write-manifest");
const expectedWidth = 1536;
const expectedHeight = 1024;
const expectedPairCount = 32;

const ledger = await readFile(ledgerPath, "utf8");
const assetRegistry = await readFile(assetsPath, "utf8");
const rowPattern = /^\| ([^|]+?) \| `([^`]+\.png)` \| `([^`]+\.png)` \| (\d+\/10(?: \(reopened\))?) \| ([^|]+) \|$/gm;
const rows = [...ledger.matchAll(rowPattern)].map((match) => ({
  scene: match[1].trim(),
  exploration: match[2],
  battle: match[3],
  score: match[4],
  evidence: match[5].trim(),
}));

const errors = [];
if (rows.length !== expectedPairCount) {
  errors.push(`Expected ${expectedPairCount} certified pairs, found ${rows.length}.`);
}

const seenScenes = new Set();
const seenFiles = new Set();
const currentFingerprints = {};

for (const row of rows) {
  if (seenScenes.has(row.scene)) errors.push(`Duplicate scene row: ${row.scene}.`);
  seenScenes.add(row.scene);

  if (!/^\d+\/10(?: \(reopened\))?$/.test(row.score)) errors.push(`${row.scene}: invalid score ${row.score}.`);
  if (row.evidence.split(",").length < 3) errors.push(`${row.scene}: fewer than three documented anchors.`);

  for (const [kind, filename, directory] of [
    ["exploration", row.exploration, "environment"],
    ["battle", row.battle, "battle"],
  ]) {
    const key = `${directory}/${filename}`;
    if (seenFiles.has(key)) errors.push(`${row.scene}: duplicate certified file ${key}.`);
    seenFiles.add(key);

    const filePath = path.join(root, "src", "assets", directory, filename);
    let data;
    try {
      data = await readFile(filePath);
    } catch {
      errors.push(`${row.scene}: missing ${kind} file ${key}.`);
      continue;
    }

    const pngSignature = "89504e470d0a1a0a";
    if (data.length < 24 || data.subarray(0, 8).toString("hex") !== pngSignature) {
      errors.push(`${row.scene}: ${key} is not a valid PNG header.`);
      continue;
    }

    const width = data.readUInt32BE(16);
    const height = data.readUInt32BE(20);
    if (width !== expectedWidth || height !== expectedHeight) {
      errors.push(`${row.scene}: ${key} is ${width}x${height}; expected ${expectedWidth}x${expectedHeight}.`);
    }

    if (!assetRegistry.includes(filename)) {
      errors.push(`${row.scene}: certified ${kind} file ${filename} is not referenced by assets.ts.`);
    }

    currentFingerprints[key] = createHash("sha256").update(data).digest("hex");
  }
}

if (!ledger.includes("No pairs remain pending.")) {
  errors.push("Ledger does not explicitly confirm that no pairs remain pending.");
}

if (errors.length === 0 && writeFingerprints) {
  const assets = Object.fromEntries(Object.entries(currentFingerprints).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(fingerprintPath, `${JSON.stringify({ schemaVersion: 1, assets }, null, 2)}\n`, "utf8");
  console.log(`Wrote ${Object.keys(assets).length} certified asset fingerprints to ${path.relative(root, fingerprintPath)}.`);
} else if (errors.length === 0) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(fingerprintPath, "utf8"));
  } catch {
    errors.push(`Missing or invalid fingerprint manifest: ${path.relative(root, fingerprintPath)}.`);
  }

  if (manifest) {
    if (manifest.schemaVersion !== 1 || !manifest.assets || typeof manifest.assets !== "object") {
      errors.push("Fingerprint manifest must use schemaVersion 1 and contain an assets object.");
    } else {
      const certifiedKeys = Object.keys(currentFingerprints).sort();
      const manifestKeys = Object.keys(manifest.assets).sort();
      if (manifestKeys.length !== certifiedKeys.length) {
        errors.push(`Fingerprint manifest contains ${manifestKeys.length} assets; expected ${certifiedKeys.length}.`);
      }
      for (const key of certifiedKeys) {
        if (!manifest.assets[key]) errors.push(`Fingerprint manifest is missing ${key}.`);
        else if (manifest.assets[key] !== currentFingerprints[key]) errors.push(`${key} no longer matches its reviewed certification fingerprint.`);
      }
      for (const key of manifestKeys) {
        if (!currentFingerprints[key]) errors.push(`Fingerprint manifest contains stale asset ${key}.`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error("Environment pair certification validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Environment pair certification validation passed.");
  console.log(`Certified pairs: ${rows.length}/${expectedPairCount}`);
  console.log(`Verified PNG assets: ${seenFiles.size}`);
  console.log(`Verified SHA-256 fingerprints: ${Object.keys(currentFingerprints).length}`);
  console.log(`Required dimensions: ${expectedWidth}x${expectedHeight}`);
  console.log("Registry references: 64/64");
  console.log("Pending pairs: 0");
}
