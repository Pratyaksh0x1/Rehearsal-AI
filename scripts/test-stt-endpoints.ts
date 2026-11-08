if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

async function probeSTTEndpoints() {
  const key = process.env.GNANI_API_KEY;
  const candidates = [
    'https://api.vachana.ai/stt/v3',
    'https://api.vachana.ai/api/v1/stt',
    'https://api.vachana.ai/api/v1/asr',
    'https://api.vachana.ai/api/v1/stt/inference',
    'https://api.vachana.ai/api/v1/asr/inference',
    'https://api.vachana.ai/v1/stt',
    'https://api.vachana.ai/v1/recognize',
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key-ID': key!,
        },
        signal: AbortSignal.timeout(3000),
      });
      console.log(url, '--> Status:', res.status, res.statusText);
      const text = await res.text();
      console.log('   Preview:', text.slice(0, 150));
    } catch (e: any) {
      console.log(url, '--> Failed:', e.name, e.message);
    }
  }
}

probeSTTEndpoints();

