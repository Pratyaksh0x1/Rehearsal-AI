export interface SendChatMessageOptions {
  body: Record<string, any>;
  signal?: AbortSignal;
  onChunk?: (token: string) => void;
  fallbackReply?: string;
}

export interface GreetingChatResponse {
  reply: string;
  intent: 'has_question' | 'ready_to_start' | 'other';
}

/**
 * Shared SSE streaming chat client for Technical, HR, and Resume rounds.
 * Supports token-by-token streaming with automatic sentence pipelining into TTS.
 */
export async function sendChatMessage({
  body,
  signal,
  onChunk,
  fallbackReply = "I'm following your line of thought. Please continue.",
}: SendChatMessageOptions): Promise<string> {
  const wantsStream = Boolean(onChunk);
  const payload = {
    ...body,
    stream: wantsStream,
  };

  const res = await fetch('/api/interviews/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(wantsStream ? { Accept: 'text/event-stream' } : {}),
    },
    signal,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || `Chat API error (HTTP ${res.status})`);
  }

  if (wantsStream && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullReply = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr) {
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.token) {
                fullReply += parsed.token;
                onChunk?.(parsed.token);
              } else if (parsed.done && parsed.fullText) {
                fullReply = parsed.fullText;
              }
            } catch {
              // ignore malformed JSON chunk
            }
          }
        }
      }
    }

    return fullReply || fallbackReply;
  }

  const data = await res.json();
  if (typeof data?.reply === 'string') {
    return data.reply;
  }
  if (typeof data === 'string') {
    return data;
  }
  return data?.reply ? String(data.reply) : fallbackReply;
}

/**
 * Structured Greeting & Q&A chat client for the opening meeting chamber.
 * Returns both the interviewer's spoken reply and the candidate's detected intent.
 */
export async function sendGreetingChatMessage({
  body,
  signal,
  fallbackReply = 'Do you have any questions before we get started?',
}: SendChatMessageOptions): Promise<GreetingChatResponse> {
  const payload = {
    ...body,
    phase: 'greeting',
    stream: false,
  };

  const res = await fetch('/api/interviews/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || `Chat API error (HTTP ${res.status})`);
  }

  const data = await res.json();
  const replyText =
    typeof data?.reply === 'string'
      ? data.reply
      : typeof data === 'string'
      ? data
      : String(data?.reply || fallbackReply);

  const intent =
    data?.intent === 'ready_to_start' ||
    data?.intent === 'has_question' ||
    data?.intent === 'other'
      ? data.intent
      : 'other';

  return {
    reply: replyText,
    intent,
  };
}
