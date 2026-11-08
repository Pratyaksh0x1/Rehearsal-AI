if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

async function testSTTWithAudioFile() {
  const key = process.env.GNANI_API_KEY;

  // 1. Generate audio with TTS
  console.log('Generating test audio from TTS...');
  const ttsRes = await fetch('https://api.vachana.ai/api/v1/tts/inference', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key-ID': key!,
    },
    body: JSON.stringify({
      text: 'I will solve this using a hash map for linear time.',
      voice: 'Pranav',
      model: 'timbre-v2.5',
      language: 'en-IN',
      speed: 1.0,
      audio_config: {
        encoding: 'linear_pcm',
        container: 'wav',
        num_channels: 1,
        sample_rate: 24000,
      },
    }),
  });

  const wavBytes = await ttsRes.arrayBuffer();
  console.log('Generated WAV audio bytes:', wavBytes.byteLength);

  // 2. Send wav to STT /stt/v3 with body field audio_file
  const formData = new FormData();
  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  formData.append('audio_file', blob, 'sample.wav');
  formData.append('language_code', 'en-IN');

  console.log('Sending audio to https://api.vachana.ai/stt/v3 ...');
  const sttRes = await fetch('https://api.vachana.ai/stt/v3', {
    method: 'POST',
    headers: {
      'X-API-Key-ID': key!,
    },
    body: formData,
  });

  console.log('STT Status:', sttRes.status, sttRes.statusText);
  const json = await sttRes.json();
  console.log('STT Response JSON:', JSON.stringify(json, null, 2));
}

testSTTWithAudioFile();
