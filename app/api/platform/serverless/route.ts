/**
 * Serverless Function for comparison with Edge Functions
 * Runs in Node.js runtime with longer cold start times
 */

import { NextRequest, NextResponse } from 'next/server';

// Track cold starts (resets on each deployment)
let isWarm = false;

export async function GET(request: NextRequest) {
  const coldStart = !isWarm;
  isWarm = true;
  
  const startTime = performance.now();
  
  // Simulate some work
  const iterations = parseInt(request.nextUrl.searchParams.get('iterations') || '100');
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    sum += Math.sqrt(i);
  }
  
  const executionTime = performance.now() - startTime;
  
  return NextResponse.json({
    type: 'serverless',
    executionTime,
    coldStart,
    timestamp: new Date().toISOString(),
    result: sum,
    region: process.env.VERCEL_REGION || 'unknown',
  });
}

export async function POST(request: NextRequest) {
  const coldStart = !isWarm;
  isWarm = true;
  
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const { operation = 'compute', data } = body;
    
    let result;
    
    switch (operation) {
      case 'compute':
        // CPU-bound operation
        result = Array.from({ length: 1000 }, (_, i) => Math.sqrt(i)).reduce((a, b) => a + b, 0);
        break;
        
      case 'transform':
        // Data transformation
        result = JSON.stringify(data || {});
        break;
        
      case 'validate':
        // Data validation
        result = typeof data === 'object' && data !== null;
        break;
        
      case 'database':
        // Simulate database query (would fail on edge)
        await new Promise((resolve) => setTimeout(resolve, 10));
        result = 'Database query completed';
        break;
        
      default:
        result = 'Unknown operation';
    }
    
    const executionTime = performance.now() - startTime;
    
    return NextResponse.json({
      type: 'serverless',
      operation,
      executionTime,
      coldStart,
      timestamp: new Date().toISOString(),
      result,
      region: process.env.VERCEL_REGION || 'unknown',
    });
  } catch (error) {
    const executionTime = performance.now() - startTime;
    
    return NextResponse.json(
      {
        type: 'serverless',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        coldStart,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
