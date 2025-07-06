# Free-Cluely System Design Documentation

## System Architecture Overview

Free-Cluely is built on a multi-process architecture leveraging Electron to combine web technologies with desktop capabilities. The system consists of four main architectural components:

1. **Main Process (Node.js)**: Controls application lifecycle and system integration
2. **Renderer Process (React)**: Handles UI presentation and user interactions
3. **Processing Layer**: Manages AI-driven analysis and response generation
4. **Communication Layer**: Facilitates inter-process communication

![System Architecture Diagram](./docs/assets/system-architecture.png)

## Core Components

### 1. Main Process Components

The main process runs in a Node.js environment and serves as the bridge between the operating system and the application.

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| `WindowHelper` | Window creation, positioning, and stealth UI | `electron/WindowHelper.ts` |
| `ScreenshotHelper` | Screen capture, image processing | `electron/ScreenshotHelper.ts` |
| `ShortcutsHelper` | Global keyboard shortcuts | `electron/shortcuts.ts` |
| `ProcessingHelper` | Manages AI processing workflows | `electron/ProcessingHelper.ts` |
| `IPC Handlers` | Communication with renderer process | `electron/ipcHandlers.ts` |

### 2. Renderer Process Components

The renderer process is built with React and handles all user interface elements.

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| `App` | Main application container | `src/App.tsx` |
| `Queue` | Screenshot/input management | `src/_pages/Queue.tsx` |
| `Solutions` | AI response display | `src/_pages/Solutions.tsx` |

| `UI Components` | Reusable interface elements | `src/components/ui/` |

### 3. AI Integration Layer

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| `LLMHelper` | Gemini API integration | `electron/LLMHelper.ts` |
| `Content Generation` | Text/code generation | `LLMHelper.generateSolution()` |
| `Multimodal Analysis` | Image/audio processing | `LLMHelper.analyze*()` methods |
| `Streaming Response` | Real-time output handling | `LLMHelper.generateSolutionStream()` |

### 4. Data Storage

Free-Cluely uses a combination of in-memory state and temporary file storage:

| Storage | Purpose | Implementation |
|---------|---------|----------------|
| Application State | Runtime application configuration | `electron/main.ts` (AppState class) |
| Query Client Cache | UI data caching | React Query in `src/App.tsx` |
| Temporary Files | Screenshots and audio recordings | System temp directory |

## System Design Principles

### 1. Process Isolation

Free-Cluely maintains strict separation between the main and renderer processes:

- Main process handles privileged operations (screenshots, file system, window management)
- Renderer process focuses on UI rendering and user interactions
- Communication occurs solely through the IPC bridge

### 2. Unidirectional Data Flow

Data flows through the application in a predictable manner:

1. User actions trigger events in the renderer process
2. Events are transmitted to the main process via IPC
3. Main process executes operations and updates application state
4. State changes are communicated back to the renderer process
5. UI updates based on new state

### 3. Stealth-First Design

All components are designed with stealth and discretion as primary concerns, implementing multiple layers of privacy protection:

#### Frameless Window Implementation
- Completely frameless window with `frame: false` in Electron BrowserWindow options
- Custom transparent background (`backgroundColor: "#00000000"`)
- Variable opacity settings that adjust based on interaction state
- No standard window decorations or OS chrome that would identify the application
- Automatic window layering with `setAlwaysOnTop(true, "floating")` to remain visible

#### Visual Discretion Measures
- Minimal UI footprint with semi-transparent elements (opacity: 0.7-0.8)
- Dynamic blur effects that adapt to the underlying content
- Automatic content resizing to minimize screen real estate
- Monochromatic color scheme to avoid drawing attention
- Subtle animations that don't distract peripheral vision

#### Interaction Stealth
- Keyboard-driven interaction to reduce mouse dependency
- Multiple keyboard shortcut combinations for common actions
- Triple-Escape press pattern for stealth activation (less detectable than Ctrl+Alt combinations)

- Window automatically adjusts position based on screen edges

#### Content Privacy
- Auto-hiding toast notifications that self-destruct
- "Confidential mode" that blurs content when unfocused
- Screen content never persisted to disk beyond the current session
- No window title or taskbar presence (`setSkipTaskbar(true)`)
- Option to automatically minimize when another application is focused

## Runtime Behavior

### Application Startup Sequence

1. Main process initializes (`main.ts`)
2. Application state is created (AppState singleton)
3. IPC handlers are registered
4. Window creation and configuration
5. Renderer process loads React application


### Processing Workflow

1. Input collection (screenshot, audio, or text)
2. Pre-processing in main process
3. LLMHelper sends data to Gemini API
4. Processing state updates sent to UI
5. Response received and parsed
6. Streaming chunks sent to UI (if streaming enabled)
7. Final result displayed in Solutions view

## Subsystem Design

### Window Management Subsystem

The window management subsystem provides comprehensive stealth capabilities through:

#### Core Window Stealth Techniques
- Frameless, transparent windows with no OS-level window chrome
- Custom-drawn window controls that blend with the application UI
- BrowserWindow configuration that bypasses standard OS window management:
  ```typescript
  const windowSettings: Electron.BrowserWindowConstructorOptions = {
    webPreferences: { nodeIntegration: true, contextIsolation: true },
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
- Platform-specific optimizations:
  ```typescript
  if (process.platform === "darwin") {
    this.mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true
    })
    this.mainWindow.setHiddenInMissionControl(true)
  }
  if (process.platform === "linux") {
    if (this.mainWindow.setHasShadow) {
      this.mainWindow.setHasShadow(false)
    }
    this.mainWindow.setFocusable(false)
  }
  ```
- Always-on-top behavior with configurable opacity
- Automatic position memory between hide/show cycles
- Content-aware resizing that minimizes window footprint
- Multiple independent positioning methods:
  - Global keyboard shortcuts (Cmd/Ctrl + Arrow keys)

  - Hidden touch zones for drag operations
  - Automatic edge snapping

```
┌───────────────────────┐
│  WindowHelper         │
├───────────────────────┤
│ - createWindow()      │
│ - toggleMainWindow()  │
│ - moveWindow*()       │
│ - setWindowDimensions()│
└─────────┬─────────────┘
          │
          ▼
┌───────────────────────┐
│  Keyboard Shortcuts    │
└───────────────────────┘
```

### AI Processing Subsystem

The AI processing subsystem manages interactions with Google's Gemini models:

```
┌───────────────────────┐
│  ProcessingHelper     │
├───────────────────────┤
│ - processScreenshots()│
│ - processAudio*()     │
└─────────┬─────────────┘
          │
          ▼
┌───────────────────────┐     ┌───────────────────────┐
│  LLMHelper            │────►│  Gemini API           │
├───────────────────────┤     └───────────────────────┘
│ - generateSolution()  │
│ - extractProblem()    │
│ - analyzeImage/Audio()│
└───────────────────────┘
```


## Error Handling and Recovery

Free-Cluely implements a comprehensive error handling strategy:

1. **Graceful Degradation**: Fall back to simpler functionality when advanced features fail
2. **Error Isolation**: Errors in one component don't crash the entire application
3. **User Feedback**: Errors are communicated to the user through the Toast system
4. **Automatic Recovery**: The application attempts to restore normal operation after errors

## Security and Privacy Considerations

The system architecture implements comprehensive security and privacy protections for maximum stealth and discretion:

### Content Security
1. **Visual Privacy**:
   - Auto-hiding UI elements when not in focus
   - Content blur effect when another application is focused
   - No screenshots or screen recordings of application content
   - Reduced opacity when not actively being used

2. **Operational Security**:
   - Window positioning away from standard screen locations
   - No taskbar or dock presence (`setSkipTaskbar(true)`)
   - Missing from Alt+Tab application switchers on some platforms
   - Window title set to generic value to avoid suspicion in process lists

3. **Content Lifecycle**:
   - All screenshots deleted after processing
   - In-memory processing without disk caching where possible
   - No session history or logs maintained
   - Option to auto-clear content after period of inactivity

### API and Data Security
1. **API Key Protection**: 
   - API keys stored in environment variables, never in code
   - Keys accessible only to the main process, not renderer
   - No API keys stored in application settings or configuration files
   - Automatic token rotation support for enhanced security

2. **Process Isolation**: 
   - Sensitive operations run in the main process only
   - Context isolation enforced through Electron's security features
   - Preload script defines minimal API surface
   - IPC validation of all incoming messages

3. **Minimal Persistence**: 
   - No user data stored persistently between sessions
   - Temporary files automatically cleaned up on application exit
   - No cookies or local storage used for sensitive information
   - Option for "leave no trace" mode that removes all evidence of use

4. **Permission Scoping**: 

   - Microphone access only active during audio recording
   - All system permissions clearly communicated to user
   - No background processes that continue after application is closed

## Performance Optimization

1. **Lazy Loading**: Components are loaded only when needed
2. **Throttling**: High-frequency events are throttled to reduce CPU usage
3. **Efficient IPC**: Minimize data transfer between processes
4. **Streaming Responses**: AI responses stream in chunks for faster perceived performance

## Scalability Considerations

While Free-Cluely is primarily a desktop application, the architecture allows for:

1. **Model Switching**: Easy transition between different AI models
2. **Feature Extensibility**: New analysis capabilities can be added by extending the LLMHelper
3. **UI Adaptability**: The interface automatically adjusts to different content sizes

## Testing Strategy

The system design supports several testing approaches:

1. **Component Testing**: Individual React components can be tested in isolation
2. **Integration Testing**: IPC communication paths can be tested end-to-end
3. **Mock Services**: AI services can be mocked for predictable testing
4. **User Interaction Testing**: Keyboard shortcuts can be simulated

## Future Architecture Extensions

The current architecture allows for several planned enhancements:

1. **Pluggable AI Models**: Support for multiple AI providers beyond Gemini
2. **Enhanced Multimodal Support**: Video analysis and additional input types
3. **Collaborative Features**: Shared AI sessions between multiple users
4. **Additional Stealth Methods**: More ways to interact discreetly with the application