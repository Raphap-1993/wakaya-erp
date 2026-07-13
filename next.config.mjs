/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
  typedRoutes: true,
  async rewrites() {
    return [
      {
        source: '/es/images/:path*',
        destination: '/images/:path*',
      },
      {
        source: '/en/images/:path*',
        destination: '/images/:path*',
      },
    ];
  },
};

export default nextConfig;
