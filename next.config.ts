// Server configuration: installed Next.js conventions and Tailwind loader.
import type { NextConfig } from "next";
import { CACHE_COMPONENTS_ENABLED } from "./src/config/rendering";

const nextConfig: NextConfig = {
  // Isolated browser tests use a local database and separate dev output/lock.
  distDir: process.env.NODE_ENV === "development" && process.env.EMCROWN_CMS_TEST === "1" ? ".next-cms-test" : ".next",
  // Use the documented compiler API: the CLI wrapper returns empty output here.
  experimental: { useTypeScriptCli: false },
  cacheComponents: CACHE_COMPONENTS_ENABLED,
  partialPrefetching: false,
  async headers() {
    return [{ source: "/ocr/:path*", headers: [
      { key: "Content-Security-Policy", value: "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'self'" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    ] }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
