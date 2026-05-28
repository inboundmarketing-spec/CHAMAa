import type { NextConfig } from 'next';

/** Backend Nest (evita localhost → IPv6 no Windows). */
const apiOrigin =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '').replace(
    '://localhost',
    '://127.0.0.1',
  ) ?? 'http://127.0.0.1:3001';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['*.ngrok-free.dev', '*.ngrok.io'],
  async rewrites() {
    return [
      {
        source: '/healthz',
        destination: `${apiOrigin}/`,
      },
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
