const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");

const LOCAL_PORT = Number(process.env.PULSEFORGE_PORT || 4173);
const REMOTE_URL = process.env.PULSEFORGE_WEB_URL || "";
let serverProcess = null;

function localServerEntry() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app.asar", "dist", "index.js")
    : path.join(__dirname, "..", "dist", "index.js");
}

function waitForLocalServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const probe = () => {
      const request = http.get(url, response => {
        response.resume();
        resolve();
      });
      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error("The local web server did not become ready in time."));
        } else {
          setTimeout(probe, 250);
        }
      });
      request.setTimeout(1000, () => request.destroy());
    };
    probe();
  });
}

async function startLocalWebServer() {
  const entry = localServerEntry();
  serverProcess = spawn(process.execPath, [entry], {
    cwd: app.isPackaged ? process.resourcesPath : path.dirname(entry),
    env: { ...process.env, NODE_ENV: "production", PORT: String(LOCAL_PORT), ELECTRON_RUN_AS_NODE: "1" },
    stdio: "inherit",
    windowsHide: true,
  });
  serverProcess.on("exit", code => {
    if (code && !app.isQuitting) {
      console.error(`PulseForge web server exited with code ${code}`);
    }
  });
  const url = `http://127.0.0.1:${LOCAL_PORT}`;
  await waitForLocalServer(url);
  return url;
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    backgroundColor: "#f7f8fa",
    autoHideMenuBar: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  const targetUrl = REMOTE_URL || await startLocalWebServer();
  await window.loadURL(targetUrl);
  window.once("ready-to-show", () => window.show());
}

app.whenReady().then(async () => {
  try {
    await createWindow();
  } catch (error) {
    console.error(error);
    await dialog.showMessageBox({
      type: "error",
      title: "PulseForge Gym Management",
      message: "Unable to start the web application.",
      detail: `${error.message}\n\nBuild the web app first or set PULSEFORGE_WEB_URL to a reachable deployment URL.`,
    });
    app.quit();
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

module.exports = { waitForLocalServer };
