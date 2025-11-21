/**
 * Insights API Route
 * Streaming AI-powered performance analysis endpoint
 */

import { createTextStream, formatStreamError } from '@/lib/ai/streaming';
import { SYSTEM_PROMPT, createAnalysisPrompt } from '@/lib/ai/prompts';
import { validateAICredentials } from '@/lib/ai/client';
import type { PerformanceContext } from '@/types/ai';
import { NextRequest } from 'next/server';

export const runtime = 'edge'; // Use edge runtime for streaming

export async function POST(request: NextRequest) {
  try {
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
    const result = await createTextStream(SYSTEM_PROMPT, userPrompt);

    // Create a readable stream that formats the AI response as Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of result.textStream) {
            // Send each chunk as SSE
            const data = JSON.stringify({
              type: 'text',
              content: chunk,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
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
    console.error('Insights API error:', error);
    const errorMessage = formatStreamError(error);

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
