"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
import { getCarById } from "@/data/cars";

const getBool = (v) => String(v).toLowerCase() === "true";
const f = (n) => Number(n || 0).toLocaleString();

export default function ChoosePayment() {
  // ✅ ใช้ hook ของ Next.js 15
  const sp = useSearchParams();

  const carId = sp.get("carId") || "";
  const car = useMemo(() => getCarById(String(carId)), [carId]);

  const pickupLocation = sp.get("pickupLocation") || "";
  const dropoffLocation = sp.get("dropoffLocation") || "";
  const pickupAt = sp.get("pickupAt") || "";
  const dropoffAt = sp.get("dropoffAt") || "";
  const name = sp.get("name") || "";
  const phone = sp.get("phone") || "";
  const email = sp.get("email") || "";
  const note = sp.get("note") || "";

  const extras = {
    childSeat: getBool(sp.get("childSeat")),
    gps: getBool(sp.get("gps")),
    fullInsurance: getBool(sp.get("fullInsurance")),
  };

  const dayCount = useMemo(() => {
    if (!pickupAt || !dropoffAt) return 1;
    const A = new Date(pickupAt);
    const B = new Date(dropoffAt);
    const diff = Math.ceil((B - A) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  }, [pickupAt, dropoffAt]);

  const base = (car?.pricePerDay || 0) * dayCount;
  const extrasSum =
    (extras.childSeat ? 120 : 0) * dayCount +
    (extras.gps ? 80 : 0) * dayCount +
    (extras.fullInsurance ? 300 : 0) * dayCount;
  const total = base + extrasSum;

  const [method, setMethod] = useState("promptpay");
  const [card, setCard] = useState({
    number: "",
    nameOnCard: "",
    exp: "",
    cvc: "",
  });

  // ✅ เก็บ query ทั้งชุดไว้ส่งกลับ/ต่อไป
  const tailQS = useMemo(() => {
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
  }, [sp]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900">
      <Headers />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          {/* ซ้าย */}
          <section className="bg-white rounded-2xl shadow-lg border border-slate-300 p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              เลือกวิธีการชำระเงิน
            </h1>
            <p className="text-slate-700 mt-1">
              โปรดเลือกวิธีชำระเงินเพื่อดำเนินการจองให้เสร็จสมบูรณ์
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMethod("promptpay")}
                className={`text-left rounded-xl border p-4 transition hover:shadow-sm ${
                  method === "promptpay"
                    ? "border-slate-900 ring-2 ring-slate-900"
                    : "border-slate-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white font-bold">
                    ฿
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900">
                      PromptPay
                    </div>
                    <div className="text-sm text-slate-700">
                      โอนผ่าน QR พร้อมเพย์ (อัปโหลดสลิป)
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("visa")}
                className={`text-left rounded-xl border p-4 transition hover:shadow-sm ${
                  method === "visa"
                    ? "border-slate-900 ring-2 ring-slate-900"
                    : "border-slate-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600 font-bold text-slate-900">
                    VISA
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900">
                      บัตรเครดิต / เดบิต
                    </div>
                    <div className="text-sm text-slate-700">
                      รองรับ Visa / Mastercard
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-8">
              {method === "promptpay" ? (
                <div className="rounded-xl border border-slate-300 p-5">
                  <h3 className="font-bold text-lg text-slate-900">
                    ชำระเงินด้วย PromptPay
                  </h3>
                  <p className="text-sm text-slate-700 mt-1">
                    สแกน QR เพื่อชำระยอดรวม จากนั้นอัปโหลดสลิปเพื่อยืนยัน
                  </p>

                  <div className="mt-5 flex flex-col sm:flex-row items-center gap-6">
                    <div className="h-44 w-44 rounded-lg border-2 border-dashed border-slate-500/80 grid place-items-center text-slate-700">
                      QR MOCK
                    </div>
                    <div className="flex-1 w-full">
                      <div className="text-sm text-slate-700">
                        ยอดที่ต้องชำระ
                      </div>
                      <div className="text-4xl font-extrabold tracking-tight text-slate-900">
                        ฿{f(total)}
                      </div>

                      <div className="mt-4">
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-400 hover:bg-slate-50 cursor-pointer text-slate-900">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                          />
                          <span>อัปโหลดสลิป</span>
                        </label>
                        <p className="text-xs text-slate-700 mt-1">
                          รองรับ .jpg, .png (สูงสุด ~5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-300 p-5">
                  <h3 className="font-bold text-lg text-slate-900">
                    ชำระเงินด้วยบัตร
                  </h3>
                  <p className="text-sm text-slate-700 mt-1">
                    กรอกข้อมูลบัตรเครดิต/เดบิตของคุณให้ครบถ้วน
                  </p>

                  <div className="mt-4 grid gap-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-900">
                          เลขที่บัตร
                        </label>
                        <input
                          inputMode="numeric"
                          placeholder="4242 4242 4242 4242"
                          className="w-full rounded-lg border border-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          value={card.number}
                          onChange={(e) =>
                            setCard((c) => ({ ...c, number: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-900">
                          ชื่อบนบัตร
                        </label>
                        <input
                          placeholder="NAME SURNAME"
                          className="w-full rounded-lg border border-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          value={card.nameOnCard}
                          onChange={(e) =>
                            setCard((c) => ({
                              ...c,
                              nameOnCard: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-900">
                          วันหมดอายุ (MM/YY)
                        </label>
                        <input
                          placeholder="12/27"
                          className="w-full rounded-lg border border-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          value={card.exp}
                          onChange={(e) =>
                            setCard((c) => ({ ...c, exp: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-900">
                          CVC
                        </label>
                        <input
                          inputMode="numeric"
                          placeholder="123"
                          className="w-full rounded-lg border border-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          value={card.cvc}
                          onChange={(e) =>
                            setCard((c) => ({ ...c, cvc: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/booking/${carId}${tailQS}`}
                  className="px-4 py-2 rounded-lg border border-slate-400 bg-white hover:bg-slate-50 text-center"
                >
                  กลับไปแก้ไขข้อมูลการจอง
                </Link>
                <button
                  type="button"
                  onClick={() => alert("Demo: ดำเนินการชำระเงิน (mock)")}
                  className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-black"
                >
                  ดำเนินการชำระเงิน
                </button>
              </div>
            </div>
          </section>

          {/* ขวา */}
          <aside className="bg-white rounded-2xl shadow-lg border border-slate-300 p-6 md:p-8 h-fit">
            <h3 className="text-lg font-bold text-slate-900">สรุปรายการจอง</h3>
            <div className="mt-4 text-sm space-y-3">
              <div className="flex justify-between">
                <span>รถ</span>
                <span className="font-medium">{car?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>รับรถ</span>
                <span className="text-right">
                  {pickupLocation || "-"}
                  <br className="hidden sm:block" />
                  <span className="text-slate-700">{pickupAt || "-"}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>คืนรถ</span>
                <span className="text-right">
                  {dropoffLocation || "-"}
                  <br className="hidden sm:block" />
                  <span className="text-slate-700">{dropoffAt || "-"}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>ชื่อผู้จอง</span>
                <span className="font-medium">{name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>ติดต่อ</span>
                <span className="text-right">
                  {phone || "-"}
                  <br className="hidden sm:block" />
                  <span className="text-slate-700">{email || "-"}</span>
                </span>
              </div>

              <hr className="my-2 border-slate-300" />

              <div className="flex justify-between">
                <span>ราคารถ (x{dayCount})</span>
                <span>฿{f(base)}</span>
              </div>
              <div className="flex justify-between">
                <span>ตัวเลือกเสริม</span>
                <span>฿{f(extrasSum)}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold mt-2">
                <span>รวมทั้งหมด</span>
                <span>฿{f(total)}</span>
              </div>

              <hr className="my-2 border-slate-300" />

              <div className="text-xs text-slate-800">
                หมายเหตุ: {note || "-"}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
