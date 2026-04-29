/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@verone/hooks',
    '@verone/products',
    '@verone/customers',
    '@verone/orders',
    '@verone/finance',
    '@verone/ui',
    '@verone/utils',
    '@verone/types',
  ],
  // Images: bypass Vercel Image Optimization (HTTP 402 quota Hobby atteint).
  // `unoptimized: true` route `<Image>` vers l'URL source directe (Supabase public URL)
  // sans passer par `/_next/image`. Trade-off : pas de resize/WebP auto côté CDN Vercel.
  // À revisiter quand la migration Cloudflare Images (Option C, cf ACTIVE.md) est faite.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aorroydfjsrygmosnzrl.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.veronecollections.fr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
