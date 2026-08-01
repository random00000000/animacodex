const { app, BrowserWindow, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const readCommandLineValue = (name) => {
  const prefix = `--${name}=`;
  const argument = process.argv.find((candidate) => candidate.startsWith(prefix));
  return argument?.slice(prefix.length);
};

const isDevelopment = !app.isPackaged;
const captureOutput =
  process.env.ANIMA_CODEX_CAPTURE_OUTPUT ??
  readCommandLineValue("anima-codex-capture-output");
const captureQuery =
  process.env.ANIMA_CODEX_CAPTURE_QUERY ??
  readCommandLineValue("anima-codex-capture-query") ??
  "";
const isolatedUserData =
  process.env.ANIMA_CODEX_USER_DATA ??
  readCommandLineValue("anima-codex-user-data");
const qaAction =
  process.env.ANIMA_CODEX_QA_ACTION ??
  readCommandLineValue("anima-codex-qa-action");
const captureWidth = Math.max(
  960,
  Number(process.env.ANIMA_CODEX_CAPTURE_WIDTH ?? readCommandLineValue("anima-codex-capture-width") ?? 1920),
);
const captureHeight = Math.max(
  540,
  Number(process.env.ANIMA_CODEX_CAPTURE_HEIGHT ?? readCommandLineValue("anima-codex-capture-height") ?? 1080),
);

if (isolatedUserData) {
  app.setPath("userData", path.resolve(isolatedUserData));
}

if (captureOutput) {
  app.commandLine.appendSwitch("force-device-scale-factor", "1");
  if (!isolatedUserData) {
    app.setPath(
      "userData",
      path.join(app.getPath("temp"), `anima-codex-capture-${process.pid}`),
    );
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: captureOutput ? captureWidth : 1280,
    height: captureOutput ? captureHeight : 720,
    x: captureOutput ? -10000 : undefined,
    y: captureOutput ? -10000 : undefined,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: "#111812",
    autoHideMenuBar: true,
    useContentSize: true,
    show: Boolean(captureOutput),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });

  if (captureOutput) {
    window.setContentSize(captureWidth, captureHeight);
  } else {
    window.setAspectRatio(16 / 9);
  }
  if (!captureOutput) {
    window.once("ready-to-show", () => window.show());
  }
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDevelopment && process.env.ANIMA_CODEX_DEV_URL) {
    void window.loadURL(process.env.ANIMA_CODEX_DEV_URL);
  } else {
    void window.loadFile(path.join(__dirname, "..", "dist", "index.html"), {
      search: captureQuery,
    });
  }

  if (captureOutput) {
    window.webContents.once("did-finish-load", () => {
      setTimeout(async () => {
        try {
          if (qaAction === "create-save-fixture") {
            const created = await window.webContents.executeJavaScript(`
              (() => {
                const debug = window.__animaCodexDebug;
                if (!debug?.gameState) return false;
                if (!debug.gameState.startNewProgressSlot(1)) return false;
                debug.switchScene("moonfenMarsh");
                if (!debug.gameState.saveProgressToSlot(1)) return false;
                document.querySelector('[data-front-door-action="open"]')?.click();
                return true;
              })()
            `);
            if (!created) {
              throw new Error("Packaged persistence fixture could not be created.");
            }
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
          await fs.mkdir(path.dirname(captureOutput), { recursive: true });
          const viewport = await window.webContents.executeJavaScript(
            "({ width: window.innerWidth, height: window.innerHeight })",
          );
          if (
            process.env.ANIMA_CODEX_CAPTURE_WIDTH &&
            (viewport.width !== captureWidth || viewport.height !== captureHeight)
          ) {
            throw new Error(
              `Capture viewport mismatch: expected ${captureWidth}x${captureHeight}, received ${viewport.width}x${viewport.height}.`,
            );
          }
          const image = await window.webContents.capturePage();
          const normalizedImage = image.resize({
            width: captureWidth,
            height: captureHeight,
            quality: "best",
          });
          await fs.writeFile(captureOutput, normalizedImage.toPNG());
          app.exit(0);
        } catch (error) {
          console.error("Steam screenshot capture failed:", error);
          app.exit(1);
        }
      }, 8000);
    });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
