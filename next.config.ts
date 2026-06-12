import type { NextConfig } from "next";

const chatbotApiUrl = process.env.CHATBOT_API_URL || "http://backend:8000";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,

  turbopack: {
    root: process.cwd(),
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${chatbotApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;