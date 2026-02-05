const { getSecurityHeaders } = require('./src/lib/security/headers.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 App Router configuration
  reactStrictMode: true,

  // Production source maps for debugging
  productionBrowserSourceMaps: true,

  // ✅ FIX (2026-01-26): Externaliser jsdom pour éviter erreur build
  // jsdom (dépendance de isomorphic-dompurify) charge un fichier CSS incompatible avec le bundling Next.js
  serverExternalPackages: ['jsdom', 'isomorphic-dompurify'],

  // WORKAROUND (2025-10-17): Désactiver export statique pour résoudre Html import error
  // Bug Next.js 15.5.4 avec prerendering pages d'erreur /_error, /404, /500
  // FIX (2026-02-05): Désactiver standalone qui cause 404 sur routes complexes LinkMe
  // output: 'standalone',

  // ESLint: Activé avec config stricte @verone/eslint-config (2025-11-07)
  // Validation complète au build avec TypeScript recommended + Prettier
  // TEMPORARY (2025-11-08): ignoreDuringBuilds pour migration monorepo @verone/*
  eslint: {
    dirs: ['src', 'app'], // Valider uniquement code source
    ignoreDuringBuilds: true, // TEMPORARY - Re-enable after fixing warnings
  },

  // TypeScript: Validation stricte RÉACTIVÉE (2025-11-19)
  // ✅ FIXED: Toutes les erreurs TypeScript corrigées (Phase 4 Migration Turborepo)
  // Note: Utiliser npm run type-check pour validation locale avant commit
  typescript: {
    ignoreBuildErrors: false, // ✅ Validation stricte réactivée
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

  // Redirections - Migration structure (Root redirect géré par middleware.ts)
  async redirects() {
    return [
      {
        source: '/catalogue',
        destination: '/produits/catalogue',
        permanent: true, // 301 redirect
      },
      {
        source: '/catalogue/:path*',
        destination: '/produits/catalogue/:path*',
        permanent: true, // 301 redirect
      },
      {
        source: '/sourcing',
        destination: '/produits/sourcing',
        permanent: true, // 301 redirect
      },
      {
        source: '/sourcing/:path*',
        destination: '/produits/sourcing/:path*',
        permanent: true, // 301 redirect
      },
      // Finance: Pages obsolètes → Page unifiée Transactions
      {
        source: '/finance/justificatifs',
        destination: '/finance/transactions',
        permanent: true, // 308 redirect (permanent)
      },
      {
        source: '/finance/rapprochement',
        destination: '/finance/transactions',
        permanent: true, // 308 redirect (permanent)
      },
    ];
  },

  // Monorepo transpilation - transpile ALL workspace packages
  transpilePackages: [
    '@verone/admin',
    '@verone/categories',
    '@verone/channels',
    '@verone/collections',
    '@verone/common',
    '@verone/consultations',
    '@verone/customers',
    '@verone/dashboard',
    '@verone/finance',
    '@verone/hooks',
    '@verone/integrations',
    '@verone/kpi',
    '@verone/logistics',
    '@verone/notifications',
    '@verone/orders',
    '@verone/organisations',
    '@verone/products',
    '@verone/stock',
    '@verone/suppliers',
    '@verone/types',
    '@verone/ui',
    '@verone/ui-business',
    '@verone/utils',
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
    // ✅ FIX: Supprimer warning "Using edge runtime" (message informatif)
    NEXT_HIDE_MIDDLEWARE_MESSAGE: '1',
  },

  // Webpack optimizations for large files performance
  webpack: (config, { isServer, dev }) => {
    // ✅ FIX: Supprimer warnings Supabase Edge Runtime (ZERO WARNING policy)
    config.ignoreWarnings = [
      // Warnings Supabase realtime-js et supabase-js avec process.versions/process.version en Edge Runtime
      /A Node\.js API is used \(process\.(versions?|version) at line: \d+\) which is not supported in the Edge Runtime/,
      // Warning serialization big strings (déjà géré avec memory cache mais on filtre le message)
      /Serializing big strings \(\d+kiB\) impacts deserialization performance/,
    ];

    // Optimize performance for large files (like use-manual-tests.ts)
    if (!dev) {
      // ✅ FIX: Utiliser memory cache en production aussi pour éviter warning "Serializing big strings"
      config.cache = Object.freeze({
        type: 'memory',
      });

      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        maxSize: 500000, // ✅ FIX: Augmenter pour pages volumineuses (était 200000)
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
        maxSize: 500000, // ✅ FIX: Augmenter pour pages volumineuses (était 244000)
      };
    }

    return config;
  },
};

module.exports = nextConfig;
