"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [userId, setUserId] = useState(""); // ค่าที่เก็บตอนล็อกอิน เช่นอีเมลหรือ user id
  const [displayName, setDisplayName] = useState(""); // ชื่อที่จะโชว์ (full name)
  const [signingOut, setSigningOut] = useState(false);

  const computeDisplayName = () => {
    const uid = localStorage.getItem("vrent_user_id") || "";
    // รองรับหลาย key ที่อาจใช้เก็บชื่อ
    const nameFromStorage =
      localStorage.getItem("vrent_full_name") ||
      localStorage.getItem("vrent_user_name") ||
      "";

    // ถ้าไม่มีชื่อ ให้ fallback เป็นหน้าก่อน @ ของอีเมล หรือ uid ตรงๆ
    const fallback = uid && uid.includes("@") ? uid.split("@")[0] : uid;

    return { uid, name: nameFromStorage || fallback };
  };

  useEffect(() => {
    const { uid, name } = computeDisplayName();
    setUserId(uid);
    setDisplayName(name);

    // sync ข้ามแท็บ
    const onStorage = () => {
      const { uid: nextUid, name: nextName } = computeDisplayName();
      setUserId(nextUid);
      setDisplayName(nextName);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("https://demo.erpeazy.com/api/method/logout", {
        method: "GET",
        credentials: "include",
      });
    } catch (err) {
      console.error("logout error:", err);
    } finally {
      // เคลียร์ค่าที่เกี่ยวกับผู้ใช้ทั้งหมด
      localStorage.removeItem("vrent_user_id");
      localStorage.removeItem("vrent_full_name");
      localStorage.removeItem("vrent_user_name");
      localStorage.removeItem("vrent_is_admin");
      localStorage.removeItem("vrent_login_email");
      localStorage.removeItem("vrent_remember");

      setUserId("");
      setDisplayName("");
      setSigningOut(false);
      router.push("/Login");
    }
  };

  return (
    <header className="w-full bg-black text-white px-6 py-4 flex items-center justify-between shadow-md">
      {/* ซ้าย */}
      <div className="text-2xl font-bold">
        <Link href="/mainpage">V-Rent</Link>
      </div>

      {/* ขวา */}
      <div className="flex items-center space-x-3">
        {userId ? (
          <>
            <Link
              href="/profile"
              className="px-3 py-1.5 text-sm text-gray-300 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
              title="ไปหน้าโปรไฟล์"
            >
              {displayName || userId}
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-3 py-1.5 text-sm rounded-md bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60 transition-colors"
            >
              {signingOut ? "กำลังออก..." : "Sign out"}
            </button>
          </>
        ) : (
          <Link
            href="/Login"
            className="px-3 py-1.5 text-sm text-gray-200 rounded-md hover:bg-gray-800 transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
