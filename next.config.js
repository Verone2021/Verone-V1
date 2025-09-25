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

  // Webpack optimizations for large files performance
  webpack: (config, { isServer, dev }) => {
    // Optimize performance for large files (like use-manual-tests.ts)
    if (!dev) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate large hooks/utils into their own chunks
          largeHooks: {
            name: 'large-hooks',
            chunks: 'all',
            test: /use-manual-tests|use-.*-optimized|.*-history/,
            priority: 30,
            minSize: 100000, // 100KB minimum
          },
          // Separate business components
          businessComponents: {
            name: 'business-components',
            chunks: 'all',
            test: /business\/.*\.tsx?$/,
            priority: 25,
            minSize: 50000, // 50KB minimum
          },
        },
      };
    }

    // Development optimizations to reduce webpack warnings
    if (dev) {
      // Reduce webpack cache warnings for large strings
      config.cache = {
        ...config.cache,
        compression: false, // Disable compression for dev to reduce warnings
      };

      // Optimize module resolution for large files
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000, // Reduce max size to avoid large string warnings
      };
    }

    return config;
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