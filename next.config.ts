import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // PostCSS is not working with Turbopack, so we use CSS features directly
    turbo: {},
  },
};

export default nextConfig;
