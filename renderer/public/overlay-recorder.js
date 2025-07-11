let mediaRecorder = null;
let recordedChunks = [];
let startTime = null;
let timerInterval = null;
let isRecording = false;

const timerEl = document.getElementById("timer");
const stopBtn = document.getElementById("stop-btn");

function pad(n) {
  return n < 10 ? "0" + n : n;
}

function updateTimer() {
  if (!startTime) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  timerEl.textContent = pad(min) + ":" + pad(sec);
}

async function startRecording() {
  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    let micStream = null;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {}

    // Collect all audio tracks
    const audioSources = [];
    if (displayStream.getAudioTracks().length > 0) {
      audioSources.push(displayStream);
    }
    if (micStream && micStream.getAudioTracks().length > 0) {
      audioSources.push(micStream);
    }

    // Mix audio tracks into one
    let mixedAudioStream = null;
    if (audioSources.length > 0) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();

      audioSources.forEach(srcStream => {
        const source = audioContext.createMediaStreamSource(srcStream);
        source.connect(destination);
      });

      mixedAudioStream = destination.stream;
    }

    // Combine video track with mixed audio
    const tracks = [...displayStream.getVideoTracks()];
    if (mixedAudioStream && mixedAudioStream.getAudioTracks().length > 0) {
      tracks.push(mixedAudioStream.getAudioTracks()[0]);
    }
    const combinedStream = new MediaStream(tracks);

    mediaRecorder = new MediaRecorder(combinedStream, { mimeType: "video/webm; codecs=vp9" });
    recordedChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
mediaRecorder.onstop = () => {
  stopTimer();
  saveRecordingToVideos();
  isRecording = false;
  // Ensure overlay closes after save completes
  setTimeout(() => {
    if (window.overlayAPI) window.overlayAPI.close();
    // As a fallback, also try to close the window directly if possible
    if (window.close) window.close();
  }, 300);
};

    mediaRecorder.start();
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 500);
    isRecording = true;
  } catch (err) {
    alert("Failed to start recording: " + err);
    if (window.overlayAPI) window.overlayAPI.close();
    isRecording = false;
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function saveRecordingToVideos() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const reader = new FileReader();
  reader.onload = function () {
    // Send buffer to main process to save in Videos/cluely-recordings
    if (window.overlayAPI && window.overlayAPI.saveToVideos) {
      window.overlayAPI.saveToVideos(reader.result);
    } else {
      // fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "recording-" + new Date().toISOString().replace(/[:.]/g, "-") + ".webm";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
  };
  reader.readAsArrayBuffer(blob);
}

stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
};

window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "r") {
    e.preventDefault();
    if (isRecording) {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    } else {
      startRecording();
    }
  }
});

window.onload = startRecording;
