import { app, BrowserWindow, session, desktopCapturer, dialog } from "electron"
const { initMain } = require("electron-audio-loopback")
import { initializeIpcHandlers } from "./ipcHandlers"
import { WindowHelper } from "./WindowHelper"
import { ScreenshotHelper } from "./ScreenshotHelper"
import { ShortcutsHelper } from "./shortcuts"
import { ProcessingHelper } from "./ProcessingHelper"
import { createOverlayRecorderWindow } from "./OverlayRecorderWindow"

export class AppState {
  private static instance: AppState | null = null

  private windowHelper: WindowHelper
  private screenshotHelper: ScreenshotHelper
  public shortcutsHelper: ShortcutsHelper
  public processingHelper: ProcessingHelper

  // View management
  private view: "queue" | "solutions" = "queue"

  private problemInfo: {
    problem_statement: string
    input_format: Record<string, any>
    output_format: Record<string, any>
    constraints: Array<Record<string, any>>
    test_cases: Array<Record<string, any>>
  } | null = null // Allow null

  private hasDebugged: boolean = false
  private userContext: { meetingTopic: string; userRole: string } | null = null;

  // Processing events
  public readonly PROCESSING_EVENTS = {
    //global states
    UNAUTHORIZED: "procesing-unauthorized",
    NO_SCREENSHOTS: "processing-no-screenshots",

    //states for generating the initial solution
    INITIAL_START: "initial-start",
    PROBLEM_EXTRACTED: "problem-extracted",
    SOLUTION_SUCCESS: "solution-success",
    INITIAL_SOLUTION_ERROR: "solution-error",

    //states for processing the debugging
    DEBUG_START: "debug-start",
    DEBUG_SUCCESS: "debug-success",
    DEBUG_ERROR: "debug-error"
  } as const

  constructor() {
    // Initialize WindowHelper with this
      this.windowHelper = new WindowHelper(this)

      // Initialize ScreenshotHelper
      this.screenshotHelper = new ScreenshotHelper(this.view)

      // Initialize ProcessingHelper
      this.processingHelper = new ProcessingHelper(this)
    
      // Set the main window for the LLMHelper once it's created
      if (this.getMainWindow()) {
        this.processingHelper.getLLMHelper().setMainWindow(this.getMainWindow()!)
      }

    // Initialize ShortcutsHelper
    this.shortcutsHelper = new ShortcutsHelper(this)
  }

  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState()
    }
    return AppState.instance
  }

  // Getters and Setters
  public getMainWindow(): BrowserWindow | null {
    return this.windowHelper.getMainWindow()
  }

  public getView(): "queue" | "solutions" {
    return this.view
  }

  public setView(view: "queue" | "solutions"): void {
    this.view = view
    this.screenshotHelper.setView(view)
  }

  public isVisible(): boolean {
    return this.windowHelper.isVisible()
  }

  public getScreenshotHelper(): ScreenshotHelper {
    return this.screenshotHelper
  }

  public getProblemInfo(): any {
    return this.problemInfo
  }

  public setProblemInfo(problemInfo: any): void {
    this.problemInfo = problemInfo
  }

  public getScreenshotQueue(): string[] {
    return this.screenshotHelper.getScreenshotQueue()
  }

  public getExtraScreenshotQueue(): string[] {
    return this.screenshotHelper.getExtraScreenshotQueue()
  }

  // Window management methods
  public createWindow(): void {
    this.windowHelper.createWindow()
    
    // Set the main window for the LLMHelper
    if (this.getMainWindow()) {
      this.processingHelper.getLLMHelper().setMainWindow(this.getMainWindow()!)
    }
  }

  public hideMainWindow(): void {
    this.windowHelper.hideMainWindow()
  }

  public showMainWindow(): void {
    this.windowHelper.showMainWindow()
  }

  public toggleMainWindow(): void {
    console.log(
      "Screenshots: ",
      this.screenshotHelper.getScreenshotQueue().length,
      "Extra screenshots: ",
      this.screenshotHelper.getExtraScreenshotQueue().length
    )
    this.windowHelper.toggleMainWindow()
  }

  public setWindowDimensions(width: number, height: number): void {
    this.windowHelper.setWindowDimensions(width, height)
  }

  public clearQueues(): void {
    this.screenshotHelper.clearQueues()

    // Clear problem info
    this.problemInfo = null

    // Reset view to initial state
    this.setView("queue")
  }

  // Screenshot management methods
  public async takeScreenshot(): Promise<string> {
    if (!this.getMainWindow()) throw new Error("No main window available")

    const screenshotPath = await this.screenshotHelper.takeScreenshot()

    return screenshotPath
  }

  public async getImagePreview(filepath: string): Promise<string> {
    return this.screenshotHelper.getImagePreview(filepath)
  }

  public async deleteScreenshot(
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.screenshotHelper.deleteScreenshot(path)
  }

  // New methods to move the window
  public moveWindowLeft(): void {
    this.windowHelper.moveWindowLeft()
  }

  public moveWindowRight(): void {
    this.windowHelper.moveWindowRight()
  }
  public moveWindowDown(): void {
    this.windowHelper.moveWindowDown()
  }
  public moveWindowUp(): void {
    this.windowHelper.moveWindowUp()
  }

  public setHasDebugged(value: boolean): void {
    this.hasDebugged = value
  }

  public getHasDebugged(): boolean {
    return this.hasDebugged
  }

  public setUserContext(context: { meetingTopic: string; userRole: string }): void {
    this.userContext = context;
    console.log("User context set in AppState:", this.userContext);
  }

  public getUserContext(): { meetingTopic: string; userRole: string } | null {
    return this.userContext;
  }
}

initMain(); // Initialize audio loopback plugin before app is ready

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

/**
 * Load .env for both dev and packaged builds
 */
function loadEnv() {
  if (app.isPackaged) {
    // In packaged build, .env should be in resourcesPath
    const envPath = path.join(process.resourcesPath, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  } else {
    // In dev, load from project root
    dotenv.config();
  }
}

// Application initialization
async function initializeApp() {
  loadEnv();
  // Log to file for debugging packaged startup issues
  const logPath = path.join(app.getPath("userData"), "main-process.log");
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] Electron main process started\n`);

  const appState = AppState.getInstance();

  // Initialize IPC handlers before window creation
  initializeIpcHandlers(appState);

  app.whenReady().then(() => {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] app.whenReady\n`);
    // Enable getDisplayMedia for screen capture
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        callback({ video: sources[0], audio: 'loopback' });
      });
    }, { useSystemPicker: true });

    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Creating main window\n`);
    appState.createWindow();
    appState.shortcutsHelper.registerGlobalShortcuts();
  });

  app.on("activate", () => {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] App activated\n`);
    if (appState.getMainWindow() === null) {
      appState.createWindow();
    }
  });

  app.on("window-all-closed", () => {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] window-all-closed\n`);
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  try {
    app.dock?.hide();
  } catch (e) {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] app.dock?.hide() error: ${e}\n`);
  }
  app.commandLine.appendSwitch("disable-background-timer-throttling");
}

// Start the application
initializeApp().catch(console.error)
