/**
 * Geographic latency tester - pings multiple Vercel regions
 * Measures response time from different geographic locations
 */

export interface RegionInfo {
  code: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
}

export interface RegionLatency {
  region: RegionInfo;
  latency: number; // milliseconds
  status: 'success' | 'error' | 'timeout';
  timestamp: string;
}

/**
 * Vercel regions with geographic coordinates
 */
export const VERCEL_REGIONS: Record<string, RegionInfo> = {
  'iad1': {
    code: 'iad1',
    name: 'Washington, D.C., USA',
    location: 'US East',
    latitude: 38.9072,
    longitude: -77.0369,
  },
  'sfo1': {
    code: 'sfo1',
    name: 'San Francisco, USA',
    location: 'US West',
    latitude: 37.7749,
    longitude: -122.4194,
  },
  'lhr1': {
    code: 'lhr1',
    name: 'London, UK',
    location: 'Europe',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  'fra1': {
    code: 'fra1',
    name: 'Frankfurt, Germany',
    location: 'Europe',
    latitude: 50.1109,
    longitude: 8.6821,
  },
  'sin1': {
    code: 'sin1',
    name: 'Singapore',
    location: 'Asia Pacific',
    latitude: 1.3521,
    longitude: 103.8198,
  },
  'syd1': {
    code: 'syd1',
    name: 'Sydney, Australia',
    location: 'Asia Pacific',
    latitude: -33.8688,
    longitude: 151.2093,
  },
  'hnd1': {
    code: 'hnd1',
    name: 'Tokyo, Japan',
    location: 'Asia Pacific',
    latitude: 35.6762,
    longitude: 139.6503,
  },
  'gru1': {
    code: 'gru1',
    name: 'São Paulo, Brazil',
    location: 'South America',
    latitude: -23.5505,
    longitude: -46.6333,
  },
};

/**
 * Test latency to a specific endpoint from the current location
 */
export async function testEndpointLatency(
  url: string,
  timeout: number = 5000
): Promise<number> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const start = performance.now();
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return performance.now() - start;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Test latency to multiple regions
 * In a real implementation, you would ping region-specific endpoints
 */
export async function testMultiRegionLatency(
  baseUrl: string,
  regions: string[] = Object.keys(VERCEL_REGIONS)
): Promise<RegionLatency[]> {
  const results = await Promise.all(
    regions.map(async (regionCode) => {
      const region = VERCEL_REGIONS[regionCode];
      if (!region) {
        return null;
      }

      try {
        // In production, this would use region-specific endpoints
        // For now, we'll test the base URL with a region query param
        const url = `${baseUrl}?region=${regionCode}`;
        const latency = await testEndpointLatency(url);

        return {
          region,
          latency,
          status: 'success' as const,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          region,
          latency: -1,
          status: error instanceof Error && error.name === 'AbortError'
            ? ('timeout' as const)
            : ('error' as const),
          timestamp: new Date().toISOString(),
        };
      }
    })
  );

  return results.filter((r): r is RegionLatency => r !== null);
}

/**
 * Get mock latency data for demo purposes
 * Simulates realistic latency based on geographic distance
 */
export function getMockRegionLatencies(): RegionLatency[] {
  const now = new Date().toISOString();

  return [
    {
      region: VERCEL_REGIONS['iad1'],
      latency: 15 + Math.random() * 10,
      status: 'success',
      timestamp: now,
    },
    {
      region: VERCEL_REGIONS['sfo1'],
      latency: 45 + Math.random() * 15,
      status: 'success',
      timestamp: now,
    },
    {
      region: VERCEL_REGIONS['lhr1'],
      latency: 85 + Math.random() * 20,
      status: 'success',
      timestamp: now,
    },
    {
      region: VERCEL_REGIONS['fra1'],
      latency: 95 + Math.random() * 20,
      status: 'success',
      timestamp: now,
    },
    {
      region: VERCEL_REGIONS['sin1'],
      latency: 180 + Math.random() * 30,
      status: 'success',
      timestamp: now,
    },
    {
      region: VERCEL_REGIONS['syd1'],
      latency: 210 + Math.random() * 40,
      status: 'success',
      timestamp: now,
    },
    {
      region: VERCEL_REGIONS['hnd1'],
      latency: 165 + Math.random() * 25,
      status: 'success',
      timestamp: now,
    },
    {
      region: VERCEL_REGIONS['gru1'],
      latency: 125 + Math.random() * 30,
      status: 'success',
      timestamp: now,
    },
  ];
}

/**
 * Calculate geographic distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
