import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const runtimeRoots = ["src", "public", "desktop"];
const runtimeFiles = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  "vite.config.ts",
];

const listFiles = async (root, relativeDirectory) => {
  const absoluteDirectory = path.join(root, relativeDirectory);
  const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(root, relativePath)));
    else if (entry.isFile()) files.push(relativePath);
  }
  return files;
};

export const createRuntimeSourceFingerprint = async (projectRoot) => {
  const files = [];
  for (const runtimeRoot of runtimeRoots) {
    files.push(...(await listFiles(projectRoot, runtimeRoot)));
  }
  for (const runtimeFile of runtimeFiles) {
    try {
      await fs.access(path.join(projectRoot, runtimeFile));
      files.push(runtimeFile);
    } catch {
      // Optional TypeScript config variants are absent in some workspaces.
    }
  }
  files.sort((left, right) => left.localeCompare(right));

  const hash = createHash("sha256");
  for (const relativePath of files) {
    const normalizedPath = relativePath.replaceAll("\\", "/");
    const contents = await fs.readFile(path.join(projectRoot, relativePath));
    hash.update(`${normalizedPath}\0${contents.length}\0`);
    hash.update(contents);
    hash.update("\0");
  }
  return {
    algorithm: "SHA-256",
    sha256: hash.digest("hex").toUpperCase(),
    fileCount: files.length,
    roots: runtimeRoots,
    explicitFiles: runtimeFiles,
  };
};
