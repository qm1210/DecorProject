import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i1-vnexpress.vnecdn.net",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "i1-kinhdoanh.vnecdn.net",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
