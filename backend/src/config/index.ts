import dotenv from 'dotenv';
import { LLMProvider } from '@jp/shared';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  llm: {
    provider: (process.env.LLM_PROVIDER || 'deepseek') as LLMProvider,
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'deepseek-chat',
    baseUrl: process.env.LLM_BASE_URL,
    defaultTemperature: parseFloat(process.env.LLM_DEFAULT_TEMPERATURE || '0.7'),
    defaultMaxTokens: parseInt(process.env.LLM_DEFAULT_MAX_TOKENS || '4000', 10)
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// Validate required configuration
if (!config.llm.apiKey && config.llm.provider !== 'ollama') {
  console.warn('Warning: LLM_API_KEY is not set. LLM features will not work.');
}

