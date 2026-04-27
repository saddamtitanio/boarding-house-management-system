import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ['@sbhms/ui']
};

export default nextConfig;