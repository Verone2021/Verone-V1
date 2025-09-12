/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features if needed
  },
  images: {
    domains: [
      'ptqwayandsfhciitjnhb.supabase.co', // Supabase Storage domain
    ],
  },
  // Enable strict mode for better development experience
  reactStrictMode: true,
  
  // 🔧 Advanced Logging Configuration
  logging: {
    // Configure fetch request logging
    fetches: {
      fullUrl: true,        // Log complete URLs for better debugging
      hmrRefreshes: true,   // Log HMR cache hits/misses
    },
    // Configure incoming request logging
    incomingRequests: {
      ignore: [
        /\/_next\/static/,    // Ignore static assets
        /\/favicon\.ico/,     // Ignore favicon requests
        /\/_next\/image/,     // Ignore Next.js image optimization
        /\/api\/health/,      // Ignore health checks
      ]
    }
  },
}

module.exports = nextConfig