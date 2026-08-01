import { createHash } from "node:crypto";
import { mkdtemp, mkdir, copyFile, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRuntimeSourceFingerprint } from "./runtime-source-fingerprint.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stageRoot = await mkdtemp(path.join(tmpdir(), "anima-codex-package-"));
const releaseRoot = path.join(projectRoot, "release");
const localAppData =
  process.env.LOCALAPPDATA ?? path.join(homedir(), "AppData", "Local");
const electronCache =
  process.env.ELECTRON_CACHE ?? path.join(localAppData, "electron", "Cache");
const builderCache =
  process.env.ELECTRON_BUILDER_CACHE ??
  path.join(localAppData, "electron-builder", "Cache");
const builderCli = path.join(
  projectRoot,
  "node_modules",
  "electron-builder",
  "out",
  "cli",
  "cli.js",
);
const electronDist = path.join(
  projectRoot,
  "node_modules",
  "electron",
  "dist",
);
const packageMetadata = JSON.parse(
  await readFile(path.join(projectRoot, "package.json"), "utf8"),
);
const sourceFingerprint = await createRuntimeSourceFingerprint(projectRoot);

const runBuilder = () =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        builderCli,
        "--win",
        "portable",
        `--config.directories.output=${stageRoot}`,
        `--config.electronDist=${electronDist}`,
      ],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          ELECTRON_CACHE: electronCache,
          ELECTRON_BUILDER_CACHE: builderCache,
        },
        stdio: "inherit",
      },
    );
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`electron-builder exited with code ${code ?? "unknown"}`));
    });
  });

try {
  await runBuilder();
  const artifact = (await readdir(stageRoot)).find((name) => name.endsWith(".exe"));
  if (!artifact) throw new Error("electron-builder did not produce a portable Windows executable");
  await mkdir(releaseRoot, { recursive: true });
  const artifactPath = path.join(releaseRoot, artifact);
  await copyFile(path.join(stageRoot, artifact), artifactPath);

  const artifactBytes = await readFile(artifactPath);
  const artifactStats = await stat(artifactPath);
  const manifest = {
    schemaVersion: 1,
    productName: packageMetadata.build?.productName ?? packageMetadata.name,
    version: packageMetadata.version,
    platform: "windows",
    architecture: "x64",
    packaging: "portable",
    artifact,
    bytes: artifactStats.size,
    sha256: createHash("sha256").update(artifactBytes).digest("hex").toUpperCase(),
    createdAt: new Date().toISOString(),
    sourceFingerprint,
    promoted: false,
    promotionGate: "npm run verify:windows:clean",
  };
  const manifestPath = path.join(releaseRoot, "windows-portable-manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Windows package: ${artifactPath}`);
  console.log(`Release manifest: ${manifestPath}`);
} finally {
  await rm(stageRoot, { recursive: true, force: true });
}
