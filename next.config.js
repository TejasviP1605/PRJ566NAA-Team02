/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
  },
  images: {
    domains: ['api.dicebear.com', 'images.unsplash.com'],
  },
}

module.exports = nextConfig
