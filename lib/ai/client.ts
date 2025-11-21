/**
 * AI Provider Client
 * Setup and configuration for AI SDK with OpenAI/Anthropic
 */

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import type { AIConfig } from '@/types/ai';

/**
 * Get AI provider configuration from environment variables
 */
export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER?.trim() || 'openai') as 'openai' | 'anthropic';

  const config: AIConfig = {
    provider,
    model: provider === 'openai'
      ? (process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini')
      : (process.env.ANTHROPIC_MODEL?.trim() || 'claude-3-5-sonnet-20241022'),
    temperature: parseFloat(process.env.AI_TEMPERATURE?.trim() || '0.7'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS?.trim() || '2000', 10),
  };

  return config;
}

/**
 * Get the configured AI model instance
 */
export function getAIModel() {
  const config = getAIConfig();

  if (config.provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }
    return anthropic(config.model, { apiKey });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return openai(config.model, { apiKey });
}

/**
 * Validate that AI credentials are configured
 */
export function validateAICredentials(): boolean {
  const config = getAIConfig();
  
  if (config.provider === 'anthropic') {
    return !!process.env.ANTHROPIC_API_KEY;
  }
  
  return !!process.env.OPENAI_API_KEY;
}
