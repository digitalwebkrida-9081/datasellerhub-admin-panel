import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Disabled to allow SSR/API routes
  // distDir: 'dist',  // Reverted to default .next
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
