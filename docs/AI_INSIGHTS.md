# AI-Powered Optimization Insights

This document explains the AI-powered insights feature that analyzes performance metrics and provides actionable optimization recommendations.

## Overview

The AI insights feature leverages large language models to analyze Core Web Vitals data across different rendering strategies (SSR, SSG, ISR, Cache Components) and provide:

- Real-time streaming analysis
- Specific optimization recommendations with impact levels
- Interactive follow-up questions
- Context-aware suggestions based on actual metrics

## Architecture

### Components

1. **InsightsPanel** (`components/ai/insights-panel.tsx`)
   - Main container for AI insights
   - Auto-analyzes performance data on load
   - Displays streaming response and chat interface

2. **StreamingResponse** (`components/ai/streaming-response.tsx`)
   - Handles real-time streaming of AI analysis
   - Shows loading states and retry functionality
   - Displays optimization suggestions as cards

3. **OptimizationCard** (`components/ai/optimization-card.tsx`)
   - Individual suggestion display
   - Shows impact level (high/medium/low)
   - Displays metric improvements and action items

4. **ChatInterface** (`components/ai/chat-interface.tsx`)
   - Interactive Q&A for follow-up questions
   - Maintains conversation history
   - Preserves performance context

### API Routes

1. **`/api/insights` (POST)**
   - Streaming endpoint for performance analysis
   - Uses Edge Runtime for low latency
   - Returns Server-Sent Events (SSE)
   - Input: `{ performanceContext: PerformanceContext }`

2. **`/api/insights/chat` (POST)**
   - Non-streaming endpoint for follow-up questions
   - Edge Runtime for fast response
   - Input: `{ message: string, performanceContext: PerformanceContext, conversationHistory: ChatMessage[] }`

### AI Infrastructure

1. **AI Client** (`lib/ai/client.ts`)
   - Configures OpenAI or Anthropic provider
   - Validates API credentials
   - Returns configured model instance

2. **Prompt Templates** (`lib/ai/prompts.ts`)
   - System prompt with expert role
   - Analysis prompt with metric formatting
   - Follow-up prompt with conversation context
   - Suggestion parsing utilities

3. **Streaming Handler** (`lib/ai/streaming.ts`)
   - Streaming utilities using Vercel AI SDK
   - Retry logic with exponential backoff
   - Error formatting for user-friendly messages

## Configuration

### Environment Variables

Set up one of the following AI providers:

#### OpenAI (Default)
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # Optional, default: gpt-4o-mini
AI_PROVIDER=openai        # Optional, default: openai
```

#### Anthropic
```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Optional
AI_PROVIDER=anthropic
```

#### Optional Settings
```bash
AI_TEMPERATURE=0.7  # Optional, default: 0.7
AI_MAX_TOKENS=2000  # Optional, default: 2000
```

### Cost Considerations

- **OpenAI gpt-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Anthropic Claude 3.5 Sonnet**: ~$3 per 1M input tokens, ~$15 per 1M output tokens

Each analysis typically uses 500-1000 tokens, making gpt-4o-mini cost-effective for frequent analyses.

## Usage

### Automatic Analysis

The insights panel automatically analyzes performance metrics when loaded on the dashboard:

```tsx
import { InsightsPanel } from '@/components/ai/insights-panel';

<InsightsPanel 
  performanceContext={context} 
  autoAnalyze={true} 
/>
```

### Manual Trigger

Disable auto-analysis and provide a manual trigger:

```tsx
<InsightsPanel 
  performanceContext={context} 
  autoAnalyze={false} 
/>
```

### Follow-up Questions

Users can ask follow-up questions through the chat interface:
- "Why is SSG faster than SSR?"
- "How can I improve my LCP score?"
- "What's the best strategy for my use case?"

## Features

### 1. Streaming Analysis

- Real-time token-by-token streaming
- Progressive display as AI generates response
- Immediate feedback without waiting for full response

### 2. Optimization Suggestions

Each suggestion includes:
- **Title**: Brief description of the optimization
- **Impact Level**: High, Medium, or Low
- **Metric References**: Specific metrics affected (e.g., "LCP: 2100ms → 1500ms")
- **Action Items**: Concrete steps to implement
- **Recommended Strategy**: Best rendering approach

### 3. Context-Aware Analysis

AI considers:
- Current Core Web Vitals values
- Performance ratings (good/needs-improvement/poor)
- Comparisons between rendering strategies
- Specific bottlenecks and opportunities

### 4. Error Handling

- Graceful fallback if AI service unavailable
- Retry mechanism with exponential backoff
- User-friendly error messages
- Cancel functionality for long-running requests

## Development

### Adding New Prompt Templates

Edit `lib/ai/prompts.ts`:

```typescript
export function createCustomPrompt(context: PerformanceContext): string {
  return `Analyze these metrics: ${JSON.stringify(context.strategies)}`;
}
```

### Customizing AI Behavior

Modify system prompt in `lib/ai/prompts.ts`:

```typescript
export const SYSTEM_PROMPT = `
You are an expert...
[Add custom instructions]
`;
```

### Testing Without API Keys

The system gracefully handles missing credentials:
- Shows configuration error message
- Provides clear setup instructions
- Doesn't crash or block other features

## Testing

Run AI prompt tests:

```bash
npm test -- __tests__/lib/ai/prompts.test.ts
```

Tests cover:
- System prompt content
- Analysis prompt generation
- Follow-up prompt formatting
- Suggestion parsing
- Impact level determination

## Troubleshooting

### "AI service is not configured"

**Solution**: Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` environment variable.

### "Failed to fetch insights"

**Possible causes**:
- Invalid API key
- Network connectivity issues
- Rate limiting

**Solution**: Check API key validity and account status.

### Streaming Stops Prematurely

**Possible causes**:
- Token limit reached
- Network interruption
- API timeout

**Solution**: Use retry button to restart analysis.

## Best Practices

1. **Use gpt-4o-mini for Production**: More cost-effective, sufficient quality
2. **Cache Analysis Results**: Store insights in KV for repeated views
3. **Monitor API Usage**: Track costs and implement rate limiting if needed
4. **Handle Errors Gracefully**: Always show fallback UI if AI unavailable
5. **Test Without Streaming**: Use chat endpoint for simpler interactions

## Future Enhancements

- [ ] Store and retrieve historical insights
- [ ] Compare insights over time
- [ ] Export insights to reports
- [ ] Fine-tuned models for performance analysis
- [ ] Multi-language support
- [ ] Custom prompt templates per user
- [ ] Integration with Lighthouse analysis (User Story 3)

## References

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude Documentation](https://docs.anthropic.com)
- [Core Web Vitals Guide](https://web.dev/vitals/)
