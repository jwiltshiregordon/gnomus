// Initialize audio playback and monitor buffer size
const fileInput = document.querySelector('input[type="file"]');
const player = document.getElementById('player');
const generateBtn = document.getElementById('generate');
const practicePlayer = document.getElementById('practice-player');
const recordBtn = document.getElementById('record');
let audioBuffer = null;
let arrayBuffer = null;

if (fileInput && player) {
  fileInput.addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    arrayBuffer = await file.arrayBuffer();
    player.src = URL.createObjectURL(file);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    if (generateBtn) generateBtn.disabled = false;
  });

  const logBuffer = () => {
    if (arrayBuffer) {
      console.log('Audio buffer bytes:', arrayBuffer.byteLength);
    } else {
      console.log('No audio loaded yet.');
    }
  };

  ['play', 'pause', 'ended'].forEach(evt => {
    player.addEventListener(evt, logBuffer);
  });
}

// Record audio using the microphone
let mediaRecorder = null;
let recordedChunks = [];
let recordingStream = null;

if (recordBtn && player) {
  recordBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      try {
        recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(recordingStream);
        recordedChunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(recordedChunks, { type: 'audio/webm' });
          arrayBuffer = await blob.arrayBuffer();
          player.src = URL.createObjectURL(blob);
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          if (generateBtn) generateBtn.disabled = false;
        };

        mediaRecorder.start();
        recordBtn.textContent = 'Stop Recording';
      } catch (err) {
        console.error('Microphone error:', err);
      }
    } else if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      recordingStream.getTracks().forEach(t => t.stop());
      recordBtn.textContent = 'Record';
    }
  });
}

if (generateBtn && practicePlayer) {
  generateBtn.addEventListener('click', async () => {
    if (!audioBuffer) return;
    generateBtn.disabled = true;

    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length * 5,
      audioBuffer.sampleRate
    );

    for (let i = 0; i < 5; i++) {
      const src = offlineCtx.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(offlineCtx.destination);
      src.start(i * audioBuffer.duration);
    }

    const rendered = await offlineCtx.startRendering();
    const wavBlob = bufferToWave(rendered);
    practicePlayer.src = URL.createObjectURL(wavBlob);
    practicePlayer.disabled = false;
    generateBtn.disabled = false;
  });
}

function bufferToWave(abuffer) {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  let pos = 0;

  const setUint16 = (data) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4);

  const channels = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  let offset = 0;
  while (offset < abuffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

