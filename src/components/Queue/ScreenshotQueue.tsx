import React from "react"

interface Screenshot {
  path: string
  preview: string
}

interface ScreenshotQueueProps {
  isLoading: boolean
  screenshots: Screenshot[]
  onDeleteScreenshot: (index: number) => void
}
const ScreenshotQueue: React.FC<ScreenshotQueueProps> = () => {
  return null
}

export default ScreenshotQueue
