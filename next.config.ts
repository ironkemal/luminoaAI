import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No allowedOrigins restriction — Vercel handles CSRF via its own headers
};

export default nextConfig;
