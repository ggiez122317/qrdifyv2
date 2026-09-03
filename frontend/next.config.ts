import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts', 
      'date-fns',
      '@tanstack/react-query',
      'react-leaflet',
      'leaflet',
    ],
  },
  typedRoutes: false,
  allowedDevOrigins: ['192.168.100.160', 'localhost', '127.0.0.1'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.100.160',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.100.160',
        port: '8001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8001',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
