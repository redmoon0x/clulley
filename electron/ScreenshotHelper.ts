// ScreenshotHelper.ts

import path from "node:path"
import fs from "node:fs"
import { app, desktopCapturer } from "electron"
import { v4 as uuidv4 } from "uuid"

export class ScreenshotHelper {
  private screenshotQueue: string[] = []
  private extraScreenshotQueue: string[] = []
  private readonly MAX_SCREENSHOTS = 5

  private readonly screenshotDir: string
  private readonly extraScreenshotDir: string

  private view: "queue" | "solutions" = "queue"

  constructor(view: "queue" | "solutions" = "queue") {
    this.view = view

    // Initialize directories
    this.screenshotDir = path.join(app.getPath("userData"), "screenshots")
    this.extraScreenshotDir = path.join(
      app.getPath("userData"),
      "extra_screenshots"
    )

    // Create directories if they don't exist
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir)
    }
    if (!fs.existsSync(this.extraScreenshotDir)) {
      fs.mkdirSync(this.extraScreenshotDir)
    }
  }

  public getView(): "queue" | "solutions" {
    return this.view
  }

  public setView(view: "queue" | "solutions"): void {
    this.view = view
  }

  public getScreenshotQueue(): string[] {
    return this.screenshotQueue
  }

  public getExtraScreenshotQueue(): string[] {
    return this.extraScreenshotQueue
  }

  public clearQueues(): void {
    // Clear screenshotQueue
    this.screenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err)
          console.error(`Error deleting screenshot at ${screenshotPath}:`, err)
      })
    })
    this.screenshotQueue = []

    // Clear extraScreenshotQueue
    this.extraScreenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err)
          console.error(
            `Error deleting extra screenshot at ${screenshotPath}:`,
            err
          )
      })
    })
    this.extraScreenshotQueue = []
  }

  public async takeScreenshot(): Promise<string> {
    let screenshotPath = ""
    const targetDir = this.view === "queue" ? this.screenshotDir : this.extraScreenshotDir
    screenshotPath = path.join(targetDir, `${uuidv4()}.png`)

    try {
      // Capture the entire screen
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: 1920,
          height: 1080
        }
      })

      if (sources.length > 0) {
        // Get the first screen
        const source = sources[0]
        const image = source.thumbnail.toPNG()
        
        // Save the image
        await fs.promises.writeFile(screenshotPath, image)

        // Update queue
        if (this.view === "queue") {
          this.screenshotQueue.push(screenshotPath)
          if (this.screenshotQueue.length > this.MAX_SCREENSHOTS) {
            const removedPath = this.screenshotQueue.shift()
            if (removedPath) {
              try {
                await fs.promises.unlink(removedPath)
              } catch (error) {
                console.error("Error removing old screenshot:", error)
              }
            }
          }
        } else {
          this.extraScreenshotQueue.push(screenshotPath)
          if (this.extraScreenshotQueue.length > this.MAX_SCREENSHOTS) {
            const removedPath = this.extraScreenshotQueue.shift()
            if (removedPath) {
              try {
                await fs.promises.unlink(removedPath)
              } catch (error) {
                console.error("Error removing old screenshot:", error)
              }
            }
          }
        }
        return screenshotPath
      } else {
        throw new Error("No screen sources found")
      }
    } catch (error) {
      console.error("Error taking screenshot:", error)
      throw error
    }
  }

  public async getImagePreview(filepath: string): Promise<string> {
    try {
      const data = await fs.promises.readFile(filepath)
      return `data:image/png;base64,${data.toString("base64")}`
    } catch (error) {
      console.error("Error reading image:", error)
      throw error
    }
  }

  public async deleteScreenshot(
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await fs.promises.unlink(path)
      if (this.view === "queue") {
        this.screenshotQueue = this.screenshotQueue.filter(
          (filePath) => filePath !== path
        )
      } else {
        this.extraScreenshotQueue = this.extraScreenshotQueue.filter(
          (filePath) => filePath !== path
        )
      }
      return { success: true }
    } catch (error) {
      console.error("Error deleting file:", error)
      return { success: false, error: error.message }
    }
  }
}
