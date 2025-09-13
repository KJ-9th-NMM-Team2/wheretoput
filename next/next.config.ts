import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "wheretoput-bucket.s3.ap-northeast-2.amazonaws.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "d1nm7fd0tbcwyl.cloudfront.net",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
