// Provider Adapters Base and Registry

/**
 * Normalized Model Catalog with real capabilities and context limits
 */
const MODEL_CATALOG = [
  // 1. Puter-Supported Models (User-Pays direct through Puter AI Gateway)
  {
    id: 'claude-3-7-sonnet',
    provider: 'puter',
    name: 'Claude 3.7 Sonnet (Puter)',
    contextLength: 200000,
    supportsStreaming: true,
    supportsVision: true,
    supportsReasoning: true,
    supportsCode: true,
    pricingNote: 'Billed against your personal Puter allowance',
    accessMethod: 'puter'
  },
  {
    id: 'claude-3-5-sonnet',
    provider: 'puter',
    name: 'Claude 3.5 Sonnet (Puter)',
    contextLength: 200000,
    supportsStreaming: true,
    supportsVision: true,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Billed against your personal Puter allowance',
    accessMethod: 'puter'
  },
  {
    id: 'gpt-4o',
    provider: 'puter',
    name: 'GPT-4o (Puter)',
    contextLength: 128000,
    supportsStreaming: true,
    supportsVision: true,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Billed against your personal Puter allowance',
    accessMethod: 'puter'
  },
  {
    id: 'gpt-4o-mini',
    provider: 'puter',
    name: 'GPT-4o mini (Puter)',
    contextLength: 128000,
    supportsStreaming: true,
    supportsVision: true,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Billed against your personal Puter allowance',
    accessMethod: 'puter'
  },
  {
    id: 'deepseek-chat',
    provider: 'puter',
    name: 'DeepSeek V3 (Puter)',
    contextLength: 64000,
    supportsStreaming: true,
    supportsVision: false,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Billed against your personal Puter allowance',
    accessMethod: 'puter'
  },
  {
    id: 'deepseek-reasoner',
    provider: 'puter',
    name: 'DeepSeek R1 (Puter)',
    contextLength: 64000,
    supportsStreaming: true,
    supportsVision: false,
    supportsReasoning: true,
    supportsCode: true,
    pricingNote: 'Billed against your personal Puter allowance',
    accessMethod: 'puter'
  },

  // 2. OpenRouter (BYOK)
  {
    id: 'anthropic/claude-3.7-sonnet',
    provider: 'openrouter',
    name: 'Anthropic Claude 3.7 Sonnet',
    contextLength: 200000,
    supportsStreaming: true,
    supportsVision: true,
    supportsReasoning: true,
    supportsCode: true,
    pricingNote: 'Direct OpenRouter rates (~$3/M input, $15/M output)',
    accessMethod: 'byok'
  },
  {
    id: 'deepseek/deepseek-r1',
    provider: 'openrouter',
    name: 'DeepSeek R1',
    contextLength: 64000,
    supportsStreaming: true,
    supportsVision: false,
    supportsReasoning: true,
    supportsCode: true,
    pricingNote: 'Direct OpenRouter rates (~$0.55/M input, $2.19/M output)',
    accessMethod: 'byok'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    provider: 'openrouter',
    name: 'Meta Llama 3.3 70B Instruct',
    contextLength: 131072,
    supportsStreaming: true,
    supportsVision: false,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Direct OpenRouter rates (~$0.12/M input, $0.30/M output)',
    accessMethod: 'byok'
  },

  // 3. OpenAI (BYOK)
  {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'OpenAI GPT-4o',
    contextLength: 128000,
    supportsStreaming: true,
    supportsVision: true,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Direct OpenAI rates ($2.50/M input, $10.00/M output)',
    accessMethod: 'byok'
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    name: 'OpenAI GPT-4o-mini',
    contextLength: 128000,
    supportsStreaming: true,
    supportsVision: true,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Direct OpenAI rates ($0.15/M input, $0.60/M output)',
    accessMethod: 'byok'
  },
  {
    id: 'o3-mini',
    provider: 'openai',
    name: 'OpenAI o3-mini (Reasoning)',
    contextLength: 200000,
    supportsStreaming: true,
    supportsVision: false,
    supportsReasoning: true,
    supportsCode: true,
    pricingNote: 'Direct OpenAI rates ($1.10/M input, $4.40/M output)',
    accessMethod: 'byok'
  },

  // 4. Anthropic (BYOK)
  {
    id: 'claude-3-7-sonnet-20250219',
    provider: 'anthropic',
    name: 'Claude 3.7 Sonnet',
    contextLength: 200000,
    supportsStreaming: true,
    supportsVision: true,
    supportsReasoning: true,
    supportsCode: true,
    pricingNote: 'Direct Anthropic rates ($3.00/M input, $15.00/M output)',
    accessMethod: 'byok'
  },
  {
    id: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    name: 'Claude 3.5 Haiku',
    contextLength: 200000,
    supportsStreaming: true,
    supportsVision: false,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Direct Anthropic rates ($0.80/M input, $4.00/M output)',
    accessMethod: 'byok'
  },

  // 5. Google Gemini (BYOK)
  {
    id: 'gemini-2.0-flash',
    provider: 'gemini',
    name: 'Gemini 2.0 Flash',
    contextLength: 1048576,
    supportsStreaming: true,
    supportsVision: true,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Direct Google AI Studio rates ($0.10/M input, $0.40/M output)',
    accessMethod: 'byok'
  },
  {
    id: 'gemini-1.5-pro',
    provider: 'gemini',
    name: 'Gemini 1.5 Pro',
    contextLength: 2097152,
    supportsStreaming: true,
    supportsVision: true,
    supportsReasoning: true,
    supportsCode: true,
    pricingNote: 'Direct Google AI Studio rates ($1.25/M input, $5.00/M output)',
    accessMethod: 'byok'
  },

  // 6. Groq (BYOK)
  {
    id: 'llama-3.3-70b-versatile',
    provider: 'groq',
    name: 'Llama 3.3 70B (Groq Ultra-Fast)',
    contextLength: 128000,
    supportsStreaming: true,
    supportsVision: false,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Direct Groq rates (~$0.59/M input, $0.79/M output)',
    accessMethod: 'byok'
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    provider: 'groq',
    name: 'DeepSeek R1 Distill 70B (Groq)',
    contextLength: 128000,
    supportsStreaming: true,
    supportsVision: false,
    supportsReasoning: true,
    supportsCode: true,
    pricingNote: 'Direct Groq rates (~$0.75/M input, $0.99/M output)',
    accessMethod: 'byok'
  },

  // 7. DeepSeek (BYOK)
  {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek V3',
    contextLength: 64000,
    supportsStreaming: true,
    supportsVision: false,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Direct DeepSeek rates ($0.14/M input, $0.28/M output)',
    accessMethod: 'byok'
  },
  {
    id: 'deepseek-reasoner',
    provider: 'deepseek',
    name: 'DeepSeek R1',
    contextLength: 64000,
    supportsStreaming: true,
    supportsVision: false,
    supportsReasoning: true,
    supportsCode: true,
    pricingNote: 'Direct DeepSeek rates ($0.55/M input, $2.19/M output)',
    accessMethod: 'byok'
  },

  // 8. Mistral AI (BYOK)
  {
    id: 'mistral-large-latest',
    provider: 'mistral',
    name: 'Mistral Large',
    contextLength: 128000,
    supportsStreaming: true,
    supportsVision: true,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Direct Mistral rates ($2.00/M input, $6.00/M output)',
    accessMethod: 'byok'
  },
  {
    id: 'codestral-latest',
    provider: 'mistral',
    name: 'Codestral (Specialized Code)',
    contextLength: 256000,
    supportsStreaming: true,
    supportsVision: false,
    supportsReasoning: false,
    supportsCode: true,
    pricingNote: 'Direct Mistral rates ($0.30/M input, $0.90/M output)',
    accessMethod: 'byok'
  }
];

class BaseAdapter {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  async testKey(apiKey) {
    throw new Error('Not implemented');
  }

  async streamChat(messages, options, onChunk) {
    throw new Error('Not implemented');
  }
}

module.exports = {
  MODEL_CATALOG,
  BaseAdapter
};
