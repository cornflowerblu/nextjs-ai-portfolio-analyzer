/**
 * Geographic Latency Testing Page
 * Demonstrates response times from multiple Vercel regions
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GeoMap } from '@/components/platform/geo-map';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GeoLatencyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link href="/platform">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Platform Features
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-2">Geographic Latency Testing</h1>
        <p className="text-lg text-muted-foreground">
          Response times from multiple Vercel regions worldwide
        </p>
      </div>

      {/* Geographic Latency Map */}
      <div className="mb-8">
        <GeoMap />
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vercel Global Network</CardTitle>
            <CardDescription>Edge locations around the world</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Vercel deploys your application to a global network of edge locations:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>North America:</strong> IAD (Washington DC), SFO (San Francisco), DFW (Dallas)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Europe:</strong> LHR (London), FRA (Frankfurt), AMS (Amsterdam)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Asia Pacific:</strong> SIN (Singapore), HND (Tokyo), SYD (Sydney)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>South America:</strong> GRU (São Paulo)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latency Factors</CardTitle>
            <CardDescription>What affects response times</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Geographic Distance</h3>
              <p className="text-muted-foreground">
                Physical distance between user and edge location (light travels ~300km/ms)
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Network Hops</h3>
              <p className="text-muted-foreground">
                Number of routers between client and server
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Cold Start Time</h3>
              <p className="text-muted-foreground">
                First request to a function may take longer
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Cache Status</h3>
              <p className="text-muted-foreground">
                Cached responses served faster than dynamic ones
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expected Latencies */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Expected Latency by Distance</CardTitle>
          <CardDescription>Approximate response times based on geography</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-3 font-semibold">Distance</th>
                  <th className="text-left p-3 font-semibold">Latency Range</th>
                  <th className="text-left p-3 font-semibold">Example</th>
                  <th className="text-left p-3 font-semibold">Quality</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">Same City</td>
                  <td className="p-3 font-medium text-green-600">5-20ms</td>
                  <td className="p-3 text-muted-foreground">SF → SFO edge</td>
                  <td className="p-3">
                    <span className="text-green-600 font-semibold">Excellent</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Same Continent</td>
                  <td className="p-3 font-medium text-blue-600">20-60ms</td>
                  <td className="p-3 text-muted-foreground">NYC → IAD edge</td>
                  <td className="p-3">
                    <span className="text-blue-600 font-semibold">Very Good</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Cross-Continental</td>
                  <td className="p-3 font-medium text-yellow-600">60-150ms</td>
                  <td className="p-3 text-muted-foreground">US → Europe</td>
                  <td className="p-3">
                    <span className="text-yellow-600 font-semibold">Good</span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Intercontinental</td>
                  <td className="p-3 font-medium text-orange-600">150-250ms</td>
                  <td className="p-3 text-muted-foreground">US → Asia</td>
                  <td className="p-3">
                    <span className="text-orange-600 font-semibold">Acceptable</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3">Antipodal</td>
                  <td className="p-3 font-medium text-red-600">250-400ms</td>
                  <td className="p-3 text-muted-foreground">US → Australia</td>
                  <td className="p-3">
                    <span className="text-red-600 font-semibold">Slow</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Tips */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle>Optimization Strategies</CardTitle>
          <CardDescription>How to minimize latency for global users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">1. Use Edge Functions</h3>
              <p className="text-muted-foreground">
                Deploy compute to the edge for low-latency dynamic content
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Leverage Edge Caching</h3>
              <p className="text-muted-foreground">
                Cache static and semi-static content at edge locations
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Use Edge Config</h3>
              <p className="text-muted-foreground">
                Store configuration at the edge for sub-ms read latency
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">4. Optimize Payloads</h3>
              <p className="text-muted-foreground">
                Reduce response sizes to minimize transfer time
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">5. Enable Compression</h3>
              <p className="text-muted-foreground">
                Use gzip/brotli to compress text-based responses
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">6. Implement CDN</h3>
              <p className="text-muted-foreground">
                Use Vercel&apos;s built-in CDN for static assets
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
