import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

// Only use static export for Capacitor APK builds (set CAPACITOR=true in npm run sync)
const isCapacitor = process.env.CAPACITOR === "true";

const nextConfig: NextConfig = {
  ...(isCapacitor && {
    output: "export",
    trailingSlash: true,
  }),
  images: { unoptimized: true },
  turbopack: {},
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);
