/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@campus-connect/ui", "@campus-connect/utils", "@campus-connect/types"],
};

export default nextConfig;

