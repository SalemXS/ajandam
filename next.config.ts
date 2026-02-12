import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization disabled for Capacitor compatibility
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
