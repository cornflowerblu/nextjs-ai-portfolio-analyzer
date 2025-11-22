/**
 * Site Footer Component
 * Reusable footer that appears on all pages
 */

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background" aria-label="Site footer">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>Next.js Rendering Strategy Analyzer • Built with Next.js 16 & React 19</p>
      </div>
    </footer>
  );
}
