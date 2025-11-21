/**
 * KV Caching Demo Page
 * Demonstrates Vercel KV (Redis) with real latency measurements
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { KvLatencyDisplay } from '@/components/platform/kv-latency-display';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function KvCachePage() {
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
        <h1 className="text-4xl font-bold mb-2">Vercel KV Caching</h1>
        <p className="text-lg text-muted-foreground">
          Real millisecond measurements for read and write operations
        </p>
      </div>

      {/* KV Latency Display */}
      <div className="mb-8">
        <KvLatencyDisplay />
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>What is Vercel KV?</CardTitle>
            <CardDescription>Durable Redis storage at the edge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Vercel KV is a serverless Redis solution that provides:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Sub-5ms latency</strong> for read operations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Durable storage</strong> with automatic persistence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Global replication</strong> across edge regions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Standard Redis API</strong> for easy migration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Automatic scaling</strong> based on demand</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Use Cases</CardTitle>
            <CardDescription>When to use KV storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Session Management</h3>
              <p className="text-muted-foreground">
                Store user sessions with automatic expiration and fast lookups
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">API Response Caching</h3>
              <p className="text-muted-foreground">
                Cache expensive API calls to reduce latency and costs
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Rate Limiting</h3>
              <p className="text-muted-foreground">
                Track request counts with atomic increment operations
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Feature Flags</h3>
              <p className="text-muted-foreground">
                Store dynamic configuration that changes frequently
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Temporary Data</h3>
              <p className="text-muted-foreground">
                Store short-lived data like OTP codes or temporary tokens
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Understanding KV latency measurements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h3 className="font-semibold mb-1">Expected Latency Ranges</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="p-3 bg-white rounded border">
                <p className="font-medium text-green-600">&lt; 5ms</p>
                <p className="text-xs text-muted-foreground">Excellent - Edge cache hit</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <p className="font-medium text-yellow-600">5-10ms</p>
                <p className="text-xs text-muted-foreground">Good - Regional read</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <p className="font-medium text-orange-600">&gt; 10ms</p>
                <p className="text-xs text-muted-foreground">Acceptable - Global read/write</p>
              </div>
            </div>
          </div>
          <p>
            <strong>Note:</strong> Actual latency depends on geographic distance, network
            conditions, and whether data is cached at the edge. The measurements above
            include network round-trip time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
