/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@campus-connect/ui", "@campus-connect/utils", "@campus-connect/types"],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_API_URL || 'https://lighter-laura-mere-reminder.trycloudflare.com/api/v1',
    NEXT_API_URL: process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://lighter-laura-mere-reminder.trycloudflare.com/api/v1',
  },
  experimental: {
    outputFileTracingExcludes: {
      '*': ['**/*'],
    },
  },
};

export default nextConfig;
