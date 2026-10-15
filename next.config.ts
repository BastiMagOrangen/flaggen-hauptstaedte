import type { NextConfig } from "next";
import pkg from "./package.json";

// Set NEXT_PUBLIC_BASE_PATH=/<repo> when deploying to GitHub Pages.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
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
