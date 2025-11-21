# URL Analyzer - User Story 3

## Overview

The URL Analyzer is a powerful feature that allows developers to analyze any website's performance using Lighthouse and receive personalized rendering strategy recommendations.

## Features

### 1. Lighthouse Integration

- **Full Lighthouse Testing**: Runs comprehensive Lighthouse audits on any URL
- **Core Web Vitals**: Measures FCP, LCP, CLS, INP, TTFB, Speed Index, and Total Blocking Time
- **Four Categories**: Performance, Accessibility, Best Practices, and SEO scores
- **Mobile Simulation**: Tests with mobile viewport and throttling by default

### 2. Rendering Strategy Recommendations

The analyzer simulates how your site would perform with different Next.js rendering strategies:

- **SSR (Server-Side Rendering)**: Best for dynamic, personalized content
- **SSG (Static Site Generation)**: Best for static content that rarely changes
- **ISR (Incremental Static Regeneration)**: Best balance for semi-dynamic content
- **Cache Components**: Next.js 16 feature for granular component caching

Each recommendation includes:
- Estimated performance improvements
- Pros and cons
- Implementation complexity (low/medium/high)
- Expected metric gains
- Reasoning based on current bottlenecks

### 3. Performance Comparison

Visual before/after comparison showing:
- Current metrics vs. projected metrics with recommended strategy
- Percentage improvements for each Core Web Vital
- Color-coded indicators (red for current, green for projected)

### 4. Intelligent Caching

- Results cached for 1 hour to avoid redundant tests
- Redis/KV integration for distributed caching
- Cache status indicator on results

### 5. Error Handling

Comprehensive error handling for:
- **Invalid URLs**: Validation for HTTP/HTTPS only
- **Timeouts**: 60-second limit with clear messaging
- **Unreachable Sites**: Network error detection
- **Lighthouse Errors**: Graceful failure with details

## How to Use

### Via Web Interface

1. Navigate to `/analyze` in your browser
2. Enter any website URL (must be HTTP or HTTPS)
3. Click "Analyze"
4. Wait 30-60 seconds for results
5. Review Lighthouse scores, recommendations, and comparisons

### Via API

#### Analyze a URL

```bash
POST /api/analyze
Content-Type: application/json

{
  "url": "https://example.com"
}
```

**Response (Success):**

```json
{
  "success": true,
  "cached": false,
  "data": {
    "url": "https://example.com",
    "timestamp": 1700000000000,
    "currentScores": {
      "performance": 85,
      "accessibility": 92,
      "bestPractices": 87,
      "seo": 90
    },
    "currentMetrics": {
      "FCP": 1500,
      "LCP": 2200,
      "CLS": 0.08,
      "INP": 180,
      "TTFB": 650,
      "SI": 1800,
      "TBT": 150,
      "speedIndex": 1800,
      "totalBlockingTime": 150,
      "interactive": 2500
    },
    "recommendations": [...],
    "bestStrategy": {...},
    "analysisTime": 35000
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": {
    "message": "Analysis timeout",
    "code": "TIMEOUT",
    "details": "The analysis took too long to complete..."
  }
}
```

#### Get API Documentation

```bash
GET /api/analyze
```

## Technical Architecture

### Components

#### Frontend (`/components/analyze/`)

- **url-input-form.tsx**: Form with Zod validation
- **lighthouse-scores.tsx**: Displays 4 Lighthouse category scores
- **strategy-recommendations.tsx**: Shows all 4 strategy recommendations
- **performance-comparison.tsx**: Before/after metrics visualization

#### Backend (`/lib/lighthouse/`)

- **runner.ts**: Lighthouse execution with Chrome automation
- **parser.ts**: Extracts and formats Lighthouse results
- **simulator.ts**: Simulates strategy performance improvements

#### API Route (`/app/api/analyze/`)

- **route.ts**: Main API endpoint with caching and error handling

### Data Flow

```
User Input → Validation → Cache Check → 
Lighthouse Test → Parse Results → Simulate Strategies → 
Generate Recommendations → Cache Results → Return Response
```

## Configuration

### Environment Variables

```bash
# Optional: Redis for caching
REDIS_URL=redis://localhost:6379

# Required for build
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1
```

### Next.js Configuration

The analyzer requires Lighthouse to be externalized from the Next.js bundle:

```typescript
// next.config.ts
export default {
  serverExternalPackages: ['lighthouse', 'chrome-launcher'],
};
```

## Requirements

### System Requirements

- **Chrome/Chromium**: Required for Lighthouse to run
- **Node.js 18+**: For async/await and modern features
- **Memory**: At least 2GB RAM for Chrome processes
- **Network**: Internet access to test external URLs

### Package Dependencies

- `lighthouse`: Automated website auditing
- `chrome-launcher`: Chrome process management
- `zod`: Schema validation

## Performance Considerations

### Lighthouse Execution

- Each analysis takes 30-60 seconds
- Chrome process is automatically launched and cleaned up
- Timeout set to 60 seconds to prevent hanging
- Uses mobile emulation and throttling by default

### Caching Strategy

- Results cached for 1 hour (3600 seconds)
- Cache key: `lighthouse:{url}`
- Helps avoid hitting rate limits
- Reduces load on analyzed websites

### Optimization Tips

1. **Use caching**: Don't re-analyze the same URL repeatedly
2. **Queue requests**: If analyzing multiple URLs, queue them
3. **Monitor Chrome processes**: Ensure they're cleaned up properly
4. **Set appropriate timeouts**: Balance thoroughness vs. responsiveness

## Testing

### Unit Tests

```bash
npm test -- lib/lighthouse
```

Tests cover:
- URL validation (various protocols and formats)
- Metrics parsing and extraction
- Bottleneck identification
- Strategy simulation
- Recommendation generation

### Manual Testing

1. **Valid URL**: `https://example.com`
   - Should complete successfully
   - Should show all 4 scores
   - Should provide recommendations

2. **Invalid URL**: `ftp://example.com`
   - Should show validation error
   - Should not attempt analysis

3. **Unreachable URL**: `https://notarealwebsite12345.com`
   - Should show unreachable error
   - Should handle gracefully

4. **Timeout**: Very slow websites
   - Should timeout after 60s
   - Should show clear error message

## Troubleshooting

### Common Issues

#### "Chrome not found"

**Solution**: Install Chrome or Chromium

```bash
# Ubuntu/Debian
sudo apt-get install chromium-browser

# macOS
brew install chromium
```

#### "Analysis timeout"

**Causes**:
- Website is very slow
- Network issues
- Chrome process hanging

**Solutions**:
- Check internet connection
- Try a different URL
- Restart the server

#### "Module not found: lighthouse"

**Solution**: Ensure `serverExternalPackages` is configured in `next.config.ts`

#### "Build fails with dynamic import errors"

**Solution**: Check that Lighthouse imports are dynamic and only in API routes

## Future Enhancements

Potential improvements for future iterations:

1. **Desktop Analysis**: Option to test with desktop viewport
2. **Historical Comparison**: Track changes over time
3. **Batch Analysis**: Analyze multiple URLs at once
4. **Custom Audits**: Add custom Lighthouse audit definitions
5. **PDF Reports**: Export detailed analysis as PDF
6. **GitHub Integration**: Auto-analyze on PR creation
7. **Slack Notifications**: Alert on performance regressions

## Resources

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Core Web Vitals](https://web.dev/vitals/)
- [Next.js Rendering Strategies](https://nextjs.org/docs/app/building-your-application/rendering)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
