/**
 * Chat API Route
 * Handle follow-up questions with conversation context
 */

import { streamText } from 'ai';
import { getAIModel, getAIConfig } from '@/lib/ai/client';
import { SYSTEM_PROMPT, createFollowUpPrompt } from '@/lib/ai/prompts';
import { validateAICredentials } from '@/lib/ai/client';
import type { PerformanceContext, ChatMessage } from '@/types/ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Validate AI credentials
    if (!validateAICredentials()) {
      return NextResponse.json(
        {
          error:
            'AI service is not configured. Please set API key in environment variables.',
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const message = body.message as string;
    const performanceContext = body.performanceContext as PerformanceContext;
    const conversationHistory = (body.conversationHistory ||
      []) as ChatMessage[];

    if (!message || !performanceContext) {
      return NextResponse.json(
        { error: 'Message and performance context are required' },
        { status: 400 }
      );
    }

    // Create conversation history strings
    const historyStrings = conversationHistory.map(
      (msg) => `${msg.role}: ${msg.content}`
    );

    // Create follow-up prompt
    const userPrompt = createFollowUpPrompt(
      message,
      performanceContext,
      historyStrings
    );

    // Get AI response (non-streaming for chat)
    const model = getAIModel();
    const config = getAIConfig();

    const result = await streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: config.temperature,
    });

    // Collect full response
    let fullResponse = '';
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }

    return NextResponse.json({
      content: fullResponse,
      suggestions: [], // Could parse suggestions from response
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An error occurred while processing your question',
      },
      { status: 500 }
    );
  }
}
