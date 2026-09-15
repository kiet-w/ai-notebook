import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allowedDevOrigins is needed to fix HMR block
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    webpackMemoryOptimizations: true,
  },
  async rewrites() {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
