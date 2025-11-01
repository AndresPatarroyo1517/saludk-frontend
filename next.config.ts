/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // ✅ correcto
  eslint: {
    ignoreDuringBuilds: true, // ✅ correcto
  },
};

export default nextConfig;
