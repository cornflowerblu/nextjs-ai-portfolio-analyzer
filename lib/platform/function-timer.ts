/**
 * Function timer utility for accurate execution measurement
 * Provides high-precision timing for Edge and Serverless functions
 */

export interface TimingResult<T> {
  result: T;
  executionTime: number; // milliseconds
  coldStart: boolean;
  timestamp: string;
}

export interface TimingStats {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Time a synchronous or asynchronous function execution
 */
export async function timeFunction<T>(
  fn: () => T | Promise<T>,
  options: { coldStart?: boolean } = {}
): Promise<TimingResult<T>> {
  const start = performance.now();
  const result = await fn();
  const executionTime = performance.now() - start;

  return {
    result,
    executionTime,
    coldStart: options.coldStart ?? false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run a function multiple times and collect timing statistics
 */
export async function benchmarkFunction<T>(
  fn: () => T | Promise<T>,
  iterations: number = 10
): Promise<{
  results: TimingResult<T>[];
  stats: TimingStats;
}> {
  const results: TimingResult<T>[] = [];

  for (let i = 0; i < iterations; i++) {
    const result = await timeFunction(fn, { coldStart: i === 0 });
    results.push(result);
  }

  const times = results.map((r) => r.executionTime).sort((a, b) => a - b);
  const sum = times.reduce((acc, t) => acc + t, 0);

  const stats: TimingStats = {
    min: times[0],
    max: times[times.length - 1],
    avg: sum / times.length,
    p50: percentile(times, 50),
    p95: percentile(times, 95),
    p99: percentile(times, 99),
  };

  return { results, stats };
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray: number[], p: number): number {
  const index = (p / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sortedArray[lower];
  }

  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Compare execution times between two functions
 */
export async function compareFunctions<T1, T2>(
  fn1: () => T1 | Promise<T1>,
  fn2: () => T2 | Promise<T2>,
  iterations: number = 10
): Promise<{
  function1: { results: TimingResult<T1>[]; stats: TimingStats };
  function2: { results: TimingResult<T2>[]; stats: TimingStats };
  speedup: number; // How many times faster fn1 is compared to fn2
}> {
  const [benchmark1, benchmark2] = await Promise.all([
    benchmarkFunction(fn1, iterations),
    benchmarkFunction(fn2, iterations),
  ]);

  const speedup = benchmark2.stats.avg / benchmark1.stats.avg;

  return {
    function1: benchmark1,
    function2: benchmark2,
    speedup,
  };
}
