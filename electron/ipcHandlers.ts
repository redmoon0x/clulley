// ipcHandlers.ts

import { ipcMain, app, IpcMainInvokeEvent, BrowserWindow } from "electron"
import { AppState } from "./main"

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
}
