if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

async function testWavContainer() {
  const key = process.env.GNANI_API_KEY;

  const res = await fetch('https://api.vachana.ai/api/v1/tts/inference', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key-ID': key!,
    },
    body: JSON.stringify({
      text: 'Hello, welcome to Rehearsal AI. I am Pranav, your systems architect.',
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
    signal: AbortSignal.timeout(8000),
  });

  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  const buf = await res.arrayBuffer();
  console.log('Byte length:', buf.byteLength);
  const head = Buffer.from(buf.slice(0, 12)).toString('ascii');
  console.log('First 12 bytes ASCII:', head);
}

testWavContainer();
