/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "demo.erpeazy.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "v-rent-app-916879005749.asia-southeast1.run.app",
        pathname: "/**",
      }
      // ถ้ามีโดเมนรูปอื่น ๆ ใส่เพิ่มที่นี่
    ],
  },
};

export default nextConfig; // ✅ ใช้ export default สำหรับ .mjs
