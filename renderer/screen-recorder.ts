// screen-recorder.ts

/**
 * Utility for recording the screen from the renderer process.
 * This handles the recording process initiated by the main process.
 */

export class ScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private outputPath: string = '';
  private isRecording: boolean = false;
  private recordingTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Listen for recording start commands from main process
    window.electronAPI.onStreamStart(() => {
      console.log('Stream started from main process');
    });

    // Handle start recording request from main process
    window.electron.ipcRenderer.on('start-recording', async (event, options) => {
      try {
        const { sourceId, outputPath, duration } = options;
        this.outputPath = outputPath;
        
        await this.startRecording(sourceId, duration);
      } catch (error) {
        console.error('Error starting recording:', error);
        window.electron.ipcRenderer.send('recording-error', error.message);
      }
    });
  }

  /**
   * Start screen recording
   * @param sourceId The ID of the screen to record
   * @param duration Duration in milliseconds (default: 10000 ms)
   */
  public async startRecording(sourceId: string, duration: number = 10000): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      this.isRecording = true;
      this.chunks = [];

      // Get the stream from the screen
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // @ts-ignore - Electron-specific constraints
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080,
            frameRate: { ideal: 30 }
          }
        }
      });

      // Create the MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      // Store recorded data chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      // Handle recording completion
      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.chunks, { type: 'video/webm' });
          await this.saveRecording(blob);
          
          this.cleanupRecording();
          window.electron.ipcRenderer.send('recording-complete');
        } catch (error) {
          console.error('Error saving recording:', error);
          window.electron.ipcRenderer.send('recording-error', error.message);
        }
      };

      // Start recording
      this.mediaRecorder.start();
      console.log('Recording started');

      // Stop after the specified duration
      this.recordingTimer = setTimeout(() => {
        this.stopRecording();
      }, duration);

    } catch (error) {
      this.isRecording = false;
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop the current recording
   */
  public stopRecording(): void {
    if (this.recordingTimer) {
      clearTimeout(this.recordingTimer);
      this.recordingTimer = null;
    }

    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      console.log('Recording stopped');
    }
  }

  /**
   * Save the recording to the file system
   */
  private async saveRecording(blob: Blob): Promise<void> {
    if (!this.outputPath) {
      throw new Error('No output path specified');
    }

    const buffer = await blob.arrayBuffer();
    await window.electron.ipcRenderer.invoke('save-recording', {
      buffer: buffer,
      path: this.outputPath
    });

    console.log(`Recording saved to ${this.outputPath}`);
  }

  /**
   * Clean up resources after recording
   */
  private cleanupRecording(): void {
    this.isRecording = false;
    
    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.chunks = [];
  }
}

// Create and export a singleton instance
export const screenRecorder = new ScreenRecorder();