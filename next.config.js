/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/klv-extractor' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/klv-extractor/' : '',
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
}

module.exports = nextConfig