import type { NextConfig } from "next";

const chatbotApiUrl =
  process.env.CHATBOT_API_URL || "https://chatbot.gruposolar.com.br/api";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*/",
        destination: `${chatbotApiUrl}/:path*/`,
      },
      {
        source: "/api/:path*",
        destination: `${chatbotApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
