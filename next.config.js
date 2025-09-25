const { getSecurityHeaders } = require('./src/lib/security/headers.js');
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 App Router configuration
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: getSecurityHeaders(),
      },
    ];
  },

  // Monorepo transpilation - transpile workspace packages
  transpilePackages: [
    '@verone/database',
    '@verone/shared-ui',
    '@verone/business-logic'
  ],
  
  // Performance optimizations
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'aorroydfjsrygmosnzrl.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Environment variables for client-side
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
};

// Configuration Sentry pour Next.js
const sentryWebpackPluginOptions = {
  // Configuration optimisée pour Vérone Back Office
  org: 'verone',
  project: 'verone-backoffice',

  // Disable source maps upload in development
  silent: process.env.NODE_ENV === 'development',

  // Automatically tree-shake Sentry logger statements
  hideSourceMaps: true,

  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Export avec wrapper Sentry
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);