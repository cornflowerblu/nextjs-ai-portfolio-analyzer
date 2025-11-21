import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Exclude lighthouse from bundling
  serverExternalPackages: ['lighthouse', 'chrome-launcher'],
};

export default nextConfig;
