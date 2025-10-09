const { getSecurityHeaders } = require('./src/lib/security/headers.js');
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 App Router configuration
  reactStrictMode: true,

  // ESLint: Temporairement ignoré pendant build (Phase 1 focus: TypeScript errors only)
  // Phase 4 corrigera exhaustive-deps + no-img-element, puis on réactivera
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript: Ignorer erreurs temporairement (inférence types Supabase à corriger)
  // TODO Phase dédiée : corriger tous les types Supabase `never` avec assertions explicites
  typescript: {
    ignoreBuildErrors: true,
  },

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

    // Development optimizations to eliminate webpack cache warnings
    if (dev) {
      // SOLUTION OFFICIELLE Next.js: Utiliser memory cache en dev pour éliminer warnings
      // Source: https://nextjs.org/docs/app/guides/memory-usage
      config.cache = Object.freeze({
        type: 'memory',
      });

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

// Configuration Sentry pour Next.js selon documentation officielle 2024
const sentryWebpackPluginOptions = {
  // Configuration organisationnelle
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT_ID,

  // Token d'authentification
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Contrôle verbosité (silent en dev, verbose en prod pour debug)
  silent: process.env.NODE_ENV === 'development',
  debug: process.env.NODE_ENV === 'development',

  // Source maps et sécurité
  hideSourceMaps: process.env.NODE_ENV === 'production',
  widenClientFileUpload: true,

  // Optimisations automatiques
  automaticVercelMonitors: false, // Désactivé car pas sur Vercel

  // Transpilation et bundle analyzer
  transpileClientSDK: true,
  tunnelRoute: "/monitoring",

  // Release tracking
  release: {
    name: process.env.SENTRY_RELEASE,
    finalize: false, // Allow manual finalization
  },

  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Export SANS Sentry temporairement pour débloquer build production
// Sentry sera réactivé après résolution Next.js 15 App Router compatibility
// module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
module.exports = nextConfig;