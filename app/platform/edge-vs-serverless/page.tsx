/**
 * Edge vs Serverless Comparison Page
 * Demonstrates performance differences between Edge and Serverless functions
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EdgeComparison } from '@/components/platform/edge-comparison';
import { ArrowLeft } from 'lucide-react';

export default function EdgeVsServerlessPage() {
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
        <h1 className="text-4xl font-bold mb-2">Edge vs Serverless Functions</h1>
        <p className="text-lg text-muted-foreground">
          Real-time performance comparison with actual execution measurements
        </p>
      </div>

      {/* Comparison Component */}
      <div className="mb-8">
        <EdgeComparison />
      </div>

      {/* Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-xl font-bold mb-3 text-green-900">Edge Functions</h2>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Run at the edge, close to users</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Minimal cold start times (~10ms)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Global distribution by default</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Perfect for rendering and personalization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">✗</span>
              <span>Limited runtime (streaming, no filesystem)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">✗</span>
              <span>Cannot connect to traditional databases</span>
            </li>
          </ul>
        </div>

        <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg">
          <h2 className="text-xl font-bold mb-3 text-orange-900">Serverless Functions</h2>
          <ul className="space-y-2 text-sm text-orange-800">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Full Node.js runtime with all APIs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Can connect to databases</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Filesystem access available</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Support for heavy computations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">✗</span>
              <span>Longer cold start times (100-500ms)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">✗</span>
              <span>Regional deployment (not edge-distributed)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
