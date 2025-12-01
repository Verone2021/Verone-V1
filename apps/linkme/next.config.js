/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
