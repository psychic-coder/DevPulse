/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3000/auth/:path*',
      },
      {
        source: '/sync/:path*',
        destination: 'http://localhost:3000/sync/:path*',
      },
      {
        source: '/analytics/:path*',
        destination: 'http://localhost:3000/analytics/:path*',
      },
      {
        source: '/users/:path*',
        destination: 'http://localhost:3000/users/:path*',
      },
      {
        source: '/github/:path*',
        destination: 'http://localhost:3000/github/:path*',
      },
      {
        source: '/github-sync/:path*',
        destination: 'http://localhost:3000/github-sync/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
