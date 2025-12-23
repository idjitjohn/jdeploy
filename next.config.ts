import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep output as 'standalone' for full-stack app
  output: 'standalone',
  basePath: '',
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
