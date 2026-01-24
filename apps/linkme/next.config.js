/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warnings ESLint sont traités pendant le dev, pas le build
    // (linkme a beaucoup de warnings existants de formatage)
    ignoreDuringBuilds: true,
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

module.exports = nextConfig;
