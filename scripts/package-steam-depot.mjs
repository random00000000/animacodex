import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { createRuntimeSourceFingerprint } from "./runtime-source-fingerprint.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const releaseRoot = path.join(projectRoot, "release");
const depotRoot = path.join(releaseRoot, "windows-depot");
const manifestPath = path.join(releaseRoot, "windows-depot-manifest.json");
const benchmarkPath = path.join(releaseRoot, "qa", "windows-depot-benchmark.json");
const stageRoot = await fs.mkdtemp(path.join(os.tmpdir(), "anima-codex-depot-"));
const builderCli = path.join(
  projectRoot,
  "node_modules",
  "electron-builder",
  "out",
  "cli",
  "cli.js",
);
const electronDist = path.join(projectRoot, "node_modules", "electron", "dist");
const evidencePath = path.join(
  projectRoot,
  ".persona",
  "activity",
  "assets",
  "peter-steam-depot-first-render.png",
);

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} exited with code ${code}.`));
    });
  });

const summarizeDirectory = async (root) => {
  let fileCount = 0;
  let bytes = 0;
  const visit = async (directory) => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else {
        const stats = await fs.stat(target);
        fileCount += 1;
        bytes += stats.size;
      }
    }
  };
  await visit(root);
  return { fileCount, bytes };
};

try {
  await run(
    process.execPath,
    [
      builderCli,
      "--win",
      "dir",
      `--config.directories.output=${stageRoot}`,
      `--config.electronDist=${electronDist}`,
    ],
    {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
    },
  );

  const stagedDepot = path.join(stageRoot, "win-unpacked");
  await fs.access(stagedDepot);
  await fs.rm(depotRoot, {
    recursive: true,
    force: true,
    maxRetries: 12,
    retryDelay: 250,
  });
  await fs.cp(stagedDepot, depotRoot, { recursive: true });

  const executablePath = path.join(depotRoot, "Anima Codex.exe");
  const executable = await fs.readFile(executablePath);
  const sourceFingerprint = await createRuntimeSourceFingerprint(projectRoot);
  const directory = await summarizeDirectory(depotRoot);
  const manifest = {
    schemaVersion: 1,
    productName: "Anima Codex",
    version: "0.1.0",
    platform: "windows",
    architecture: "x64",
    packaging: "steam-depot-unpacked",
    launchExecutable: "windows-depot/Anima Codex.exe",
    executableBytes: executable.length,
    executableSha256: createHash("sha256")
      .update(executable)
      .digest("hex")
      .toUpperCase(),
    directory,
    createdAt: new Date().toISOString(),
    sourceFingerprint,
  };
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const launches = [];
  for (let index = 0; index < 3; index += 1) {
    const profile = await fs.mkdtemp(
      path.join(os.tmpdir(), "anima-codex-depot-benchmark-"),
    );
    const screenshot =
      index === 0
        ? evidencePath
        : path.join(os.tmpdir(), `anima-codex-depot-${process.pid}-${index}.png`);
    await fs.mkdir(path.dirname(screenshot), { recursive: true });
    await fs.rm(screenshot, { force: true });
    const startedAt = performance.now();
    try {
      await run(executablePath, [], {
        cwd: depotRoot,
        env: {
          ...process.env,
          ANIMA_CODEX_USER_DATA: profile,
          ANIMA_CODEX_CAPTURE_OUTPUT: screenshot,
          ANIMA_CODEX_CAPTURE_QUERY: "capture=1",
        },
        windowsHide: true,
        stdio: "ignore",
      });
      const png = await fs.readFile(screenshot);
      launches.push({
        run: index + 1,
        isolatedProfile: true,
        firstRenderMs: Math.round(performance.now() - startedAt),
        screenshotWidth: png.readUInt32BE(16),
        screenshotHeight: png.readUInt32BE(20),
      });
    } finally {
      await fs.rm(profile, {
        recursive: true,
        force: true,
        maxRetries: 12,
        retryDelay: 250,
      });
      if (index !== 0) await fs.rm(screenshot, { force: true });
    }
  }
  const timings = launches.map((launch) => launch.firstRenderMs);
  const benchmark = {
    schemaVersion: 1,
    status: "local-reference-only",
    benchmarkedAt: new Date().toISOString(),
    launchExecutable: manifest.launchExecutable,
    executableSha256: manifest.executableSha256,
    sourceFingerprint,
    launches,
    summary: {
      samples: timings.length,
      minimumFirstRenderMs: Math.min(...timings),
      medianFirstRenderMs: [...timings].sort((a, b) => a - b)[1],
      maximumFirstRenderMs: Math.max(...timings),
    },
    evidence: path.relative(projectRoot, evidencePath).replaceAll("\\", "/"),
    limitations: [
      "Single-host startup reference only.",
      "This unpacked directory models a Steam depot layout; it has not been uploaded to Steam.",
      "GPU frame time, sustained gameplay, thermals, controller acceptance, and representative lower-end hardware remain untested."
    ],
  };
  await fs.mkdir(path.dirname(benchmarkPath), { recursive: true });
  await fs.writeFile(benchmarkPath, `${JSON.stringify(benchmark, null, 2)}\n`);
  console.log(
    `Steam-depot package ready: ${directory.fileCount} files, ${directory.bytes} bytes.`,
  );
  console.log(
    `Median direct-launch first render: ${benchmark.summary.medianFirstRenderMs} ms.`,
  );
} finally {
  await fs.rm(stageRoot, {
    recursive: true,
    force: true,
    maxRetries: 12,
    retryDelay: 250,
  });
}
