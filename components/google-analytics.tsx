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
  const isValidFormat = /^G-[A-Z0-9]+$/.test(measurementId);
  if (!isValidFormat) {
    console.error('Invalid Google Analytics measurement ID format. Expected format: G-XXXXXXXXXX');
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
