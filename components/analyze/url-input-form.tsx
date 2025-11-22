'use client';

/**
 * URL Input Form Component
 * Form for entering and validating URLs to analyze
 */

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const urlSchema = z.string().url('Please enter a valid URL');

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  loading?: boolean;
}

export function UrlInputForm({ onSubmit, loading = false }: UrlInputFormProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate URL
    const validation = urlSchema.safeParse(url);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid URL');
      return;
    }

    onSubmit(validation.data);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    // Clear error when user types
    if (error) setError(null);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url-input" className="text-sm font-medium">
              Website URL
            </label>
            <div className="flex gap-2">
              <input
                id="url-input"
                type="url"
                value={url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                disabled={loading}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'url-error' : undefined}
              />
              <Button type="submit" disabled={loading || !url}>
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
            {error && (
              <p id="url-error" className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
          <p className="text-xs text-gray-600">
            Enter any website URL to analyze its performance and get rendering strategy recommendations.
            Analysis typically takes 30-60 seconds.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
