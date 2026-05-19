/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return [
      {
        source: '/auth/:path((?!callback).*)',
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: '/digests/:path*',
        destination: `${backendUrl}/digests/:path*`,
      },
      {
        source: '/sync/:path*',
        destination: `${backendUrl}/sync/:path*`,
      },
      {
        source: '/analytics/:path*',
        destination: `${backendUrl}/analytics/:path*`,
      },
      {
        source: '/users/:path*',
        destination: `${backendUrl}/users/:path*`,
      },
      {
        source: '/github/:path*',
        destination: `${backendUrl}/github/:path*`,
      },
      {
        source: '/github-sync/:path*',
        destination: `${backendUrl}/github-sync/:path*`,
      },
      {
        source: '/digests/:path*',
        destination: `${backendUrl}/digests/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
