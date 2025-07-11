// ipcHandlers.ts

import { ipcMain, app, IpcMainInvokeEvent, BrowserWindow } from "electron"
import { AppState } from "./main"
import fs from "fs"
import path from "path"
const LOG_PATH = path.join(process.cwd(), "recording-debug.log");
function logToFile(...args: any[]) {
  fs.appendFileSync(LOG_PATH, args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" ") + "\n");
}

export function initializeIpcHandlers(appState: AppState): void {
  ipcMain.handle(
    "update-content-dimensions",
    async (event, { width, height }: { width: number; height: number }) => {
      if (width && height) {
        appState.setWindowDimensions(width, height)
      }
    }
  )

  ipcMain.handle("delete-screenshot", async (event, path: string) => {
    return appState.deleteScreenshot(path)
  })

  ipcMain.handle("take-screenshot", async () => {
    try {
      const screenshotPath = await appState.takeScreenshot()
      return { path: screenshotPath, preview: "" }
    } catch (error) {
      console.error("Error taking screenshot:", error)
      throw error
    }
  })

  ipcMain.handle("get-screenshots", async () => {
    console.log({ view: appState.getView() })
    try {
      let previews = []
      if (appState.getView() === "queue") {
        previews = await Promise.all(
          appState.getScreenshotQueue().map(async (path) => ({
            path,
            preview: ""
          }))
        )
      } else {
        previews = await Promise.all(
          appState.getExtraScreenshotQueue().map(async (path) => ({
            path,
            preview: ""
          }))
        )
      }
      previews.forEach((preview: any) => console.log(preview.path))
      return previews
    } catch (error) {
      console.error("Error getting screenshots:", error)
      throw error
    }
  })

  ipcMain.handle("toggle-window", async () => {
    appState.toggleMainWindow()
  })

  ipcMain.handle("reset-queues", async () => {
    try {
      appState.clearQueues()
      console.log("Screenshot queues have been cleared.")
      return { success: true }
    } catch (error: any) {
      console.error("Error resetting queues:", error)
      return { success: false, error: error.message }
    }
  })

  // IPC handler for analyzing audio from base64 data
  ipcMain.handle("analyze-audio-base64", async (event, data: string, mimeType: string) => {
    try {
      const result = await appState.processingHelper.processAudioBase64(data, mimeType)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-base64 handler:", error)
      throw error
    }
  })

  // IPC handler for saving screen recording to disk
  ipcMain.handle("save-recording", async (event, { buffer, path: filePath }) => {
    try {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        logToFile("[SAVE] Created directory:", dir)
      }
      logToFile("[SAVE] Writing file to:", filePath, "Buffer size:", buffer ? buffer.byteLength : "undefined")
      fs.writeFileSync(filePath, Buffer.from(buffer))
      logToFile("[SAVE] File written successfully:", filePath)
      return { success: true }
    } catch (error: any) {
      logToFile("[SAVE] Error saving recording:", error)
      return { success: false, error: error.message }
    }
  })

  // IPC handler to start or stop screen recording (toggle)
  ipcMain.handle("start-stop-recording", async (event) => {
    const mainWindow = appState.getMainWindow()
    if (!mainWindow) return { success: false, error: "No main window" }

    // Use desktopCapturer to get the screen source
    // @ts-ignore
    const { desktopCapturer } = require("electron");
    const sources = await desktopCapturer.getSources({ types: ["screen"] })
    if (!sources.length) return { success: false, error: "No screen sources found" }

    // Pick the first screen (or you can add logic to pick a specific one)
    const source = sources[0]
    // Generate output path
    const recordingsDir = path.join(app.getPath("videos"), "cluely-recordings")
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true })
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const outputPath = path.join(recordingsDir, `recording-${timestamp}.webm`)

    // Forward to renderer to start/stop recording
    mainWindow.webContents.send("toggle-screen-recording", {
      sourceId: source.id,
      outputPath
    })
    return { success: true }
  })

  // IPC handler for analyzing audio from file path
  ipcMain.handle("analyze-audio-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.processAudioFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-file handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing image from file path
  ipcMain.handle("analyze-image-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.getLLMHelper().analyzeImageFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-image-file handler:", error)
      throw error
    }
  })

  // IPC handler for generating solution with streaming option
  ipcMain.handle("generate-solution", async (event: IpcMainInvokeEvent, problemInfo: any, stream: boolean = false) => {
    try {
      // Ensure the main window is set for streaming responses
      const llmHelper = appState.processingHelper.getLLMHelper()
      const mainWindow = appState.getMainWindow()
      
      if (mainWindow && stream) {
        llmHelper.setMainWindow(mainWindow)
      }
      
      console.log(`[ipcHandlers] Generating solution with streaming: ${stream}`)
      const result = await llmHelper.generateSolution(problemInfo, stream)
      return result
    } catch (error: any) {
      console.error("Error in generate-solution handler:", error)
      throw error
    }
  })

  // Set up listener for stream-reply event
  const setupWindowForStreaming = (window: BrowserWindow | null) => {
    if (window) {
      window.webContents.on('did-finish-load', () => {
        console.log("[ipcHandlers] Window loaded, setting up for streaming")
        const llmHelper = appState.processingHelper.getLLMHelper()
        llmHelper.setMainWindow(window)
      })
    }
  }
  
  // Set up the current window if it exists
  setupWindowForStreaming(appState.getMainWindow())
  
  // Also set up any new windows that get created
  app.on('browser-window-created', (_, window) => {
    console.log("[ipcHandlers] New window created, setting up for streaming")
    setupWindowForStreaming(window)
  })
  
  ipcMain.handle("quit-app", () => {
    app.quit()
  })

  ipcMain.handle("set-user-context", async (event, context: { meetingTopic: string; userRole: string }) => {
    appState.setUserContext(context);
    return { success: true };
  });
}
