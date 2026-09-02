/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@campus-connect/ui", "@campus-connect/utils", "@campus-connect/types"],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_API_URL: process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || '',
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_API_URL ||
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://campus-connect-tyz7.onrender.com/api/v1';

    const normalized = backendUrl.replace(/\/$/, '');
    const destination = normalized.endsWith('/api/v1')
      ? `${normalized}/:path*`
      : `${normalized}/api/v1/:path*`;

    return [
      {
        source: '/api/v1/:path*',
        destination,
      },
    ];
  },
  experimental: {
    outputFileTracingExcludes: {
      '*': ['**/*'],
    },
  },
};

export default nextConfig;
