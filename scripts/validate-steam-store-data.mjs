import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readJson = async (relativePath) =>
  JSON.parse((await fs.readFile(path.join(projectRoot, relativePath), "utf8")).replace(/^\uFEFF/, ""));
const data = await readJson("release/steam-store-data.json");
const screenshots = await readJson(data.screenshotManifest);
const windows = await readJson("release/windows-portable-manifest.json");
const sceneSource = await fs.readFile(path.join(projectRoot, "src", "game", "data", "scenes.ts"), "utf8");
const scopeReportPath = path.join(projectRoot, "release", "qa", "campaign-scope-report.json");
const failures = [];
const rejectEncoding = (label, value) => {
  if (/[Ãâ�]/.test(value)) failures.push(`${label} contains likely encoding corruption`);
};
const rejectLinks = (label, value) => {
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org)\b)/i.test(value)) failures.push(`${label} contains a link or URL-like text`);
};

if (data.schemaVersion !== 1) failures.push("unsupported Steam store data schema");
if (data.publicationAuthorized !== false) failures.push("publicationAuthorized must remain false until explicit approval");
if (typeof data.name !== "string" || !data.name.trim()) failures.push("store name is missing");
if (typeof data.shortDescription !== "string" || data.shortDescription.length < 80 || data.shortDescription.length > 300) failures.push("short description must be 80-300 characters");
if (/\r|\n/.test(data.shortDescription ?? "")) failures.push("short description must be plain single-line text");
if (typeof data.aboutThisGame !== "string" || data.aboutThisGame.length < 500 || data.aboutThisGame.length > 10000) failures.push("About This Game must be 500-10000 characters");
for (const [label, value] of [["short description", data.shortDescription ?? ""], ["About This Game", data.aboutThisGame ?? ""]]) { rejectEncoding(label, value); rejectLinks(label, value); }
if (!Array.isArray(data.featureBullets) || data.featureBullets.length < 5) failures.push("at least five feature bullets are required");
if (!Array.isArray(data.tags) || data.tags.length < 5 || data.tags.length > 20) failures.push("Steam tags must contain 5-20 entries");
if (new Set(data.tags).size !== data.tags.length) failures.push("Steam tags must be unique");
if (!Array.isArray(data.unresolvedDecisions) || data.unresolvedDecisions.length === 0) failures.push("unresolved publication decisions must remain explicit");
if (data.developerPublisher !== null) failures.push("developerPublisher must remain null until approved");
if (data.releaseModel !== null) failures.push("releaseModel must remain null until approved");
if (data.controllerSupport !== "unverified-do-not-claim") failures.push("controller support must remain unclaimed until acceptance passes");
if (data.requirements?.status !== "provisional-unbenchmarked") failures.push("system requirements must remain provisional until benchmarked");
const shippedGymLeaderIds = ["gymLeaderSenka", "sporebellWardenTamsin"];
const authoredGymLeaderIds = shippedGymLeaderIds.filter((id) =>
  new RegExp(`\\bid:\\s*"${id}"`).test(sceneSource),
);
const publicStoreCopy = [data.shortDescription, data.aboutThisGame, ...(data.featureBullets ?? [])].join("\n");
if (authoredGymLeaderIds.length !== shippedGymLeaderIds.length) failures.push(`two-gym preview expects ${shippedGymLeaderIds.length} authored gym leaders, found ${authoredGymLeaderIds.length}`);
if (/\bleague\b|\bten gyms\b|\b10 gyms\b/i.test(publicStoreCopy)) failures.push("public store copy overpromises content beyond the implemented two-gym preview");
if (!/\bfirst two gyms\b/i.test(publicStoreCopy)) failures.push("public store copy must state the implemented first-two-gyms scope");
if (screenshots.artifactSha256 !== windows.sha256 || data.screenshotArtifactSha256 !== windows.sha256) failures.push("Steam screenshots are not bound to the current Windows artifact");
if (!Array.isArray(screenshots.screenshots) || screenshots.screenshots.length !== 5) failures.push("exactly five approved Steam screenshots are required");
for (const shot of screenshots.screenshots ?? []) {
  const relativePath = path.join("release", "steam-screenshots", shot.file);
  const absolutePath = path.join(projectRoot, relativePath);
  try {
    const bytes = await fs.readFile(absolutePath);
    const hash = createHash("sha256").update(bytes).digest("hex").toUpperCase();
    if (hash !== shot.sha256 || bytes.length !== shot.bytes) failures.push(`${shot.file} does not match its approved manifest`);
    if (!shot.approved) failures.push(`${shot.file} is not approved`);
    if (shot.width < 1280 || shot.height < 720 || Math.abs(shot.width / shot.height - 16 / 9) > 0.02) failures.push(`${shot.file} is not a suitable 16:9 store screenshot`);
  } catch { failures.push(`${relativePath} is missing`); }
}
const scopeReport = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: failures.some((failure) => /gym|league|scope/i.test(failure)) ? "failed" : "passed",
  releaseScope: "two-gym-preview",
  authoredGymLeaderIds,
  publicCopyNamesFirstTwoGyms: /\bfirst two gyms\b/i.test(publicStoreCopy),
  publicCopyAvoidsLaterCampaignClaims: !/\bleague\b|\bten gyms\b|\b10 gyms\b/i.test(publicStoreCopy),
  artifactSha256: windows.sha256
};
await fs.mkdir(path.dirname(scopeReportPath), { recursive: true });
await fs.writeFile(scopeReportPath, `${JSON.stringify(scopeReport, null, 2)}\n`, "utf8");
if (failures.length) {
  console.error("Steam store data validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Steam store data validation passed: ${data.shortDescription.length}-character short description, ${data.tags.length} tags, ${screenshots.screenshots.length} approved screenshots.`);
