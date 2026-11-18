/** @type {import('next').NextConfig} */
const isCloudflarePages = process.env.CF_PAGES === "1";

const nextConfig = {
  staticPageGenerationTimeout: 300,
  experimental: { cpus: 1 },
  images: {
    domains: [
      "notion-blog.kanaru.jp",
      "kanaru.jp",
      "s3.us-west-2.amazonaws.com",
      "picsum.photos",
    ],
    formats: ["image/avif", "image/webp"],
    ...(isCloudflarePages ? { unoptimized: true } : {}),
  },
};

module.exports = nextConfig;
