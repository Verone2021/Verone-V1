/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 App Router configuration
  reactStrictMode: true,
  
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
        hostname: 'v5.airtableusercontent.com',
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

module.exports = nextConfig;