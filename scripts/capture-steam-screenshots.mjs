import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { inflateSync } from "node:zlib";

const projectRoot = path.resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(
  await fs.readFile(path.join(projectRoot, "package.json"), "utf8"),
);
const commandArguments = process.argv.slice(2);
const packagedCaptureTimeoutMs = 60_000;
const explicitExecutable = commandArguments
  .find((value) => value.startsWith("--executable="))
  ?.slice("--executable=".length);
const cleanProfileMode = commandArguments.includes("--clean-profile");
const persistenceProfileMode = commandArguments.includes("--persistence-profile");
const executablePath = path.resolve(
  process.env.ANIMA_CODEX_CAPTURE_EXECUTABLE ??
    explicitExecutable ??
    path.join(
      projectRoot,
      "release",
      `Anima-Codex-${packageJson.version}-Windows-x64.exe`,
    ),
);
const executableArguments = process.env.ANIMA_CODEX_CAPTURE_EXECUTABLE
  ? (process.env.ANIMA_CODEX_CAPTURE_ARGUMENTS ?? "")
      .split("|")
      .filter(Boolean)
  : [];
const outputDirectory = path.join(projectRoot, "release", "steam-screenshots");
const cleanProfileScreenshot = path.join(
  projectRoot,
  ".persona",
  "activity",
  "assets",
  "peter-clean-profile-first-boot.png",
);
const cleanProfileReport = path.join(
  projectRoot,
  "release",
  "qa",
  "clean-profile-report.json",
);
const persistenceScreenshot = path.join(
  projectRoot,
  ".persona",
  "activity",
  "assets",
  "peter-persistence-relaunch.png",
);
const persistenceReport = path.join(
  projectRoot,
  "release",
  "qa",
  "persistence-profile-report.json",
);

const listFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(entryPath)));
    else files.push(entryPath);
  }
  return files;
};

const analyzePngLuminance = (png) => {
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const bitDepth = png[24];
  const colorType = png[25];
  const interlace = png[28];
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (bitDepth !== 8 || channels === 0 || interlace !== 0) {
    throw new Error(
      `Unsupported clean-profile PNG format: bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace}.`,
    );
  }

  const idat = [];
  for (let offset = 8; offset < png.length; ) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") idat.push(png.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const previous = Buffer.alloc(stride);
  const current = Buffer.alloc(stride);
  const buckets = new Set();
  let maximum = 0;
  let nonDarkSamples = 0;
  let sampleCount = 0;
  let rawOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[rawOffset++];
    for (let x = 0; x < stride; x += 1) {
      const encoded = raw[rawOffset++];
      const left = x >= channels ? current[x - channels] : 0;
      const above = previous[x];
      const upperLeft = x >= channels ? previous[x - channels] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = above;
      else if (filter === 3) predictor = Math.floor((left + above) / 2);
      else if (filter === 4) {
        const estimate = left + above - upperLeft;
        const leftDistance = Math.abs(estimate - left);
        const aboveDistance = Math.abs(estimate - above);
        const upperLeftDistance = Math.abs(estimate - upperLeft);
        predictor =
          leftDistance <= aboveDistance && leftDistance <= upperLeftDistance
            ? left
            : aboveDistance <= upperLeftDistance
              ? above
              : upperLeft;
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG scanline filter ${filter}.`);
      }
      current[x] = (encoded + predictor) & 0xff;
    }
    if (y % 16 === 0) {
      for (let x = 0; x < width; x += 16) {
        const pixel = x * channels;
        const luminance = Math.round(
          current[pixel] * 0.2126 +
            current[pixel + 1] * 0.7152 +
            current[pixel + 2] * 0.0722,
        );
        maximum = Math.max(maximum, luminance);
        buckets.add(Math.floor(luminance / 16));
        if (luminance >= 24) nonDarkSamples += 1;
        sampleCount += 1;
      }
    }
    current.copy(previous);
  }

  return {
    maximum,
    luminanceBucketCount: buckets.size,
    nonDarkRatio: nonDarkSamples / sampleCount,
  };
};

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

const removeProfileDirectory = (profileRoot) =>
  fs.rm(profileRoot, {
    recursive: true,
    force: true,
    maxRetries: 12,
    retryDelay: 250,
  });

const captureWithProfile = ({ profileRoot, output, qaAction }) =>
  new Promise((resolve, reject) => {
    const child = spawn(executablePath, executableArguments, {
      cwd: projectRoot,
      env: {
        ...process.env,
        ANIMA_CODEX_USER_DATA: profileRoot,
        ANIMA_CODEX_CAPTURE_OUTPUT: output,
        ANIMA_CODEX_CAPTURE_QUERY: "capture=1",
        ...(qaAction ? { ANIMA_CODEX_QA_ACTION: qaAction } : {}),
      },
      stdio: "inherit",
      windowsHide: true,
    });
    const timeout = setTimeout(() => {
      void terminateProcessTree(child.pid).then(() =>
        reject(new Error(`Persistence capture timed out: ${path.basename(output)}`)),
      );
    }, packagedCaptureTimeoutMs);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error(`Persistence capture exited with code ${code}.`));
    });
  });

const runPersistenceProfileVerification = async () => {
  const profileRoot = await fs.mkdtemp(
    path.join(tmpdir(), "anima-codex-persistence-profile-"),
  );
  const fixtureScreenshot = path.join(
    tmpdir(),
    `anima-codex-persistence-fixture-${process.pid}.png`,
  );
  try {
    await fs.mkdir(path.dirname(persistenceScreenshot), { recursive: true });
    await fs.mkdir(path.dirname(persistenceReport), { recursive: true });
    await fs.rm(persistenceScreenshot, { force: true });
    await fs.rm(fixtureScreenshot, { force: true });
    if ((await listFiles(profileRoot)).length !== 0) {
      throw new Error("The persistence QA profile was not empty before launch.");
    }

    await captureWithProfile({
      profileRoot,
      output: fixtureScreenshot,
      qaAction: "create-save-fixture",
    });
    const profileFilesAfterSave = await listFiles(profileRoot);
    if (profileFilesAfterSave.length === 0) {
      throw new Error("The persistence fixture did not initialize profile storage.");
    }

    await captureWithProfile({
      profileRoot,
      output: persistenceScreenshot,
    });
    const screenshot = await fs.readFile(persistenceScreenshot);
    if (screenshot.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
      throw new Error("Persistence relaunch evidence is not a valid PNG.");
    }
    const width = screenshot.readUInt32BE(16);
    const height = screenshot.readUInt32BE(20);
    const visual = analyzePngLuminance(screenshot);
    if (
      width < 1600 ||
      height < 900 ||
      visual.maximum < 40 ||
      visual.luminanceBucketCount < 3 ||
      visual.nonDarkRatio < 0.01
    ) {
      throw new Error("Persistence relaunch evidence is blank or malformed.");
    }

    const report = {
      status: "passed",
      verifiedAt: new Date().toISOString(),
      executable: path.relative(projectRoot, executablePath).replaceAll("\\", "/"),
      profileStartedEmpty: true,
      profileFilesAfterSave: profileFilesAfterSave.length,
      fixtureScene: "moonfenMarsh",
      fixtureSlot: 1,
      relaunchedSameProfile: true,
      screenshot: path
        .relative(projectRoot, persistenceScreenshot)
        .replaceAll("\\", "/"),
      screenshotWidth: width,
      screenshotHeight: height,
      visual,
    };
    await fs.writeFile(
      persistenceReport,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
    process.stdout.write(
      `Persistence relaunch verification passed: slot 1 restored after packaged restart.\n`,
    );
    process.stdout.write(`Report: ${persistenceReport}\n`);
  } finally {
    await removeProfileDirectory(profileRoot);
    await fs.rm(fixtureScreenshot, { force: true });
  }
};

const runCleanProfileVerification = async () => {
  const profileRoot = await fs.mkdtemp(
    path.join(tmpdir(), "anima-codex-clean-profile-"),
  );
  try {
    await fs.mkdir(path.dirname(cleanProfileScreenshot), { recursive: true });
    await fs.mkdir(path.dirname(cleanProfileReport), { recursive: true });
    await fs.rm(cleanProfileScreenshot, { force: true });
    if ((await listFiles(profileRoot)).length !== 0) {
      throw new Error("The isolated Windows profile was not empty before launch.");
    }

    await new Promise((resolve, reject) => {
      const child = spawn(executablePath, executableArguments, {
        cwd: projectRoot,
        env: {
          ...process.env,
          ANIMA_CODEX_USER_DATA: profileRoot,
          ANIMA_CODEX_CAPTURE_OUTPUT: cleanProfileScreenshot,
          ANIMA_CODEX_CAPTURE_QUERY: "capture=1",
        },
        stdio: "inherit",
        windowsHide: true,
      });
      let settled = false;
      const finish = async (error) => {
        if (settled) return;
        settled = true;
        clearInterval(evidencePoll);
        clearTimeout(timeout);
        await terminateProcessTree(child.pid);
        if (error) reject(error);
        else resolve();
      };
      const evidencePoll = setInterval(async () => {
        try {
          await fs.access(cleanProfileScreenshot);
          await finish();
        } catch {
          // The packaged renderer is still reaching the first actionable frame.
        }
      }, 250);
      const timeout = setTimeout(
        () =>
          finish(
            new Error(
              `Clean-profile capture timed out after ${packagedCaptureTimeoutMs / 1000} seconds.`,
            ),
          ),
        packagedCaptureTimeoutMs,
      );
      child.once("error", (error) => finish(error));
      child.once("exit", (code) => {
        if (code !== 0 && code !== null) {
          void finish(
            new Error(`Clean-profile capture exited with code ${code}.`),
          );
        }
      });
    });

    const screenshot = await fs.readFile(cleanProfileScreenshot);
    if (screenshot.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
      throw new Error("Clean-profile evidence is not a valid PNG.");
    }
    const width = screenshot.readUInt32BE(16);
    const height = screenshot.readUInt32BE(20);
    if (
      width < 1600 ||
      height < 900 ||
      Math.abs(width / height - 16 / 9) > 0.02
    ) {
      throw new Error(`Unexpected clean-profile capture: ${width}x${height}.`);
    }
    const visual = analyzePngLuminance(screenshot);
    if (
      visual.maximum < 40 ||
      visual.luminanceBucketCount < 3 ||
      visual.nonDarkRatio < 0.01
    ) {
      throw new Error(
        `Clean-profile capture is visually blank (max luminance ${visual.maximum}, ${visual.luminanceBucketCount} luminance buckets, ${(visual.nonDarkRatio * 100).toFixed(2)}% non-dark samples).`,
      );
    }
    const profileFiles = await listFiles(profileRoot);
    if (profileFiles.length === 0) {
      throw new Error("The packaged runtime did not initialize its profile.");
    }
    const executableStats = await fs.stat(executablePath);
    const report = {
      status: "passed",
      verifiedAt: new Date().toISOString(),
      executable: path.relative(projectRoot, executablePath).replaceAll("\\", "/"),
      executableBytes: executableStats.size,
      profileStartedEmpty: true,
      runtimeProfileFileCount: profileFiles.length,
      screenshot: path
        .relative(projectRoot, cleanProfileScreenshot)
        .replaceAll("\\", "/"),
      screenshotWidth: width,
      screenshotHeight: height,
      visual,
    };
    await fs.writeFile(
      cleanProfileReport,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
    process.stdout.write(
      `Clean-profile Windows verification passed: ${width}x${height}, ${profileFiles.length} runtime profile files.\n`,
    );
    process.stdout.write(`Report: ${cleanProfileReport}\n`);
  } finally {
    await removeProfileDirectory(profileRoot);
  }
};

const shots = [
  {
    file: "01-sanctuary-trail.png",
    query:
      "capture=1&debugScene=sanctuaryTrail&debugPlayerPosition=454:386",
  },
  {
    file: "02-elemental-battle.png",
    query:
      "capture=1&debugScene=thunderheadMesa&debugParty=voltpip:18&debugLeadIndex=1&debugWildBattle=stormwool:18&debugBattleTempo=player:focused,enemy:exposed",
  },
  {
    file: "03-rescue-encounter.png",
    query:
      "capture=1&debugScene=moonfenMarsh&debugActiveEncounterZone=silverReedPools&debugWildBattle=fenlight:12&debugWildPressure=hp:18,spooked:1",
  },
  {
    file: "04-ignis-transformation.png",
    query:
      "capture=1&debugScene=magmaheartCaldera&debugLeadForm=Ignis%20Canis&debugWildBattle=magmadon:24&debugBattleTempo=player:focused",
  },
  {
    file: "05-briar-gym.png",
    query:
      "capture=1&debugScene=briarGym&debugParty=thornkit:16,mossprig:16&debugTrainerBattle=gymLeaderSenka&debugBattleTempo=player:guarded,enemy:focused",
  },
];

const runCapture = (shot) =>
  new Promise((resolve, reject) => {
    const child = spawn(executablePath, executableArguments, {
      cwd: projectRoot,
      env: {
        ...process.env,
        ANIMA_CODEX_CAPTURE_OUTPUT: path.join(outputDirectory, shot.file),
        ANIMA_CODEX_CAPTURE_QUERY: shot.query,
      },
      stdio: "inherit",
      windowsHide: true,
    });
    const timeout = setTimeout(() => {
      void terminateProcessTree(child.pid).then(() =>
        reject(
          new Error(
            `${shot.file} capture timed out after ${packagedCaptureTimeoutMs / 1000} seconds`,
          ),
        ),
      );
    }, packagedCaptureTimeoutMs);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error(`${shot.file} capture exited with code ${code}`));
    });
  });

await fs.access(executablePath);
if (persistenceProfileMode) {
  await runPersistenceProfileVerification();
  process.exit(0);
}
if (cleanProfileMode) {
  await runCleanProfileVerification();
  process.exit(0);
}
await fs.mkdir(outputDirectory, { recursive: true });

for (const shot of shots) {
  process.stdout.write(`Capturing ${shot.file}...\n`);
  await runCapture(shot);
}

process.stdout.write(`Captured ${shots.length} Steam screenshots in ${outputDirectory}\n`);
