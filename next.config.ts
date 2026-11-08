import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname,
  },
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.DJANGO_API_URL}/api/:path*` }];
  },
};

export default nextConfig;
