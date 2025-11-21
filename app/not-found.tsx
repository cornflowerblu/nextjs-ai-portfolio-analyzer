/**
 * 404 Not Found Page
 * Displayed when a route doesn't exist
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl font-bold text-muted-foreground">404</div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/dashboard">
              <Search className="mr-2 h-4 w-4" />
              View Dashboard
            </Link>
          </Button>
          <Link href="/dashboard" className="w-full">
            <Button variant="ghost" className="w-full" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              View Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
