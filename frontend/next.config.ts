import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add rewrites for i18n compatibility
  async rewrites() {
    return [
      {
        source: "/:locale/_next/image/:path*",
        destination: "/_next/image/:path*",
      },
      // Ensure other Next.js static assets resolve when a locale prefix is present
      {
        source: "/:locale/_next/static/:path*",
        destination: "/_next/static/:path*",
      },
      {
        source: "/:locale/fonts/:path*", 
        destination: "/fonts/:path*",
      }
    ];
  },
};

export default withNextIntl(nextConfig);
