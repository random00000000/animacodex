import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
  await fs.readFile(path.join(projectRoot, "release", "windows-portable-manifest.json"), "utf8"),
);
const executablePath = path.join(projectRoot, "release", manifest.artifact);
const reportPath = path.join(projectRoot, "release", "qa", "windows-resolution-report.json");
const targets = [
  { label: "720p", width: 1280, height: 720 },
  { label: "laptop", width: 1366, height: 768 },
  { label: "900p", width: 1600, height: 900 },
];
const captureTimeoutMs = 90_000;

const terminateProcessTree = (pid) =>
  new Promise((resolve) => {
    if (process.platform !== "win32" || !pid) {
      resolve();
      return;
    }
    const killer = spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
    killer.once("error", () => resolve());
    killer.once("exit", () => resolve());
  });

const results = [];
for (const target of targets) {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), "anima-codex-resolution-"));
  const output = path.join(
    projectRoot,
    ".persona",
    "activity",
    "assets",
    `peter-options-${target.label}.png`,
  );
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.rm(output, { force: true });
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(executablePath, [], {
        cwd: projectRoot,
        windowsHide: true,
        stdio: "ignore",
        env: {
          ...process.env,
          ANIMA_CODEX_USER_DATA: profile,
          ANIMA_CODEX_CAPTURE_OUTPUT: output,
          ANIMA_CODEX_CAPTURE_QUERY: "capture=1&debugMenu=options",
          ANIMA_CODEX_CAPTURE_WIDTH: String(target.width),
          ANIMA_CODEX_CAPTURE_HEIGHT: String(target.height),
        },
      });
      const timeout = setTimeout(() => {
        void terminateProcessTree(child.pid).then(() =>
          reject(
            new Error(
              `${target.label} capture timed out after ${captureTimeoutMs / 1000} seconds.`,
            ),
          ),
        );
      }, captureTimeoutMs);
      child.once("error", reject);
      child.once("exit", (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve();
        else reject(new Error(`${target.label} capture exited with code ${code}.`));
      });
    });
    const png = await fs.readFile(output);
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    if (width !== target.width || height !== target.height) {
      throw new Error(`${target.label} expected ${target.width}x${target.height}, received ${width}x${height}.`);
    }
    results.push({
      ...target,
      bytes: png.length,
      sha256: createHash("sha256").update(png).digest("hex").toUpperCase(),
      evidence: path.relative(projectRoot, output).replaceAll("\\", "/"),
      passed: true,
    });
  } finally {
    await fs.rm(profile, {
      recursive: true,
      force: true,
      maxRetries: 12,
      retryDelay: 250,
    });
  }
}

const report = {
  schemaVersion: 1,
  status: "passed",
  verifiedAt: new Date().toISOString(),
  artifact: manifest.artifact,
  artifactSha256: manifest.sha256,
  aspectPolicy: "16:9 window lock; 1366x768 accepted as the common near-16:9 laptop mode",
  results,
  limitations: [
    "Windowed layout and first-frame readability only.",
    "A true 1920x1080 windowed content viewport is not certified on this host because Windows reserves desktop work-area space.",
    "Ultrawide, 4K scaling, multi-monitor movement, and fullscreen transitions are not yet certified."
  ],
};
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Windows resolution verification passed for ${results.map((result) => `${result.width}x${result.height}`).join(", ")}.`);
