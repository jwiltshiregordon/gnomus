// Initialize audio playback and monitor buffer size
import { SoundTouch, SimpleFilter, WebAudioBufferSource } from './node_modules/soundtouchjs/dist/soundtouch.js';

const fileInput = document.querySelector('input[type="file"]');
const player = document.getElementById('player');
const generateBtn = document.getElementById('generate');
const practicePlayer = document.getElementById('practice-player');
let audioBuffer = null;
let arrayBuffer = null;

async function stretchBuffer(buffer, tempo) {
  const soundtouch = new SoundTouch();
  soundtouch.tempo = tempo;
  const source = new WebAudioBufferSource(buffer);
  const filter = new SimpleFilter(source, soundtouch);
  const outL = [];
  const outR = [];
  const tmp = new Float32Array(4096 * 2);
  let frames = 0;
  while ((frames = filter.extract(tmp, 4096)) > 0) {
    for (let i = 0; i < frames; i++) {
      outL.push(tmp[i * 2]);
      outR.push(tmp[i * 2 + 1]);
    }
  }
  const outLength = outL.length;
  const result = new AudioBuffer({
    length: outLength,
    numberOfChannels: 2,
    sampleRate: buffer.sampleRate
  });
  result.copyToChannel(Float32Array.from(outL), 0);
  result.copyToChannel(Float32Array.from(outR), 1);
  return result;
}

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

if (generateBtn && practicePlayer) {
  generateBtn.addEventListener('click', async () => {
    if (!audioBuffer) return;
    generateBtn.disabled = true;

    const pattern = [1, 2, 1, 2, 1, 2, 1];
    const segments = [];
    for (const tempo of pattern) {
      if (tempo === 1) {
        segments.push(audioBuffer);
      } else {
        segments.push(await stretchBuffer(audioBuffer, tempo));
      }
    }

    const totalLength = segments.reduce((sum, b) => sum + b.length, 0);
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      totalLength,
      audioBuffer.sampleRate
    );

    let offset = 0;
    for (const buf of segments) {
      const src = offlineCtx.createBufferSource();
      src.buffer = buf;
      src.connect(offlineCtx.destination);
      src.start(offset / audioBuffer.sampleRate);
      offset += buf.length;
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

