export default function Footer() {
  return (
    <footer className="bg-black text-white py-4 mt-6">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Logo / Brand */}
        <div>
          <h2 className="text-xl font-bold mb-2">V-Rent</h2>
          <p className="text-gray-400 text-xs leading-relaxed">
            บริการเช่ายานพาหนะคุณภาพสูง
            <br />
            ปลอดภัย สะดวก รวดเร็ว
          </p>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold mb-2">ติดต่อเรา</h3>
          <p className="text-gray-400 text-xs leading-relaxed">
            123 ถนนตัวอย่าง เขตตัวเมือง
            <br />
            กรุงเทพฯ 10110
          </p>
          <p className="text-gray-400 text-xs mt-1">โทร: 02-123-4567</p>
          <p className="text-gray-400 text-xs">มือถือ: 081-234-5678</p>
        </div>

        {/* Email & Social */}
        <div>
          <h3 className="text-lg font-semibold mb-2">ติดต่อออนไลน์</h3>
          <p className="text-gray-400 text-xs">Email: info@vrent.com</p>
          <div className="flex space-x-3 mt-2 text-sm">
            <a href="#" className="hover:text-blue-500">
              Facebook
            </a>
            <a href="#" className="hover:text-pink-500">
              Instagram
            </a>
            <a href="#" className="hover:text-gray-600">
              X
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-4 border-t border-gray-700 pt-2 text-center text-gray-500 text-xs">
        © {new Date().getFullYear()} V-Rent. All rights reserved.
      </div>
    </footer>
  );
}
