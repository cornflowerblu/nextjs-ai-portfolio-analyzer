/**
 * Insights API Route
 * Streaming AI-powered performance analysis endpoint
 */

import { createTextStream, formatStreamError } from '@/lib/ai/streaming';
import { SYSTEM_PROMPT, createAnalysisPrompt } from '@/lib/ai/prompts';
import { validateAICredentials, getAIConfig } from '@/lib/ai/client';
import type { PerformanceContext } from '@/types/ai';
import { NextRequest } from 'next/server';

export const runtime = 'edge'; // Use edge runtime for streaming
export const maxDuration = 60; // Allow up to 60 seconds for AI streaming

export async function POST(request: NextRequest) {
  try {
    // Log environment info (without exposing keys)
    const config = getAIConfig();
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    console.log('AI Provider:', config.provider);
    console.log('AI Model:', config.model);
    console.log('Has OpenAI key:', hasOpenAIKey);
    console.log('Has Anthropic key:', hasAnthropicKey);

    // Validate AI credentials
    if (!validateAICredentials()) {
      return new Response(
        JSON.stringify({
          error:
            'AI service is not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const performanceContext = body.performanceContext as PerformanceContext;

    if (!performanceContext || !performanceContext.strategies) {
      return new Response(
        JSON.stringify({ error: 'Invalid performance context provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create analysis prompt
    const userPrompt = createAnalysisPrompt(performanceContext);

    // Stream AI response
    let result;
    try {
      console.log('Creating AI text stream...');
      result = await createTextStream(SYSTEM_PROMPT, userPrompt);
      console.log('AI stream created successfully');
    } catch (error) {
      console.error('Failed to create AI stream:', error);
      const errorMessage = formatStreamError(error);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create a readable stream that formats the AI response as Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Send initial connection confirmation
          controller.enqueue(encoder.encode(': connected\n\n'));
          console.log('Stream connection established');

          let chunkCount = 0;
          console.log('Starting stream iteration...');

          for await (const chunk of result.textStream) {
            chunkCount++;
            if (chunkCount === 1) {
              console.log('Received first chunk');
            }
            // Send each chunk as SSE
            const data = JSON.stringify({
              type: 'text',
              content: chunk,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          console.log(`Stream completed. Total chunks: ${chunkCount}`);

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          const errorMessage = formatStreamError(error);
          const errorData = JSON.stringify({
            type: 'error',
            content: errorMessage,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = formatStreamError(error);
    console.error('Insights API error:', errorMessage);

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
