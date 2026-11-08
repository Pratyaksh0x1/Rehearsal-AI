if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples: Float32Array, sampleRate: number): Buffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return Buffer.from(buffer);
}

async function testCustomWav() {
  const key = process.env.GNANI_API_KEY;
  // Create 1 second of 440Hz sine wave tone
  const sampleRate = 16000;
  const samples = new Float32Array(sampleRate);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
  }

  const wavBuf = encodeWAV(samples, sampleRate);
  console.log('Encoded custom WAV buffer length:', wavBuf.length);

  const fd = new FormData();
  const blob = new Blob([new Uint8Array(wavBuf)], { type: 'audio/wav' });
  fd.append('audio_file', blob, 'recording.wav');
  fd.append('language_code', 'en-IN');

  const res = await fetch('https://api.vachana.ai/stt/v3', {
    method: 'POST',
    headers: { 'X-API-Key-ID': key! },
    body: fd,
  });

  console.log('Status:', res.status, res.statusText);
  const json = await res.json();
  console.log('Result:', json);
}

testCustomWav();

