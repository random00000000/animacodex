import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(projectRoot, "release", "windows-portable-manifest.json");
const reportPath = path.join(projectRoot, "release", "qa", "windows-local-benchmark.json");
const evidencePath = path.join(
  projectRoot,
  ".persona",
  "activity",
  "assets",
  "peter-windows-benchmark-first-render.png",
);
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const executablePath = path.join(projectRoot, "release", manifest.artifact);
const executable = await fs.readFile(executablePath);
const executableHash = createHash("sha256").update(executable).digest("hex").toUpperCase();

if (executableHash !== manifest.sha256 || executable.length !== manifest.bytes) {
  throw new Error("The Windows candidate does not match its release manifest.");
}

const launchOnce = async (index) => {
  const profileRoot = await fs.mkdtemp(path.join(os.tmpdir(), "anima-codex-benchmark-"));
  const screenshotPath =
    index === 0
      ? evidencePath
      : path.join(os.tmpdir(), `anima-codex-benchmark-${process.pid}-${index}.png`);
  await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
  await fs.rm(screenshotPath, { force: true });
  const startedAt = performance.now();

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(executablePath, [], {
        cwd: projectRoot,
        env: {
          ...process.env,
          ANIMA_CODEX_USER_DATA: profileRoot,
          ANIMA_CODEX_CAPTURE_OUTPUT: screenshotPath,
          ANIMA_CODEX_CAPTURE_QUERY: "capture=1",
        },
        windowsHide: true,
        stdio: "ignore",
      });
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error(`Benchmark launch ${index + 1} timed out after 45 seconds.`));
      }, 45_000);
      child.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.once("exit", (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve();
        else reject(new Error(`Benchmark launch ${index + 1} exited with code ${code}.`));
      });
    });

    const screenshot = await fs.readFile(screenshotPath);
    if (screenshot.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
      throw new Error(`Benchmark launch ${index + 1} did not produce a valid PNG.`);
    }
    return {
      run: index + 1,
      isolatedProfile: true,
      firstRenderMs: Math.round(performance.now() - startedAt),
      screenshotWidth: screenshot.readUInt32BE(16),
      screenshotHeight: screenshot.readUInt32BE(20),
    };
  } finally {
    await fs.rm(profileRoot, { recursive: true, force: true });
    if (index !== 0) await fs.rm(screenshotPath, { force: true });
  }
};

const launches = [];
for (let index = 0; index < 3; index += 1) launches.push(await launchOnce(index));
const timings = launches.map((launch) => launch.firstRenderMs);
const cpu = os.cpus()[0];
const report = {
  schemaVersion: 1,
  status: "local-reference-only",
  benchmarkedAt: new Date().toISOString(),
  artifact: manifest.artifact,
  artifactSha256: manifest.sha256,
  artifactBytes: manifest.bytes,
  host: {
    platform: os.platform(),
    release: os.release(),
    architecture: os.arch(),
    cpuModel: cpu?.model ?? "unknown",
    logicalCpuCount: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
  },
  launches,
  summary: {
    samples: timings.length,
    minimumFirstRenderMs: Math.min(...timings),
    medianFirstRenderMs: [...timings].sort((a, b) => a - b)[1],
    maximumFirstRenderMs: Math.max(...timings),
  },
  evidence: path.relative(projectRoot, evidencePath).replaceAll("\\", "/"),
  limitations: [
    "This is one local host, not minimum or recommended hardware coverage.",
    "Portable-executable extraction is included in first-render timing.",
    "GPU frame-time, sustained gameplay performance, thermals, and controller acceptance are not measured.",
    "Steam system requirements must remain provisional until representative lower-end and target hardware are tested."
  ],
};

await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(
  `Windows benchmark passed: ${report.summary.medianFirstRenderMs} ms median first render across ${launches.length} isolated launches.`,
);
console.log(`Report: ${reportPath}`);
