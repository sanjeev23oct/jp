import { z } from 'zod';

// LLM Provider Types
export const LLMProviderSchema = z.enum([
  'deepseek',
  'openai',
  'anthropic',
  'ollama',
  'custom'
]);

export type LLMProvider = z.infer<typeof LLMProviderSchema>;

// LLM Message Schema
export const LLMMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string()
});

export type LLMMessage = z.infer<typeof LLMMessageSchema>;

// LLM Request Schema
export const LLMRequestSchema = z.object({
  messages: z.array(LLMMessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().optional(),
  topP: z.number().min(0).max(1).optional(),
  stream: z.boolean().optional(),
  stop: z.array(z.string()).optional()
});

export type LLMRequest = z.infer<typeof LLMRequestSchema>;

// LLM Response Schema
export const LLMResponseSchema = z.object({
  content: z.string(),
  finishReason: z.enum(['stop', 'length', 'content_filter', 'error']).optional(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number()
  }).optional(),
  model: z.string().optional()
});

export type LLMResponse = z.infer<typeof LLMResponseSchema>;

// LLM Configuration Schema
export const LLMConfigSchema = z.object({
  provider: LLMProviderSchema,
  apiKey: z.string(),
  model: z.string(),
  baseUrl: z.string().optional(),
  defaultTemperature: z.number().optional(),
  defaultMaxTokens: z.number().optional()
});

export type LLMConfig = z.infer<typeof LLMConfigSchema>;

// Generation Task Schema
export const GenerationTaskSchema = z.object({
  id: z.string(),
  type: z.enum(['prototype', 'page', 'component', 'refinement']),
  specification: z.string(),
  context: z.record(z.any()).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  result: z.any().optional(),
  error: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type GenerationTask = z.infer<typeof GenerationTaskSchema>;

