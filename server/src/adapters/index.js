const { BaseAdapter } = require('./base');
const { sanitizeErrorMessage } = require('../services/sanitizer');

/**
 * Universal OpenAI-Compatible Adapter
 * Works for: OpenAI, OpenRouter, Groq, DeepSeek, Mistral
 */
class OpenAICompatibleAdapter extends BaseAdapter {
  constructor(id, name, baseUrl, defaultHeaders = {}) {
    super(id, name);
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultHeaders = defaultHeaders;
  }

  async testKey(apiKey) {
    const url = `${this.baseUrl}/models`;
    let res;
    try {
      res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...this.defaultHeaders
        }
      });
    } catch (err) {
      throw new Error(sanitizeErrorMessage(`Network error connecting to ${this.name}: ${err.message}`, apiKey));
    }

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Authentication failed (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch (_) {}
      throw new Error(sanitizeErrorMessage(msg, apiKey));
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
      stream_options: { include_usage: true },
      ...(temperature !== undefined ? { temperature: Number(temperature) } : {}),
      ...(maxTokens ? { max_tokens: Number(maxTokens) } : {})
    };

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...this.defaultHeaders
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new Error(sanitizeErrorMessage(`Connection to ${this.name} failed: ${err.message}`, apiKey));
    }

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Provider error (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error?.message || errMsg;
      } catch (_) {}
      throw new Error(sanitizeErrorMessage(errMsg, apiKey));
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
          const usage = json.usage || null;
          if (delta || finishReason || usage) {
            onChunk({ text: delta, finishReason, usage, done: false });
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
    // Test key using minimal token call
    const url = `${this.baseUrl}/messages`;
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }]
        })
      });
    } catch (err) {
      throw new Error(sanitizeErrorMessage(`Connection to Anthropic failed: ${err.message}`, apiKey));
    }

    // Only 200 OK (or success status) indicates a valid key
    if (res.status !== 200) {
      const errText = await res.text();
      let errMsg = `Anthropic key validation failed (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error?.message || errMsg;
      } catch (_) {}
      throw new Error(sanitizeErrorMessage(errMsg, apiKey));
    }

    return { valid: true };
  }

  async streamChat(messages, options, onChunk) {
    const { apiKey, model, temperature, maxTokens } = options;
    const url = `${this.baseUrl}/messages`;

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

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new Error(sanitizeErrorMessage(`Connection to Anthropic failed: ${err.message}`, apiKey));
    }

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Anthropic error (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error?.message || errMsg;
      } catch (_) {}
      throw new Error(sanitizeErrorMessage(errMsg, apiKey));
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
          } else if (json.type === 'message_delta' && json.usage) {
            onChunk({ usage: json.usage, done: false });
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
 * Transports API key via header 'x-goog-api-key' to avoid sensitive query parameters in URLs and access logs.
 */
class GeminiAdapter extends BaseAdapter {
  constructor() {
    super('gemini', 'Google Gemini');
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async testKey(apiKey) {
    const url = `${this.baseUrl}/models`;
    let res;
    try {
      res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey
        }
      });
    } catch (err) {
      throw new Error(sanitizeErrorMessage(`Connection to Google Gemini failed: ${err.message}`, apiKey));
    }

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Google Gemini key validation failed (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch (_) {}
      throw new Error(sanitizeErrorMessage(msg, apiKey));
    }

    return { valid: true };
  }

  async streamChat(messages, options, onChunk) {
    const { apiKey, model } = options;
    const targetModel = model || 'gemini-2.0-flash';
    const url = `${this.baseUrl}/models/${targetModel}:streamGenerateContent?alt=sse`;

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

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new Error(sanitizeErrorMessage(`Connection to Google Gemini failed: ${err.message}`, apiKey));
    }

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Gemini API error (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch (_) {}
      throw new Error(sanitizeErrorMessage(msg, apiKey));
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
          const usageMetadata = json.usageMetadata || null;
          if (text || usageMetadata) {
            onChunk({ text: text || '', usage: usageMetadata, done: false });
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
