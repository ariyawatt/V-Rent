import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full bg-black text-white px-6 py-4 flex items-center justify-between shadow-md">
      {/* ด้านซ้าย */}
      <div className="text-2xl font-bold">
        <Link href="/">V-Rent-Admin</Link>
      </div>

      {/* ด้านขวา */}
      <div className="flex items-center space-x-3">
        {/* ปุ่ม Login แบบเล็ก Minimal */}
        <Link
          href="/Login"
          className="px-3 py-1.5 text-sm text-gray-200 rounded-md hover:bg-gray-800 transition-colors"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
