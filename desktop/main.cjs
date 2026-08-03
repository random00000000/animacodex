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
const qaReport = process.env.ANIMA_CODEX_QA_REPORT;
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
          if (qaAction === "campaign-progression-audit") {
            const audit = await window.webContents.executeJavaScript(`
              (async () => {
                const gameState = window.__animaCodexDebug?.gameState;
                const campaign = gameState?.debugAuditCampaignProgression?.();
                if (!gameState || !campaign) return undefined;
                const activeSeconds = gameState.getPlayTimeSeconds();
                gameState.setPlaySessionActive(false);
                const pausedAt = gameState.getPlayTimeSeconds();
                await new Promise((resolve) => setTimeout(resolve, 1100));
                const pausedAfterWait = gameState.getPlayTimeSeconds();
                gameState.setPlaySessionActive(true);
                gameState.debugDefeatTrainer("gymLeaderSenka");
                gameState.debugDefeatTrainer("gymLeaderSenka");
                gameState.debugDefeatTrainer("townPatrolRhis");
                gameState.debugResolveRescueEncounter("nurseryMossling");
                gameState.usedInteractableIds.add("warningLightTree");
                gameState.debugDefeatTrainer("sporebellWardenTamsin");
                gameState.debugDefeatTrainer("sporebellWardenTamsin");
                const milestones = gameState.getCampaignMilestones();
                const badgeIds = gameState.getBadgeIds();
                const evidenceIds = gameState.getStewardshipEvidenceIds();
                const saved = gameState.saveProgressToSlot(1);
                const summary = gameState.getFieldLogSummary(1);
                const legacySnapshot = JSON.parse(localStorage.getItem("anima-codex-save-v1"));
                delete legacySnapshot.badgeIds;
                delete legacySnapshot.stewardshipEvidenceIds;
                localStorage.setItem("anima-codex-save-slot-2", JSON.stringify(legacySnapshot));
                const legacySummary = gameState.getFieldLogSummary(2);
                gameState.reserve.push({
                  ...gameState.party[0],
                  instanceId: "campaign-audit-reserve",
                  nickname: "Ledger Proof",
                });
                gameState.openSanctuaryLedger();
                document.querySelector('[data-front-door-action="open"]')?.click();
                return {
                  ...campaign,
                  playTime: {
                    activeSeconds,
                    pausedAt,
                    pausedAfterWait,
                    pausedClockStable: pausedAt === pausedAfterWait,
                    saved,
                    savedSeconds: summary.playTimeSeconds,
                    summaryIncludesTime: typeof summary.playTimeSeconds === "number",
                  },
                  milestone: {
                    gym1CompleteSeconds: milestones.gym1Complete,
                    gym2CompleteSeconds: milestones.gym2Complete,
                    recorded:
                      typeof milestones.gym1Complete === "number" &&
                      typeof milestones.gym2Complete === "number",
                    summarySeconds: summary.chapterCompletedAtSeconds,
                    summaryMatches: summary.chapterCompletedAtSeconds === milestones.gym2Complete,
                    summaryChapterComplete: summary.chapterComplete === true,
                  },
                  badges: {
                    ids: badgeIds,
                    awardedOnce:
                      badgeIds.length === 2 &&
                      badgeIds.includes("briarSteward") &&
                      badgeIds.includes("sporebellAdaptation"),
                    summaryIds: summary.badgeIds,
                    summaryMatches: JSON.stringify(summary.badgeIds) === JSON.stringify(badgeIds),
                    legacyIds: legacySummary.badgeIds,
                    legacyMigrates:
                      legacySummary.badgeIds.length === 2 &&
                      legacySummary.badgeIds.includes("briarSteward") &&
                      legacySummary.badgeIds.includes("sporebellAdaptation"),
                  },
                  evidence: {
                    ids: evidenceIds,
                    allRecorded:
                      evidenceIds.length === 3 &&
                      evidenceIds.includes("sanctuaryRescueRecord") &&
                      evidenceIds.includes("briarDefenseTestimony") &&
                      evidenceIds.includes("habitatAdaptationStudy"),
                    summaryIds: summary.stewardshipEvidenceIds,
                    summaryMatches:
                      JSON.stringify(summary.stewardshipEvidenceIds) === JSON.stringify(evidenceIds),
                    legacyIds: legacySummary.stewardshipEvidenceIds,
                    legacyMigrates:
                      legacySummary.stewardshipEvidenceIds.length === 3 &&
                      legacySummary.stewardshipEvidenceIds.includes("sanctuaryRescueRecord") &&
                      legacySummary.stewardshipEvidenceIds.includes("briarDefenseTestimony") &&
                      legacySummary.stewardshipEvidenceIds.includes("habitatAdaptationStudy"),
                  },
                };
              })()
            `);
            if (
              !audit ||
              audit.status !== "passed" ||
              audit.pacingCases?.length !== 10 ||
              audit.pacingCases?.some((entry) => !entry.passed) ||
              !audit.playTime?.pausedClockStable ||
              !audit.playTime?.saved ||
              !audit.playTime?.summaryIncludesTime ||
              !audit.milestone?.recorded ||
              !audit.milestone?.summaryMatches ||
              !audit.milestone?.summaryChapterComplete ||
              !audit.badges?.awardedOnce ||
              !audit.badges?.summaryMatches ||
              !audit.badges?.legacyMigrates ||
              !audit.evidence?.allRecorded ||
              !audit.evidence?.summaryMatches ||
              !audit.evidence?.legacyMigrates
            ) {
              throw new Error(`Campaign progression audit failed: ${JSON.stringify(audit)}`);
            }
            if (qaReport) {
              await fs.mkdir(path.dirname(qaReport), { recursive: true });
              await fs.writeFile(
                qaReport,
                JSON.stringify({ schemaVersion: 1, auditedAt: new Date().toISOString(), ...audit }, null, 2) + "\n",
              );
            }
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
