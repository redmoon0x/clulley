import React from "react"

interface Screenshot {
  path: string
  preview: string
}

interface ScreenshotItemProps {
  screenshot: Screenshot
  onDelete: (index: number) => void
  index: number
  isLoading: boolean
}

const ScreenshotItem: React.FC<ScreenshotItemProps> = () => {
  return null
}

export default ScreenshotItem
