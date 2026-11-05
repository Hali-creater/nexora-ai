const { BaseAdapter } = require('./base');

/**
 * Universal OpenAI-Compatible Adapter
 * Works seamlessly for: OpenAI, OpenRouter, Groq, DeepSeek, Mistral
 */
class OpenAICompatibleAdapter extends BaseAdapter {
  constructor(id, name, baseUrl, defaultHeaders = {}) {
    super(id, name);
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultHeaders = defaultHeaders;
  }

  async testKey(apiKey) {
    const url = `${this.baseUrl}/models`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...this.defaultHeaders
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Authentication failed (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch (_) {}
      throw new Error(msg);
    }

    return { valid: true };
  }

  async streamChat(messages, options, onChunk) {
    const { apiKey, model, temperature, maxTokens } = options;
    const url = `${this.baseUrl}/chat/completions`;

    const body = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      stream: true,
      ...(temperature !== undefined ? { temperature: Number(temperature) } : {}),
      ...(maxTokens ? { max_tokens: Number(maxTokens) } : {})
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...this.defaultHeaders
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Provider error (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error?.message || errMsg;
      } catch (_) {}
      throw new Error(errMsg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '');
        if (payload === '[DONE]') {
          onChunk({ done: true });
          return;
        }

        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content || '';
          const finishReason = json.choices?.[0]?.finish_reason;
          if (delta || finishReason) {
            onChunk({ text: delta, finishReason, done: false });
          }
        } catch (_) {
          // Ignore parse errors on SSE keep-alive comments
        }
      }
    }

    onChunk({ done: true });
  }
}

/**
 * Anthropic Claude Adapter
 */
class AnthropicAdapter extends BaseAdapter {
  constructor() {
    super('anthropic', 'Anthropic');
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  async testKey(apiKey) {
    // Test key using minimal token call or header check
    const url = `${this.baseUrl}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }]
      })
    });

    // If 401, key is definitely invalid
    if (res.status === 401) {
      throw new Error('Invalid Anthropic API Key');
    }
    return { valid: true };
  }

  async streamChat(messages, options, onChunk) {
    const { apiKey, model, temperature, maxTokens } = options;
    const url = `${this.baseUrl}/messages`;

    // Extract system prompt if present
    let systemPrompt = '';
    const formattedMessages = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt += (systemPrompt ? '\n\n' : '') + msg.content;
      } else {
        formattedMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      }
    }

    // Anthropic requires non-empty messages and starts with user
    if (formattedMessages.length === 0) {
      formattedMessages.push({ role: 'user', content: 'Hello' });
    }

    const body = {
      model: model || 'claude-3-7-sonnet-20250219',
      max_tokens: maxTokens || 4096,
      stream: true,
      messages: formattedMessages,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      ...(temperature !== undefined ? { temperature: Number(temperature) } : {})
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Anthropic error (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error?.message || errMsg;
      } catch (_) {}
      throw new Error(errMsg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '');

        try {
          const json = JSON.parse(payload);
          if (json.type === 'content_block_delta' && json.delta?.text) {
            onChunk({ text: json.delta.text, done: false });
          } else if (json.type === 'message_stop') {
            onChunk({ done: true });
            return;
          }
        } catch (_) {}
      }
    }

    onChunk({ done: true });
  }
}

/**
 * Google Gemini Adapter (v1beta Generative Language API)
 */
class GeminiAdapter extends BaseAdapter {
  constructor() {
    super('gemini', 'Google Gemini');
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async testKey(apiKey) {
    const url = `${this.baseUrl}/models?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      let msg = 'Invalid Google Gemini API key';
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    return { valid: true };
  }

  async streamChat(messages, options, onChunk) {
    const { apiKey, model } = options;
    const targetModel = model || 'gemini-2.0-flash';
    const url = `${this.baseUrl}/models/${targetModel}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

    const contents = [];
    let systemInstruction = null;

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = { parts: [{ text: msg.content }] };
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    const body = {
      contents,
      ...(systemInstruction ? { systemInstruction } : {})
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Gemini API error (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch (_) {}
      throw new Error(msg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '');

        try {
          const json = JSON.parse(payload);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            onChunk({ text, done: false });
          }
        } catch (_) {}
      }
    }

    onChunk({ done: true });
  }
}

/**
 * Adapter Registry Instance Map
 */
const adapters = {
  openrouter: new OpenAICompatibleAdapter('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1', {
    'HTTP-Referer': 'https://nexora.ai',
    'X-Title': 'NEXORA AI'
  }),
  openai: new OpenAICompatibleAdapter('openai', 'OpenAI', 'https://api.openai.com/v1'),
  anthropic: new AnthropicAdapter(),
  gemini: new GeminiAdapter(),
  groq: new OpenAICompatibleAdapter('groq', 'Groq', 'https://api.groq.com/openai/v1'),
  deepseek: new OpenAICompatibleAdapter('deepseek', 'DeepSeek', 'https://api.deepseek.com'),
  mistral: new OpenAICompatibleAdapter('mistral', 'Mistral AI', 'https://api.mistral.ai/v1')
};

function getAdapter(providerId) {
  return adapters[providerId] || null;
}

module.exports = {
  getAdapter,
  adapters
};
