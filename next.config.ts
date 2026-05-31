import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   allowedDevOrigins: [
    '172.20.10.5', 
    '172.20.10.5:3000', 
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "portal.kababrayhan.com",
      },
    ],
 
  },
};

export default nextConfig;
