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
};

module.exports = nextConfig;
