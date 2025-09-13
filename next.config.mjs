/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "demo.erpeazy.com",
        pathname: "/**",
      },
      // ถ้ามีโดเมนรูปอื่น ๆ ใส่เพิ่มที่นี่
    ],
  },
};

export default nextConfig; // ✅ ใช้ export default สำหรับ .mjs
