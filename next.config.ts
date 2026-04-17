import type { NextConfig } from "next";

/**
 * Next.js configuration.
 *
 * serverActions.bodySizeLimit: default is 1MB, which is too small for
 * avatar uploads from iPhone camera (photos are often 3-5MB, can reach 10MB+).
 * Raising to 15MB to comfortably handle phone photos.
 */
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
