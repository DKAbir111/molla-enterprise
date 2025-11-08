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
  // ❌ REMOVE THE 'async rewrites()' FUNCTION ENTIRELY ❌
  // It is redundant when using next-intl middleware and is the source of the redirect loop.
};

export default withNextIntl(nextConfig);