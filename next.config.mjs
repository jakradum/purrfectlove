/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async rewrites() {
    return [
      // care.purrfectlove.org/ → /care
      {
        source: '/',
        has: [{ type: 'host', value: 'care.purrfectlove.org' }],
        destination: '/care',
      },
      // care.purrfectlove.org/<path> → /care/<path>  (excludes /api/ so API routes work as-is)
      {
        source: '/((?!api/).*)',
        has: [{ type: 'host', value: 'care.purrfectlove.org' }],
        destination: '/care/$1',
      },
    ];
  },
};

export default nextConfig;