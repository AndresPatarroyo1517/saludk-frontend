/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // ✅ correcto
  eslint: {
    ignoreDuringBuilds: true, // ✅ correcto
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/:path*',
      },
    ];
  },
};

export default nextConfig;
