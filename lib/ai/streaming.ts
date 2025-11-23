/**
 * AI Streaming Handler
 * Utilities for processing streaming AI responses
 */

import { streamText } from 'ai';
import { getAIModel, getAIConfig } from './client';

/**
 * Stream AI response with retries on failure
 */
export async function streamAIResponse(
  systemPrompt: string,
  userPrompt: string,
  onChunk?: (text: string) => void
) {
  const model = getAIModel();
  const config = getAIConfig();

  const result = await streamText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: config.temperature,
  });

  // If callback provided, process chunks
  if (onChunk) {
    for await (const chunk of result.textStream) {
      onChunk(chunk);
    }
  }

  return result;
}

/**
 * Create a text stream for Server-Sent Events
 */
export async function createTextStream(
  systemPrompt: string,
  userPrompt: string
) {
  const config = getAIConfig();
  const model = getAIModel();

  return streamText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: config.temperature,
  });
}

/**
 * Retry streaming with exponential backoff
 */
export async function streamWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries reached');
}

/**
 * Format streaming error messages
 */
export function formatStreamError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return 'AI service is not properly configured. Please check API credentials.';
    }
    if (error.message.includes('rate limit')) {
      return 'AI service rate limit reached. Please try again in a moment.';
    }
    if (error.message.includes('timeout')) {
      return 'AI service request timed out. Please try again.';
    }
    return `AI service error: ${error.message}`;
  }
  return 'An unexpected error occurred while generating insights.';
}
