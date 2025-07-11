const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlayAPI", {
  close: () => ipcRenderer.send("close-overlay-recorder"),
  saveToVideos: (arrayBuffer) => {
    // Save buffer to Videos/cluely-recordings/recording-<timestamp>.webm
    ipcRenderer.send("save-overlay-recording", arrayBuffer);
  }
});
