/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse tries to load test files at import time, which breaks
    // Next.js App Router's bundler. Marking it as "external" tells
    // Next.js to leave it for Node.js to load natively instead.
    // pdfjs-dist uses ESM worker files that must be loaded by Node.js natively.
    // Marking it external prevents Next.js/webpack from trying to bundle it,
    // which would break the worker file path resolution.
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
};

export default nextConfig;
