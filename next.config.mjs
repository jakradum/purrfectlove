/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.purrfectlove.org',
          },
        ],
        destination: 'https://purrfectlove.org/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;