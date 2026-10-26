import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Child Materials posts the file to a Server Action as a base64 data URL,
  // which inflates it by ~33%. 10 MB of document therefore needs ~14 MB of
  // body; the per-file cap itself lives in src/lib/materials.ts.
  experimental: {
    serverActions: { bodySizeLimit: "15mb" },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
