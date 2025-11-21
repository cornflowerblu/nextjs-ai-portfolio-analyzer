/**
 * SourceCodeViewer Component
 * Display source code with syntax highlighting using Shiki
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface SourceCodeViewerProps {
  code: string;
  language: string;
  title?: string;
}

export function SourceCodeViewer({ code, language, title = 'Source Code' }: SourceCodeViewerProps) {
  const [highlighted, setHighlighted] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function highlightCode() {
      try {
        const { codeToHtml } = await import('shiki');
        
        const html = await codeToHtml(code, {
          lang: language,
          theme: 'github-dark',
        });

        if (isMounted) {
          setHighlighted(html);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error highlighting code:', error);
        if (isMounted) {
          // Fallback to plain text with basic formatting
          setHighlighted(`<pre class="shiki" style="background-color:#0d1117;color:#e6edf3"><code>${escapeHtml(code)}</code></pre>`);
          setIsLoading(false);
        }
      }
    }

    highlightCode();

    return () => {
      isMounted = false;
    };
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Implementation code for this demo
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0"
            title={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {isLoading ? (
            <div className="bg-muted rounded-lg p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
                <div className="h-4 bg-muted-foreground/20 rounded w-5/6"></div>
              </div>
            </div>
          ) : (
            <div
              className="overflow-x-auto rounded-lg border"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
