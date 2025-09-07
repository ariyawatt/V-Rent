"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Headers from "@/Components/Header";
import Footer from "@/Components/FooterMinimal";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    // เติมอีเมลที่เคยจำไว้ (ถ้ามี)
    const savedEmail = localStorage.getItem("vrent_login_email") || "";
    const savedRemember = localStorage.getItem("vrent_remember") === "1";
    if (savedEmail) setEmail(savedEmail);
    if (savedRemember) setRemember(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);

    try {
      // ERPNext/Frappe login endpoint
      const res = await fetch("https://demo.erpeazy.com/api/method/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // สำคัญ: ให้บราวเซอร์จัดการคุกกี้เอง (ตั้ง Cookie header เองไม่ได้)
        credentials: "include",
        redirect: "follow",
        body: JSON.stringify({
          usr: email, // กรอกในฟอร์ม เช่น "administrator"
          pwd: password, // กรอกในฟอร์ม เช่น "ZAQ!@WSX"
        }),
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { raw: rawText };
      }

      if (!res.ok) {
        // พยายามดึง message จาก response ถ้ามี
        const msg =
          data?.message ||
          data?.exc ||
          data?.raw ||
          "Login failed. Please check your credentials.";
        throw new Error(
          typeof msg === "string" ? msg : "Login failed. Please try again."
        );
      }

      // จำอีเมลไว้ตามที่ผู้ใช้เลือก
      if (remember) {
        localStorage.setItem("vrent_login_email", email);
        localStorage.setItem("vrent_remember", "1");
      } else {
        localStorage.removeItem("vrent_login_email");
        localStorage.removeItem("vrent_remember");
      }

      // สำเร็จ — ไปหน้าแอดมิน (ปรับ path ได้ตามโปรเจ็กต์ของคุณ)
      router.push("/adminpage");
    } catch (err) {
      console.error(err);
      setErrMsg(err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-slate-200">
      <Headers />

      {/* background aurora / glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-[-10%] w-[60rem] h-[60rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, #7C5CFF 0%, rgba(124,92,255,0.0) 60%)",
          }}
        />
        <div
          className="absolute left-[10%] bottom-[-20%] w-[50rem] h-[50rem] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, #34D399 0%, rgba(52,211,153,0.0) 60%)",
          }}
        />
      </div>

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* glass card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">
            <div className="px-8 pt-8 pb-6">
              {/* V-Rent icon */}
              <div
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full 
                bg-gradient-to-br from-[#1B1B2F] to-[#0A0A12] 
                shadow-2xl ring-2 ring-indigo-500/60"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M3 4L12 20L21 4"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinejoin="miter"
                  />
                  <path
                    d="M6 4L12 15L18 4"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinejoin="miter"
                    opacity="0.85"
                  />
                </svg>
              </div>

              <h1 className="text-center text-2xl font-semibold">V-Rent</h1>
              <p className="mt-1 text-center text-sm text-slate-400">
                Connected You to Every Road.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Email */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Email Address / Username
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M3 7.5 12 13l9-5.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="administrator หรือ you@domain.com"
                      className="w-full rounded-xl border border-white/10 bg-[#0F1530]/60 px-10 py-3 text-sm placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </label>

                {/* Password */}
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    Password
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="4"
                          y="10"
                          width="16"
                          height="10"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M8 10V7a4 4 0 1 1 8 0v3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <input
                      type={show ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-[#0F1530]/60 px-10 py-3 text-sm placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-200"
                      aria-label={show ? "Hide password" : "Show password"}
                    >
                      {show ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M3 3l18 18"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4M21 12s-3.5 6-9 6-9-6-9-6 3.5-6 9-6c2.3 0 4.3.9 5.8 2.1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M21 12s-3.5 6-9 6-9-6-9-6 3.5-6 9-6 9 6 9 6Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                {/* error message */}
                {errMsg && (
                  <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {errMsg}
                  </div>
                )}

                {/* remember + signup */}
                <div className="mt-1 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/10 bg-[#0F1530] text-indigo-500 focus:ring-indigo-500/40"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Remember this session
                  </label>

                  <a
                    href="/Signup"
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Sign up
                  </a>
                </div>

                {/* Login button */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:to-violet-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              {/* divider */}
              <div className="my-6 flex items-center gap-4 text-xs text-slate-500">
                <div className="h-px flex-1 bg-white/10" />
                <span>Or Login With</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* OAuth buttons */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10"
                >
                  {/* Google logo */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 533.5 544.3"
                    width="20"
                    height="20"
                  >
                    <path
                      fill="#4285f4"
                      d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272v104.8h146.9c-6.3 34.4-25.9 63.6-55.2 83.1v68.9h89.2c52.1-48 80.6-118.6 80.6-201.5z"
                    />
                    <path
                      fill="#34a853"
                      d="M272 544.3c74.7 0 137.4-24.7 183.2-67.4l-89.2-68.9c-24.8 16.6-56.5 26-94 26-72 0-133.1-48.6-154.9-114.1H23.6v71.6c46.1 91.5 140.1 152.8 248.4 152.8z"
                    />
                    <path
                      fill="#fbbc05"
                      d="M117.1 319.9c-10.9-32.9-10.9-68.6 0-101.5V146.8H23.6c-38.9 77.3-38.9 169.6 0 246.9l93.5-73.8z"
                    />
                    <path
                      fill="#ea4335"
                      d="M272 107.7c39.8-.6 78.2 14.8 107.4 42.9l80-80C409.4 24.7 346.7 0 272 0 163.7 0 69.7 61.3 23.6 152.8l93.5 71.6c21.8-65.5 82.9-114.1 154.9-116.7z"
                    />
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10"
                >
                  {/* Facebook logo */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M22.675 0h-21.35C.595 0 0 .6 0 1.326v21.348C0 23.405.595 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.505 0-1.797.716-1.797 1.767v2.318h3.59l-.467 3.622h-3.123V24h6.116C23.405 24 24 23.405 24 22.674V1.326C24 .6 23.405 0 22.675 0z" />
                  </svg>
                  Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
