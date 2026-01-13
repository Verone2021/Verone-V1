const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warnings ESLint sont traités pendant le dev, pas le build
    // (linkme a beaucoup de warnings existants de formatage)
    ignoreDuringBuilds: true,
  },
  // Experimental: Continue build even if pre-rendering fails
  // This allows pages with `location` errors during SSG to fallback to client-side
  experimental: {
    fallbackNodePolyfills: false,
  },
  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  transpilePackages: [
    '@verone/orders',
    '@verone/finance',
    '@verone/customers',
    '@verone/products',
    '@verone/utils',
    '@verone/types',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aorroydfjsrygmosnzrl.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Organisation et projet Sentry
  org: 'verone',
  project: 'linkme',

  // Silence sourcemap upload logs
  silent: !process.env.CI,

  // Upload sourcemaps mais les supprimer du bundle client
  hideSourceMaps: true,

  // Tunnel pour contourner ad-blockers
  tunnelRoute: '/monitoring',

  // Auto-attach releases sur Vercel
  automaticVercelMonitors: true,

  // Desactiver telemetrie Sentry
  telemetry: false,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
