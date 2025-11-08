/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // ✅ correcto
  eslint: {
    ignoreDuringBuilds: true, // ✅ correcto
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
