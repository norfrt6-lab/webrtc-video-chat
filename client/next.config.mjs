/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:3000/api/:path*" },
      { source: "/socket.io/:path*", destination: "http://localhost:3000/socket.io/:path*" },
    ];
  },
};

export default nextConfig;
