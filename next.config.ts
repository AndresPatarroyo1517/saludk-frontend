/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.lasanteca.com',
        pathname: '/userfiles/**',
      },
      {
        protocol: 'https',
        hostname: 'th.bing.com',
        pathname: '/th/**',
      },
      {
        protocol: 'https',
        hostname: 'drogueriaalamedasur.co',
        pathname: '/wp-content/**',
      },
    ],
  },
};

export default nextConfig;