import { defineConfig } from "vite";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const sceneGeometryConfigPath = path.join(
  projectRoot,
  "public",
  "config",
  "scene-geometry-overrides.json",
);

export default defineConfig({
  server: {
    port: 4173,
    host: "0.0.0.0",
  },
  plugins: [
    {
      name: "anima-admin-scene-geometry",
      configureServer(server) {
        server.middlewares.use("/__anima-admin/scene-geometry-overrides", (request, response) => {
          if (request.method !== "POST") {
            response.statusCode = 405;
            response.end("Method not allowed");
            return;
          }

          let body = "";
          request.setEncoding("utf8");
          request.on("data", (chunk) => {
            body += chunk;
          });
          request.on("end", async () => {
            try {
              const parsed = JSON.parse(body);
              if (parsed.version !== 1 || typeof parsed.scenes !== "object" || parsed.scenes === null) {
                response.statusCode = 400;
                response.end("Invalid scene geometry config");
                return;
              }

              await fs.mkdir(path.dirname(sceneGeometryConfigPath), { recursive: true });
              await fs.writeFile(sceneGeometryConfigPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
              response.setHeader("Content-Type", "application/json");
              response.end(JSON.stringify({ ok: true, path: sceneGeometryConfigPath }));
            } catch (error) {
              response.statusCode = 500;
              response.end(error instanceof Error ? error.message : "Unable to save scene geometry config");
            }
          });
        });
      },
    },
  ],
});
