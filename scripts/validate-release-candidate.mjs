import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createRuntimeSourceFingerprint } from "./runtime-source-fingerprint.mjs";
const projectRoot = path.resolve(import.meta.dirname, "..");
const reportPath = path.join(projectRoot, "release", "qa", "release-candidate-report.json");
const failures = [];
const checks = [];
const readJson = async (relativePath) => JSON.parse((await fs.readFile(path.join(projectRoot, relativePath), "utf8")).replace(/^\uFEFF/, ""));
const check = (name, passed, detail) => { checks.push({ name, passed, detail }); if (!passed) failures.push(name + ": " + detail); };
const verifyFile = async (relativePath, expectedBytes, expectedSha256) => { try { const bytes = await fs.readFile(path.join(projectRoot, relativePath)); const sha256 = createHash("sha256").update(bytes).digest("hex").toUpperCase(); return { exists: true, bytes: bytes.length, sha256, matches: bytes.length === expectedBytes && sha256 === expectedSha256 }; } catch { return { exists: false, matches: false }; } };
const windows = await readJson("release/windows-portable-manifest.json");
const screenshots = await readJson("release/steam-screenshots/manifest.json");
const store = await readJson("release/steam-store-data.json");
const artwork = await readJson("src/assets/marketing/steam/steam-artwork-manifest-v1.json");
const benchmark = await readJson("release/qa/windows-local-benchmark.json");
const depot = await readJson("release/windows-depot-manifest.json");
const depotBenchmark = await readJson("release/qa/windows-depot-benchmark.json");
const campaignScope = await readJson("release/qa/campaign-scope-report.json");
const playerSettings = await readJson("release/qa/player-settings-report.json");
const resolutions = await readJson("release/qa/windows-resolution-report.json");
const executable = await verifyFile(path.join("release", windows.artifact), windows.bytes, windows.sha256);
const depotExecutable = await verifyFile(
  path.join("release", depot.launchExecutable),
  depot.executableBytes,
  depot.executableSha256,
);
const currentSourceFingerprint = await createRuntimeSourceFingerprint(projectRoot);
check("windows-executable", executable.matches, executable.exists ? "portable executable differs from its release manifest" : "portable executable is missing");
check(
  "runtime-source-fingerprint",
  windows.sourceFingerprint?.sha256 === currentSourceFingerprint.sha256 &&
    windows.sourceFingerprint?.fileCount === currentSourceFingerprint.fileCount,
  "runtime source has changed since the Windows executable was packaged",
);
check("windows-promotion", windows.promoted === true, "Windows artifact has not passed its isolated-profile promotion gate");
let verificationReportExists = false;
if (windows.verificationReport) { try { await fs.access(path.join(projectRoot, windows.verificationReport)); verificationReportExists = true; } catch {} }
check("packaged-verification-evidence", verificationReportExists, "packaged persistence verification report is missing");
check("screenshot-artifact-binding", screenshots.artifactSha256 === windows.sha256 && store.screenshotArtifactSha256 === windows.sha256, "Steam screenshots are not bound to the promoted executable");
check("five-approved-screenshots", Array.isArray(screenshots.screenshots) && screenshots.screenshots.length === 5 && screenshots.screenshots.every((shot) => shot.approved === true), "exactly five approved screenshots are required");
for (const shot of screenshots.screenshots ?? []) { const verified = await verifyFile(path.join("release", "steam-screenshots", shot.file), shot.bytes, shot.sha256); check("screenshot:" + shot.file, verified.matches, "screenshot hash or size mismatch"); }
const requiredArtwork = new Map([["header-capsule", [920, 430]],["small-capsule", [462, 174]],["main-capsule", [1232, 706]],["vertical-capsule", [748, 896]],["library-capsule", [600, 900]],["library-header", [920, 430]],["library-hero", [3840, 1240]],["library-logo", [1280, 360]]]);
check("eight-steam-artwork-assets", Array.isArray(artwork.assets) && artwork.assets.length === requiredArtwork.size, "the required eight store and library artwork assets are not all present");
for (const asset of artwork.assets ?? []) { const expected = requiredArtwork.get(asset.type); const verified = await verifyFile(asset.path, asset.bytes, asset.sha256); check("artwork:" + asset.type, Boolean(expected && asset.width === expected[0] && asset.height === expected[1] && verified.matches), "artwork dimensions, hash, or size do not match the candidate manifest"); }
const hero = artwork.assets?.find((asset) => asset.type === "library-hero");
const logo = artwork.assets?.find((asset) => asset.type === "library-logo");
check("textless-library-hero", hero?.text === false, "library hero must be artwork only");
check("transparent-library-logo", logo?.transparent === true && logo?.hasAlpha === true, "library logo must be transparent");
check("structured-store-data", store.status === "internal-review" && store.publicationAuthorized === false && Array.isArray(store.unresolvedDecisions) && store.unresolvedDecisions.length > 0, "store data must remain an internal-review package with unresolved approvals explicit");
check("hardware-claims-provisional", store.requirements?.status === "provisional-unbenchmarked", "hardware requirements must not be promoted before benchmarking");
check(
  "local-windows-benchmark-evidence",
  benchmark.status === "local-reference-only" &&
    benchmark.artifactSha256 === windows.sha256 &&
    benchmark.artifactBytes === windows.bytes &&
    benchmark.summary?.samples >= 3 &&
    Array.isArray(benchmark.limitations) &&
    benchmark.limitations.length > 0,
  "local benchmark evidence is missing, stale, or presented without limitations",
);
check(
  "steam-depot-executable",
  depot.packaging === "steam-depot-unpacked" &&
    depotExecutable.matches &&
    depot.sourceFingerprint?.sha256 === currentSourceFingerprint.sha256 &&
    depot.sourceFingerprint?.fileCount === currentSourceFingerprint.fileCount,
  "Steam-depot executable is missing, stale, or does not match current runtime source",
);
check(
  "steam-depot-startup-benchmark",
  depotBenchmark.status === "local-reference-only" &&
    depotBenchmark.executableSha256 === depot.executableSha256 &&
    depotBenchmark.sourceFingerprint?.sha256 === currentSourceFingerprint.sha256 &&
    depotBenchmark.summary?.samples >= 3 &&
    Array.isArray(depotBenchmark.limitations) &&
    depotBenchmark.limitations.length > 0,
  "Steam-depot startup benchmark is missing, stale, or presented without limitations",
);
check(
  "campaign-scope-honesty",
  campaignScope.status === "passed" &&
    campaignScope.releaseScope === "first-gym-campaign" &&
    campaignScope.artifactSha256 === windows.sha256 &&
    campaignScope.authoredGymLeaderIds?.length === 1 &&
    campaignScope.publicCopyNamesFirstGym === true &&
    campaignScope.publicCopyAvoidsLaterCampaignClaims === true,
  "campaign scope evidence is missing, stale, or exceeds the implemented first-gym release",
);
const settingsEvidence = await verifyFile(
  playerSettings.evidence?.path,
  playerSettings.evidence?.bytes,
  playerSettings.evidence?.sha256,
);
check(
  "packaged-player-settings",
  playerSettings.status === "passed" &&
    playerSettings.artifactSha256 === windows.sha256 &&
    playerSettings.features?.battleAudioToggle === true &&
    playerSettings.features?.reducedMotionToggle === true &&
    playerSettings.features?.largerTextToggle === true &&
    settingsEvidence.matches,
  "packaged audio and accessibility settings evidence is missing or stale",
);
check(
  "packaged-resolution-matrix",
  resolutions.status === "passed" &&
    resolutions.artifactSha256 === windows.sha256 &&
    resolutions.results?.length === 3 &&
    resolutions.results.every((result) => result.passed === true),
  "packaged resolution evidence is missing, stale, or incomplete",
);
const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), status: failures.length ? "failed" : "ready-for-internal-review", artifact: windows.artifact, artifactSha256: windows.sha256, summary: { checks: checks.length, passed: checks.filter((entry) => entry.passed).length, failed: failures.length, approvedScreenshots: screenshots.screenshots?.filter((shot) => shot.approved).length ?? 0, steamArtworkAssets: artwork.assets?.length ?? 0 }, checks, unresolvedApprovals: store.unresolvedDecisions };
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
if (failures.length) { console.error("Release candidate validation failed:"); for (const failure of failures) console.error("- " + failure); process.exit(1); }
console.log("Release candidate ready for internal review: " + report.summary.passed + "/" + report.summary.checks + " checks passed, " + report.summary.approvedScreenshots + " screenshots, " + report.summary.steamArtworkAssets + " artwork assets.");
