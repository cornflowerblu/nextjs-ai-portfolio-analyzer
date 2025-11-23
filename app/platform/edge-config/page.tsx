/**
 * Edge Config Demo Page
 * Demonstrates feature flags and configuration with Edge Config
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FeatureFlagToggle } from '@/components/platform/feature-flag-toggle';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EdgeConfigPage() {
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
        <h1 className="text-4xl font-bold mb-2">Edge Config Feature Flags</h1>
        <p className="text-lg text-muted-foreground">
          Ultra-fast configuration with sub-millisecond read latency
        </p>
      </div>

      {/* Feature Flag Component */}
      <div className="mb-8">
        <FeatureFlagToggle />
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>What is Edge Config?</CardTitle>
            <CardDescription>Global configuration at the edge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Edge Config is Vercel&apos;s ultra-fast key-value store for reading configuration:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Sub-millisecond reads</strong> with global distribution</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>No database queries</strong> required</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Instant propagation</strong> to all edge locations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Version control</strong> with rollback support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Type-safe</strong> TypeScript SDK</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Use Cases</CardTitle>
            <CardDescription>When to use Edge Config</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Feature Flags</h3>
              <p className="text-muted-foreground">
                Enable/disable features without redeployment
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">A/B Testing</h3>
              <p className="text-muted-foreground">
                Control experiment variants and traffic allocation
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Allow/Block Lists</h3>
              <p className="text-muted-foreground">
                Manage access control and IP restrictions
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Redirects</h3>
              <p className="text-muted-foreground">
                Dynamic URL redirects without code changes
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Maintenance Mode</h3>
              <p className="text-muted-foreground">
                Toggle site-wide maintenance pages instantly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison with KV */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Edge Config vs Vercel KV</CardTitle>
          <CardDescription>Choosing the right storage solution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-3 font-semibold">Feature</th>
                  <th className="text-left p-3 font-semibold">Edge Config</th>
                  <th className="text-left p-3 font-semibold">Vercel KV</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-medium">Read Latency</td>
                  <td className="p-3 text-green-600">&lt;1ms (in-memory)</td>
                  <td className="p-3 text-blue-600">&lt;5ms (network)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Write Latency</td>
                  <td className="p-3 text-yellow-600">Slower (API + propagation)</td>
                  <td className="p-3 text-green-600">Fast (~5-10ms)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Update Frequency</td>
                  <td className="p-3">Infrequent (config changes)</td>
                  <td className="p-3">Frequent (session, cache)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Data Size</td>
                  <td className="p-3">Small (up to 512KB)</td>
                  <td className="p-3">Flexible (MB-GB)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Expiration</td>
                  <td className="p-3">Manual (no TTL)</td>
                  <td className="p-3">Automatic (TTL support)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Best For</td>
                  <td className="p-3">Configuration, flags, static data</td>
                  <td className="p-3">Caching, sessions, dynamic data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>How to configure Edge Config</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h3 className="font-semibold mb-2">1. Create Edge Config</h3>
            <code className="block p-2 bg-white rounded border text-xs">
              vercel edge-config create production
            </code>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Link to Project</h3>
            <p className="text-muted-foreground">
              In your Vercel dashboard, go to Storage → Edge Config → Link to Project
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. Add Environment Variable</h3>
            <code className="block p-2 bg-white rounded border text-xs">
              EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xg49dvpnlj8duwjmzocolbx9svyu?token=652c9b72-b0e2-4ba0-b8ee-601187553e4f
            </code>
          </div>
          <div>
            <h3 className="font-semibold mb-2">4. Read Values in Code</h3>
            <code className="block p-2 bg-white rounded border text-xs font-mono">
              {`import { get } from '@vercel/edge-config';
const value = await get('key');`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
