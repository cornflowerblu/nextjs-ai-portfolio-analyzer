# Historical Performance Trends

## Overview

The Trends page provides comprehensive historical performance tracking and visualization for all rendering strategies. It shows how Core Web Vitals metrics evolve over time, enabling teams to identify performance regressions and improvements.

## Features

### 1. Time-Series Charts
- **Interactive Line Charts**: Visualize performance trends for all Core Web Vitals (FCP, LCP, CLS, INP, TTFB)
- **Multi-Strategy Comparison**: Compare all four rendering strategies (SSR, SSG, ISR, Cache Components) on the same chart
- **Responsive Design**: Charts adapt to different screen sizes
- **Hover Tooltips**: Display exact metric values and timestamps on hover

### 2. Date Range Selection
- **7 Days**: Hourly granularity for recent trends
- **30 Days**: Daily granularity for monthly patterns
- **90 Days**: Weekly granularity for long-term trends

### 3. Performance Regression Detection
- **Automatic Detection**: Compares recent performance against historical baseline
- **Threshold-Based Alerts**: Flags regressions above 20% degradation
- **Severity Indicators**: Visual severity levels (20-30%, 30-50%, 50%+)
- **Detailed Insights**: Shows baseline vs. current values with percentage changes

### 4. Multi-Project Support
- **Project Selector**: Switch between different tracked projects
- **Project Metadata**: View creation date, last update, and metrics count
- **Isolated Data**: Each project maintains its own historical data

### 5. Chart Annotations
- **Significant Changes**: Automatically marks major performance shifts
- **Regression Highlights**: Red markers for performance degradations
- **Improvement Highlights**: Green markers for performance gains
- **Custom Labels**: Descriptive labels for each annotation

### 6. Data Export
- **CSV Export**: Download trend data for external analysis
- **Filtered Export**: Only exports data for selected date range and project
- **Timestamped Files**: File names include project ID and date range

## Components

### TrendChart
**Location**: `components/trends/trend-chart.tsx`

Interactive line chart component using Recharts.

**Props**:
- `data`: Array of data points with timestamp, value, and strategy
- `metric`: Which Core Web Vital to display ('fcp', 'lcp', 'cls', 'inp', 'ttfb')
- `metricLabel`: Human-readable label for the metric
- `strategies`: Array of strategy types to display
- `height`: Chart height in pixels (default: 400)
- `showAnnotations`: Whether to show performance change markers
- `annotations`: Array of annotation objects with timestamp, label, and type

### RegressionIndicator
**Location**: `components/trends/regression-indicator.tsx`

Alert component that highlights performance regressions.

**Props**:
- `regressions`: Array of regression objects with metric, current, baseline, change, and strategy
- `threshold`: Minimum percentage change to consider a regression (default: 0.2 = 20%)
- `className`: Additional CSS classes

**Features**:
- Groups regressions by strategy
- Color-coded severity levels
- Displays baseline vs. current values
- Provides actionable recommendations

### ProjectSelector
**Location**: `components/trends/project-selector.tsx`

Dropdown selector for switching between tracked projects.

**Props**:
- `projects`: Array of project objects
- `selectedProjectId`: Currently selected project ID
- `onProjectSelect`: Callback when project is changed
- `onCreateProject`: Optional callback for creating new projects
- `className`: Additional CSS classes

## API Endpoints

### GET /api/historical
Query historical performance data.

**Query Parameters**:
- `startDate` (required): ISO 8601 date string
- `endDate` (required): ISO 8601 date string
- `strategy` (optional): 'SSR' | 'SSG' | 'ISR' | 'CACHE'
- `projectId` (optional): Project identifier (default: 'default')
- `granularity` (optional): 'hour' | 'day' | 'week' | 'month'
- `detectRegressions` (optional): 'true' | 'false'

**Response**:
```json
{
  "success": true,
  "data": [...],
  "regressions": [...],
  "query": {...},
  "metadata": {
    "count": 100,
    "timeRange": {...}
  }
}
```

### POST /api/historical
Save a new historical data point.

**Request Body**:
```json
{
  "strategy": "SSR",
  "projectId": "default",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "metrics": {
    "fcp": { "value": 1200, "rating": "good", "delta": 0 },
    "lcp": { "value": 2000, "rating": "good", "delta": 0 },
    "cls": { "value": 0.05, "rating": "good", "delta": 0 },
    "inp": { "value": 150, "rating": "good", "delta": 0 },
    "ttfb": { "value": 500, "rating": "good", "delta": 0 }
  },
  "metadata": {
    "url": "https://example.com",
    "userAgent": "Mozilla/5.0...",
    "environment": "production"
  }
}
```

## Data Storage

### Historical Data Manager
**Location**: `lib/storage/historical.ts`

Handles all historical data operations:
- **Save**: Stores performance snapshots with 90-day TTL
- **Query**: Retrieves data for specific date ranges
- **Aggregate**: Groups data by hour/day/week/month
- **Detect Regressions**: Compares recent vs. baseline performance
- **Multi-Project**: Supports project-specific data isolation

### Automatic Storage
The metrics API (`/api/metrics`) automatically saves performance snapshots to historical storage on every request. This ensures continuous trend data without manual intervention.

**Configuration**:
- To disable automatic saving, add `?saveHistory=false` query parameter
- Data is stored with a 90-day TTL (configurable in `historical.ts`)

## Usage

### Viewing Trends
1. Navigate to `/trends`
2. Select a date range (7d, 30d, or 90d)
3. Choose a project (if multiple projects exist)
4. View charts for all Core Web Vitals
5. Check for regression alerts

### Analyzing Performance
1. **Identify Patterns**: Look for cyclical patterns or gradual trends
2. **Compare Strategies**: See which strategy performs best for each metric
3. **Investigate Regressions**: Review regression indicators for degradation causes
4. **Export Data**: Download CSV for detailed external analysis

### Best Practices
- **Regular Monitoring**: Check trends weekly to catch regressions early
- **Baseline Comparison**: Compare against your own historical data, not just standards
- **Multi-Metric Analysis**: Don't optimize one metric at the expense of others
- **Long-Term Tracking**: Use 90-day view to identify seasonal patterns

## Technical Details

### Chart Implementation
- **Library**: Recharts (built on D3.js)
- **Responsiveness**: Uses `ResponsiveContainer` for flexible sizing
- **Performance**: Memoized data transformations to prevent unnecessary re-renders
- **Accessibility**: Includes ARIA labels and keyboard navigation support

### Data Aggregation
Granularity is automatically selected based on date range:
- **7 days**: Hourly buckets (168 data points max)
- **30 days**: Daily buckets (30 data points max)
- **90 days**: Weekly buckets (13 data points max)

This prevents overwhelming the charts with too many data points while maintaining visibility.

### Regression Detection Algorithm
1. Split data into two halves (baseline vs. current)
2. Calculate average for each metric in both periods
3. Compare percentage change: `(current - baseline) / baseline`
4. Flag changes above threshold (default: 20%)

## Future Enhancements

Potential improvements for the trends feature:

1. **Custom Date Ranges**: Allow users to select arbitrary start/end dates
2. **Metric Comparison**: Side-by-side comparison of two different metrics
3. **Alert Configuration**: User-defined regression thresholds and notifications
4. **Export Formats**: Additional export formats (JSON, Excel, PNG charts)
5. **Advanced Filtering**: Filter by environment, user agent, or custom metadata
6. **Forecasting**: Predict future trends using machine learning
7. **Team Sharing**: Share trend views with team members via URLs
8. **CI/CD Integration**: Webhook notifications for regressions during deployment
