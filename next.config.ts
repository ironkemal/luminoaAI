import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: false,
      },
      {
        source: "/dashboard/:path*",
        destination: "/",
        permanent: false,
      },
      {
        source: "/login",
        destination: "/",
        permanent: false,
      },
      {
        source: "/register",
        destination: "/",
        permanent: false,
      },
      {
        source: "/history/:path*",
        destination: "/",
        permanent: false,
      },
      {
        source: "/interview/:path*",
        destination: "/",
        permanent: false,
      },
      {
        source: "/onboarding",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
