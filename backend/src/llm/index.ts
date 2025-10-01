export * from './base';
export * from './factory';

import { LLMProviderFactory } from './factory';
import { config } from '../config';

/**
 * Convenience export for creating LLM instances
 */
export const LLMFactory = {
  createLLM: () => LLMProviderFactory.getProvider(config.llm)
};

