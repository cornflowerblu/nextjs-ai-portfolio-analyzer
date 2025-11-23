/**
 * Google Analytics Component
 * Loads Google Tag Manager script for analytics tracking
 */

'use client';

import Script from 'next/script';

export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Don't render if no measurement ID is configured
  if (!measurementId) {
    return null;
  }

  // Validate measurement ID format (should be G-XXXXXXXXXX)
  // Only allow alphanumeric characters and hyphens to prevent script injection
  const isValidFormat = /^G-[A-Z0-9]+$/i.test(measurementId);
  if (!isValidFormat) {
    console.error('Invalid Google Analytics measurement ID format. Expected format: G-XXXXXXXXXX');
    return null;
  }

  // Additional sanitization: escape any potential script injection characters
  // This is defense in depth - the regex above should already prevent this
  const sanitizedId = measurementId.replace(/[<>"']/g, '');

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${sanitizedId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${sanitizedId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
