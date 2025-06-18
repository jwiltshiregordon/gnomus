// Initialize audio playback and monitor buffer size
const fileInput = document.querySelector('input[type="file"]');
const player = document.getElementById('player');
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

