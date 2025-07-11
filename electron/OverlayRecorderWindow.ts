import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as fs from "fs";

let overlayWindow: BrowserWindow | null = null;

export function createOverlayRecorderWindow() {
  if (overlayWindow) {
    overlayWindow.focus();
    return;
  }
  overlayWindow = new BrowserWindow({
    width: 250,
    height: 40,
    alwaysOnTop: true,
    frame: false,
    transparent: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "overlay-preload.js"),
    },
  });

  overlayWindow.setMenuBarVisibility(false);
  overlayWindow.loadFile(path.join(__dirname, "../renderer/public/overlay-recorder.html"));

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });
}


// IPC to close overlay window from renderer
ipcMain.on("close-overlay-recorder", () => {
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
});

// IPC to save overlay recording to Videos/cluely-recordings
ipcMain.on("save-overlay-recording", (_event, arrayBuffer) => {
  try {
    const videosDir = app.getPath("videos");
    const recordingsDir = path.join(videosDir, "cluely-recordings");
    if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(recordingsDir, `recording-${timestamp}.webm`);
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
  } catch (err) {
    // Optionally log error
  }
});

// Optional: expose for shortcut registration
export function isOverlayOpen() {
  return !!overlayWindow;
}
