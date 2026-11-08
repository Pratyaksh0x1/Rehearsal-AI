async function testEndpoints() {
  console.log('Testing /api/voice/tts...');
  const ttsRes = await fetch('http://localhost:3000/api/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Hello candidate, welcome to your technical interview.',
      voice: 'Pranav',
      model: 'timbre-v2.5',
    }),
  });
  console.log('TTS Status:', ttsRes.status, ttsRes.statusText);
  console.log('TTS Content-Type:', ttsRes.headers.get('content-type'));
  const ttsBuf = await ttsRes.arrayBuffer();
  console.log('TTS Audio Bytes Received:', ttsBuf.byteLength);

  console.log('\nTesting /api/voice/stt with generated audio...');
  const fd = new FormData();
  const blob = new Blob([ttsBuf], { type: 'audio/wav' });
  fd.append('audio', blob, 'sample.wav');

  const sttRes = await fetch('http://localhost:3000/api/voice/stt', {
    method: 'POST',
    body: fd,
  });
  console.log('STT Status:', sttRes.status, sttRes.statusText);
  const sttJson = await sttRes.json();
  console.log('STT Transcript Output:', sttJson);
}

testEndpoints();

