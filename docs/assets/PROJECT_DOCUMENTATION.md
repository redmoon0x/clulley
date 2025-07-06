# Free-Cluely: The Stealth AI Assistant

## Project Overview

Free-Cluely is an advanced AI assistant designed for discreet use in professional environments. It floats above other applications, ready to provide instant help for software engineers through screenshots, audio analysis, and text-based interactions - all while remaining unobtrusive and easily dismissible.

The application leverages modern AI technology, specifically Google's Gemini models, to analyze inputs and generate context-aware responses. What sets Free-Cluely apart is its focus on stealth and privacy - allowing users to get AI assistance without drawing attention or disrupting their workflow.

## Documentation Structure

For comprehensive understanding of this project, please review the following documentation:

- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - This file, general overview
- **[SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)** - Detailed system architecture
- **[DATA_FLOW.md](./DATA_FLOW.md)** - Data flow diagrams and explanations
- **[STEALTH_FEATURES.md](./STEALTH_FEATURES.md)** - Comprehensive stealth implementation details

## Technical Architecture

### Core Technologies

- **Electron**: Cross-platform desktop framework
- **React**: Frontend UI library
- **TypeScript**: Type-safe JavaScript
- **Google Gemini API**: Advanced AI model integration

### Main Components

1. **Main Process (Electron)**
   - Handles window management
   - Captures screenshots
   - Manages IPC communication
   - Controls application lifecycle

2. **Renderer Process (React)**
   - User interface with minimal design
   - Queue view for input management
   - Solutions view for AI responses

3. **LLM Helper**
   - Interfaces with Google Gemini API
   - Manages streaming responses
   - Processes multimodal inputs (images, audio)
   - Formats AI responses

4. **Processing Helper**
   - Coordinates data flow between UI and AI
   - Manages processing queue
   - Handles debug workflows

## Key Stealth Features

Free-Cluely incorporates advanced stealth features designed to make the application discreet and unobtrusive. For a comprehensive overview of all stealth features, please refer to [STEALTH_FEATURES.md](./STEALTH_FEATURES.md).

### 1. Frameless Window Architecture

The application uses a completely frameless window implementation that eliminates all standard OS window decorations and controls:

- Zero-chrome window with full transparency
- No taskbar or dock presence
- Dynamic opacity based on interaction state
- Automatic positioning to avoid drawing attention
- Content-aware resizing to minimize screen footprint

### 2. Multi-modal Interaction

The application supports multiple discreet interaction methods:

- **Keyboard shortcuts**: Comprehensive global shortcuts
- **Triple-Escape pattern**: Stealth activation sequence
- **Smart positioning**: Window automatically adjusts position

### 3. Content Privacy Features

Advanced content protection features include:

- Auto-blur when window loses focus
- No persistent storage of interaction history
- Secure deletion of all temporary files
- Memory-only processing where possible
- Emergency "panic button" for instant hiding

## Technical Implementation Details

For comprehensive technical details, please refer to [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) and [DATA_FLOW.md](./DATA_FLOW.md). Below is a brief overview of key technical components:

### Google Gemini API Integration

The application uses the latest `@google/genai` SDK to interact with Google's Gemini models:

```typescript
import { GoogleGenAI } from "@google/genai"

export class LLMHelper {
  private ai: GoogleGenAI
  private modelName: string = "gemini-2.0-flash"
  
  constructor(apiKey: string, mainWindow?: BrowserWindow | null) {
    this.ai = new GoogleGenAI({ apiKey });
    this.mainWindow = mainWindow || null;
  }
  
  // Methods for generating content, analyzing images, etc.
}
```

### Electron Multi-Process Architecture

The application leverages Electron's main and renderer process separation:

- **Main Process**: Handles system-level operations (screenshots, window management)
- **Renderer Process**: Manages UI and user interactions
- **IPC Bridge**: Secure communication between processes
- **Preload Script**: Controlled exposure of APIs to renderer

### Stealth Window Management

```typescript
// Window configuration for maximum stealth
const windowSettings: Electron.BrowserWindowConstructorOptions = {
  show: true,
  alwaysOnTop: true,
  frame: false,
  transparent: true,
  fullscreenable: false,
  hasShadow: false,
  backgroundColor: "#00000000",
  focusable: true
}

// Platform-specific optimizations
if (process.platform === "darwin") {
  this.mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  })
  this.mainWindow.setHiddenInMissionControl(true)
}

// Window position management
public moveWindowLeft(): void {
  if (!this.mainWindow) return
  const windowWidth = this.windowSize?.width || 0
  const halfWidth = windowWidth / 2
  this.currentX = Math.max(-halfWidth, this.currentX - this.step)
  this.mainWindow.setPosition(
    Math.round(this.currentX),
    Math.round(this.currentY)
  )
}
```

## Usage Workflow

1. **Activation**: Press Cmd/Ctrl+Space to show the Free-Cluely window, or use the triple-Escape stealth activation
2. **Input**: Capture a screenshot, record audio, or type a question
3. **Processing**: The AI analyzes the input and generates a response with real-time streaming
4. **Result**: View the AI's suggestions, code samples, or explanations
5. **Stealth Control**: Use keyboard shortcuts or panic button as needed

## Privacy and Security Considerations

Free-Cluely implements comprehensive security measures:

- Frameless window with no OS-level visibility
- No persistent storage of user interactions
- Memory-only processing with secure cleanup
- Emergency "panic button" functionality
- Auto-blur when window loses focus
- No taskbar or application switcher presence

For complete details on security implementation, see [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md).

## System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **Hardware**: 
  - 4GB RAM minimum (8GB recommended)
  - Intel i5/AMD Ryzen 5 or better
- **Network**: Internet connection for API calls
- **API Key**: Google Gemini API key

## Conclusion

Free-Cluely represents a new approach to AI assistance that prioritizes discretion and seamless integration into professional workflows. By combining advanced AI capabilities with innovative stealth features like frameless windows, the application allows users to leverage AI assistance without drawing attention or disrupting their environment.

The combination of Google's Gemini models and Electron's system integration capabilities creates a uniquely powerful tool for professionals who need quick, reliable AI assistance while maintaining complete privacy and discretion.

For developers interested in the complete implementation details, please review the accompanying technical documentation files:
- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
- [DATA_FLOW.md](./DATA_FLOW.md)
- [STEALTH_FEATURES.md](./STEALTH_FEATURES.md)
