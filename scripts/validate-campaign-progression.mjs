import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const electron = path.join(projectRoot, "node_modules", "electron", "dist", "electron.exe");
const report = path.join(projectRoot, "release", "qa", "campaign-progression-report.json");
const temporaryRoot = await fs.mkdtemp(path.join(tmpdir(), "anima-campaign-audit-"));
const screenshot = process.env.ANIMA_CODEX_CAMPAIGN_SCREENSHOT
  ? path.resolve(projectRoot, process.env.ANIMA_CODEX_CAMPAIGN_SCREENSHOT)
  : path.join(temporaryRoot, "audit.png");
await fs.mkdir(path.dirname(screenshot), { recursive: true });

const exitCode = await new Promise((resolve, reject) => {
  const child = spawn(electron, [projectRoot], {
    cwd: projectRoot,
    windowsHide: true,
    stdio: "inherit",
    env: {
      ...process.env,
      ANIMA_CODEX_CAPTURE_OUTPUT: screenshot,
      ANIMA_CODEX_CAPTURE_QUERY: "capture=1",
      ANIMA_CODEX_USER_DATA: path.join(temporaryRoot, "profile"),
      ANIMA_CODEX_QA_ACTION: "campaign-progression-audit",
      ANIMA_CODEX_QA_REPORT: report,
    },
  });
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
});

await fs.rm(temporaryRoot, { recursive: true, force: true });
if (exitCode !== 0) process.exit(exitCode);
const audit = JSON.parse(await fs.readFile(report, "utf8"));
if (
  audit.status !== "passed" ||
  audit.cases?.some((entry) => entry.passed !== true) ||
  audit.pacingCases?.length !== 10 ||
  audit.pacingCases?.some((entry) => entry.passed !== true) ||
  audit.playTime?.pausedClockStable !== true ||
  audit.playTime?.saved !== true ||
  audit.playTime?.summaryIncludesTime !== true ||
  audit.milestone?.recorded !== true ||
  audit.milestone?.summaryMatches !== true ||
  audit.milestone?.summaryChapterComplete !== true ||
  audit.badges?.awardedOnce !== true ||
  audit.badges?.summaryMatches !== true ||
  audit.badges?.legacyMigrates !== true ||
  audit.evidence?.allRecorded !== true ||
  audit.evidence?.summaryMatches !== true ||
  audit.evidence?.legacyMigrates !== true
) process.exit(1);
console.log(`Campaign progression validation passed: ${audit.cases.length}/${audit.cases.length} chapter states through Gym 2, ${audit.pacingCases.length}/10 pacing boundaries, two named badges, three stewardship evidence paths, persistence, and legacy migration.`);
