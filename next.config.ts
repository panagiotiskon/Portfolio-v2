import type { NextConfig } from "next";

// GitHub Pages: static export under /<repo>. Set by the Pages workflow.
const basePath = process.env.PAGES_BASE_PATH;

const nextConfig: NextConfig = {
  ...(basePath !== undefined && {
    output: "export",
    basePath,
    images: { unoptimized: true },
  }),
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
