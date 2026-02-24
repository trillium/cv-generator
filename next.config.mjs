/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  distDir: isDev ? ".next-dev" : ".next",
  serverExternalPackages: ["bun:sqlite"],
};

export default nextConfig;
