# Free-Cluely: Advanced Stealth Implementation

## Overview

Free-Cluely is designed from the ground up as a covert AI assistance tool that maintains complete discretion in professional environments. This document details the comprehensive stealth capabilities implemented throughout the application.

## Core Stealth Philosophy

The stealth implementation follows three core principles:

1. **Visual Discretion**: Minimize visible footprint on screen
2. **Interaction Invisibility**: Enable control without obvious user actions
3. **Content Security**: Protect sensitive information from observation

## Window Stealth Implementation

### Frameless Window Architecture

```typescript
const windowSettings: Electron.BrowserWindowConstructorOptions = {
  height: 600,
  minWidth: undefined,
  maxWidth: undefined,
  x: this.currentX,
  y: 0,
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: true,
    preload: path.join(__dirname, "preload.js")
  },
  show: true,
  alwaysOnTop: true,
  frame: false,
  transparent: true,
  fullscreenable: false,
  hasShadow: false,
  backgroundColor: "#00000000",
  focusable: true
}
```

The BrowserWindow configuration achieves stealth through:

- **No Window Frame**: Eliminates all standard OS window decorations
- **Full Transparency**: Background completely transparent when needed
- **No Shadow**: Removes telltale drop shadows that would outline the window
- **AlwaysOnTop**: Ensures visibility without requiring focus
- **Dynamic Sizing**: No fixed dimensions that would create a recognizable shape

### Platform-Specific Stealth Optimizations

```typescript
// macOS-specific stealth features
if (process.platform === "darwin") {
  this.mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  })
  this.mainWindow.setHiddenInMissionControl(true)
  this.mainWindow.setAlwaysOnTop(true, "floating")
}

// Linux-specific stealth features
if (process.platform === "linux") {
  if (this.mainWindow.setHasShadow) {
    this.mainWindow.setHasShadow(false)
  }
  this.mainWindow.setFocusable(false)
} 

// Windows & all platforms
this.mainWindow.setSkipTaskbar(true)
```

These optimizations ensure:

- **No Taskbar Presence**: Window doesn't appear in OS taskbar/dock
- **Mission Control Hiding**: Doesn't appear in macOS Mission Control
- **Alt+Tab Exclusion**: Doesn't appear in app switcher on most platforms
- **Workspace Persistence**: Appears across virtual desktops/spaces

## UI Stealth Features

### Minimal Visual Footprint

- Semi-transparent background (configurable opacity)
- Reduced contrast color scheme to avoid drawing attention
- Content-aware sizing that uses minimal screen space
- Subtle animations that don't trigger peripheral vision
- Auto-hiding UI elements when not actively used

### Status Indicators

```typescript

```

All status indicators feature:
- Extremely small footprint (typically under 100px)
- Very low opacity (0.4-0.6)
- Brief display duration (1-2 seconds)
- Auto-hiding behavior
- Neutral colors that blend with background
- Position away from center of vision

## Audio/Visual Stealth Features

### Screenshot Capture Stealth

```typescript
// Before taking screenshot
this.hideMainWindow();

// Take screenshot with system API
const screenshotPath = await screenshot({ format: 'png' });

// After screenshot
this.showMainWindow();
```

- Window auto-hides before taking screenshots
- Screenshots stored in temp directory with random names
- Images securely deleted after processing
- No screenshot history maintained

### Audio Processing Stealth

- Audio recording with minimal UI indication
- Background noise filtering to allow quiet speaking
- Audio files stored in memory where possible
- Secure deletion after processing

## Content Security Features

### Ephemeral Content Handling

- No persistent storage of AI interactions
- Memory-only processing where possible
- Secure temp file handling with guaranteed deletion
- No history or logs of past sessions

### Content Obscuring

```typescript
// Blur content when window loses focus
window.addEventListener('blur', () => {
  if (contentRef.current) {
    contentRef.current.style.filter = 'blur(5px)';
  }
});

window.addEventListener('focus', () => {
  if (contentRef.current) {
    contentRef.current.style.filter = 'none';
  }
});
```

- Auto-blur when window loses focus
- Text scrambling during transitions
- Option to apply continuous subtle visual noise
- Privacy screen effect from certain viewing angles

## Communication Stealth

### Network Traffic Obfuscation

- API requests made only from main process (not renderer)
- No identifying information in request headers
- Standard request patterns to avoid detection by network monitoring

### Streaming Implementation

```typescript
// Process each chunk in the stream
for await (const response of streamingResponse) {
  // Each chunk contains text that we can extract
  if (response.text) {
    console.log(`[LLMHelper] Received chunk: ${response.text.substring(0, 20)}...`);
    fullText += response.text;
    this.streamReply(response.text);
  }
}
```

- Incremental text updates appear naturally
- No sudden content changes that draw attention
- Real-time display matches natural reading pace

## Emergency Stealth Features

### Panic Button

```typescript
// Register global shortcut
globalShortcut.register('CommandOrControl+Escape', () => {
  this.hideMainWindow();
  this.clearAllData();
});
```

- Cmd/Ctrl+Escape instantly hides window
- Option for complete application shutdown
- Secure memory wiping on exit
- Deletion of all temporary files

### Auto-Detection

- Application can detect when screen is being shared/recorded
- Auto-hides or reduces opacity during screen sharing
- Detects nearby mobile devices via Bluetooth (optional)
- Can enter ultra-stealth mode in open office environments

## Stealth UX Considerations

### Gradual Response Rendering

- AI responses appear incrementally, simulating natural typing
- No sudden UI changes that would draw attention
- Animation timing matched to human reading speed
- Smooth transitions between states

### Adaptive Position Awareness

```typescript
// Automatic edge detection and positioning
const primaryDisplay = screen.getPrimaryDisplay();
const workArea = primaryDisplay.workAreaSize;
const maxX = workArea.width - newWidth;
const newX = Math.min(Math.max(currentX, 0), maxX);
```

- Window automatically positions away from screen center
- Avoids covering other application windows
- Smart positioning near screen edges
- Remembers position between sessions

## Conclusion

Free-Cluely's stealth implementation represents a comprehensive approach to creating a truly discreet AI assistant. By combining frameless window techniques, minimal visual design, and secure data handling, the application provides powerful AI capabilities that remain virtually invisible to observers.

The multi-layered stealth approach ensures that users can leverage AI assistance in any professional environment without drawing attention or revealing that they are using AI support.