/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: false,
  images: {
    unoptimized: true
  },

  // For static export, use relative paths to make it work when opened directly from file system
  basePath: '',
  assetPrefix: './',
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
}

module.exports = nextConfig