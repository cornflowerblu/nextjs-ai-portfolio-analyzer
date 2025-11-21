/**
 * Platform Features Overview Page
 * Main hub for exploring Vercel platform capabilities
 */

import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Database, Flag, Globe } from 'lucide-react';

const platformFeatures = [
  {
    id: 'edge-vs-serverless',
    title: 'Edge vs Serverless',
    description: 'Compare execution times between Edge Functions and traditional serverless functions',
    icon: Zap,
    href: '/platform/edge-vs-serverless',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'kv-cache',
    title: 'KV Caching',
    description: 'Measure real read/write latency with Vercel KV (Redis) operations',
    icon: Database,
    href: '/platform/kv-cache',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'edge-config',
    title: 'Edge Config',
    description: 'Demonstrate feature flags and configuration with Edge Config',
    icon: Flag,
    href: '/platform/edge-config',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'geo-latency',
    title: 'Geographic Latency',
    description: 'Test response times from multiple Vercel regions worldwide',
    icon: Globe,
    href: '/platform/geo-latency',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

export default function PlatformPage() {
  return (
    <div>
      <SiteHeader />
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Vercel Platform Features</h1>
          <p className="text-lg text-muted-foreground">
            Explore platform capabilities with real measurements and live demos
          </p>
        </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {platformFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="mb-2">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={feature.href}>
                  <Button className="w-full group-hover:translate-x-1 transition-transform">
                    Explore Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <Card className="bg-linear-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle>Why Platform Features Matter</CardTitle>
          <CardDescription>
            Understanding Vercel platform capabilities helps optimize performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Edge Functions</h3>
              <p className="text-sm text-muted-foreground">
                Run code at the edge with minimal cold start times and global distribution.
                Perfect for dynamic rendering and personalization.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Vercel KV</h3>
              <p className="text-sm text-muted-foreground">
                Durable Redis storage with sub-5ms latency. Ideal for caching, session
                storage, and real-time data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Edge Config</h3>
              <p className="text-sm text-muted-foreground">
                Ultra-fast configuration at the edge. Read values with sub-millisecond
                latency without database queries.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Global Distribution</h3>
              <p className="text-sm text-muted-foreground">
                Deploy to multiple regions automatically. Serve users from the nearest
                edge location for optimal performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
