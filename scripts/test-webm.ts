if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

async function testWebmInput() {
  const key = process.env.GNANI_API_KEY;

  // Generate wav
  const ttsRes = await fetch('https://api.vachana.ai/api/v1/tts/inference', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key-ID': key!,
    },
    body: JSON.stringify({
      text: 'Testing audio format compatibility.',
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

  const bytes = await ttsRes.arrayBuffer();

  // Test as audio/wav
  const fdWav = new FormData();
  fdWav.append('audio_file', new Blob([bytes], { type: 'audio/wav' }), 'audio.wav');
  fdWav.append('language_code', 'en-IN');

  const resWav = await fetch('https://api.vachana.ai/stt/v3', {
    method: 'POST',
    headers: { 'X-API-Key-ID': key! },
    body: fdWav,
  });
  console.log('WAV response:', resWav.status, await resWav.text());

  // Test as audio/webm
  const fdWebm = new FormData();
  fdWebm.append('audio_file', new Blob([bytes], { type: 'audio/webm' }), 'audio.webm');
  fdWebm.append('language_code', 'en-IN');

  const resWebm = await fetch('https://api.vachana.ai/stt/v3', {
    method: 'POST',
    headers: { 'X-API-Key-ID': key! },
    body: fdWebm,
  });
  console.log('WEBM mime response:', resWebm.status, await resWebm.text());
}

testWebmInput();

