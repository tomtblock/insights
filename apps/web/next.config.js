/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@arb/schemas'],
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
};

module.exports = nextConfig;

