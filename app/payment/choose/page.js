"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
import { getCarById } from "@/data/cars";

/* ---------- helpers ---------- */
const getBool = (v) => String(v ?? "").toLowerCase() === "true";
const fmt = (n) => Number(n || 0).toLocaleString();
const pick = (sp, k, fb = "") => sp.get(k) ?? fb;

// เลือกวันที่แบบปลอดภัย: ให้ความสำคัญกับ ISO ก่อน (pickup_at/return_at)
// ตกมาใช้ pickupAt/dropoffAt (local input) ถ้าไม่มี
function chooseDateStrings(sp) {
  const isoPick = pick(sp, "pickup_at", "");
  const isoDrop = pick(sp, "return_at", "");
  const localPick = pick(sp, "pickupAt", "");
  const localDrop = pick(sp, "dropoffAt", "");

  // แสดงใน UI: โชว์ local ถ้ามี, ไม่งั้น format จาก ISO → local
  const toLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return {
    // ใช้สำหรับแสดง
    displayPick: localPick || toLocal(isoPick),
    displayDrop: localDrop || toLocal(isoDrop),
    // ใช้สำหรับคำนวณ
    calcPick: isoPick || localPick || "",
    calcDrop: isoDrop || localDrop || "",
  };
}

export default function ChoosePayment() {
  const sp = useSearchParams();

  /* ---------- รับพารามิเตอร์ทั้งหมด ---------- */
  // รถ + บริษัท + ราคา
  const carId = pick(sp, "carId");
  const carName = pick(sp, "carName");
  const carBrand = pick(sp, "carBrand");
  const carType = pick(sp, "carType");
  const carYear = pick(sp, "carYear");
  const carTransmission = pick(sp, "carTransmission");
  const carSeats = pick(sp, "carSeats");
  const carFuel = pick(sp, "carFuel");
  const pricePerDay = Number(pick(sp, "pricePerDay") || 0);
  const companyName = pick(sp, "companyName");
  const companySlug = pick(sp, "companySlug");
  const carImage = pick(sp, "carImage");

  // สถานที่/เวลา/ผู้ติดต่อ
  const pickupLocation = pick(sp, "pickupLocation");
  const dropoffLocation = pick(sp, "dropoffLocation");
  const { displayPick, displayDrop, calcPick, calcDrop } =
    chooseDateStrings(sp);
  const name = pick(sp, "name");
  const phone = pick(sp, "phone");
  const email = pick(sp, "email");
  const note = pick(sp, "note");

  // ตัวเลือกเสริม
  const extras = {
    childSeat: getBool(pick(sp, "childSeat")),
    gps: getBool(pick(sp, "gps")),
    fullInsurance: getBool(pick(sp, "fullInsurance")),
  };

  // flags อื่นๆจากหน้าแรก
  const passengers = pick(sp, "passengers");
  const promo = pick(sp, "promo");
  const ftype = pick(sp, "ftype");
  const key = pick(sp, "key");
  const isAdmin = getBool(pick(sp, "isAdmin"));

  // ถ้าข้อมูลรถใน query ไม่ครบ ลอง fallback จาก data/cars
  const carFallback = useMemo(() => getCarById(String(carId || "")), [carId]);
  const car = useMemo(() => {
    const fromQueryHasCar =
      carName || carBrand || carType || pricePerDay || carImage || companyName;
    if (fromQueryHasCar) {
      return {
        id: carId,
        name: carName || carFallback?.name || "Vehicle",
        brand: carBrand || carFallback?.brand || "",
        type: carType || carFallback?.type || "",
        year: carYear || carFallback?.year || "",
        transmission: carTransmission || carFallback?.transmission || "",
        seats: carSeats || carFallback?.seats || "",
        fuel: carFuel || carFallback?.fuel || "",
        pricePerDay: Number(pricePerDay || carFallback?.pricePerDay || 0),
        company: {
          name: companyName || carFallback?.company?.name || "V-Rent Partner",
          slug:
            companySlug ||
            carFallback?.company?.slug ||
            (companyName || "partner").toLowerCase().replace(/\s+/g, "-"),
        },
        image: carImage || carFallback?.image || "/noimage.jpg",
        description: carFallback?.description || "",
      };
    }
    return (
      carFallback || {
        id: carId,
        name: "Vehicle",
        brand: "",
        type: "",
        year: "",
        transmission: "",
        seats: "",
        fuel: "",
        pricePerDay: 0,
        company: { name: "V-Rent Partner", slug: "partner" },
        image: "/noimage.jpg",
        description: "",
      }
    );
  }, [
    carId,
    carName,
    carBrand,
    carType,
    carYear,
    carTransmission,
    carSeats,
    carFuel,
    pricePerDay,
    companyName,
    companySlug,
    carImage,
    carFallback,
  ]);

  /* ---------- คำนวณราคา/จำนวนวัน ---------- */
  const dayCount = useMemo(() => {
    if (!calcPick || !calcDrop) return 1;
    const A = new Date(calcPick);
    const B = new Date(calcDrop);
    const diff = Math.ceil((B.getTime() - A.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  }, [calcPick, calcDrop]);

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

  // เก็บ query ทั้งชุดไว้ส่งกลับ/ต่อไป
  const tailQS = useMemo(() => {
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
  }, [sp]);

  // สร้างอ็อบเจ็กต์สำหรับ Debug panel (ดูว่ามีอะไรส่งมาบ้าง)
  const debugAllParams = useMemo(() => {
    const o = {};
    for (const [k, v] of sp.entries()) o[k] = v;
    // เพิ่มที่คำนวณ/สรุปเพื่อสะดวกเวลาเทส
    o.__derived__ = {
      dayCount,
      base,
      extrasSum,
      total,
      displayPick,
      displayDrop,
      isAdmin,
    };
    return o;
  }, [sp, dayCount, base, extrasSum, total, displayPick, displayDrop, isAdmin]);

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
                    <div className="h-44 w-44 rounded-lg border border-slate-300 grid place-items-center overflow-hidden bg-white">
                      <img
                        src="https://commons.wikimedia.org/wiki/Special:FilePath/Rickrolling_QR_code.png"
                        alt="PromptPay QR"
                        className="h-44 w-44 object-contain"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <div className="text-sm text-slate-700">
                        ยอดที่ต้องชำระ
                      </div>
                      <div className="text-4xl font-extrabold tracking-tight text-slate-900">
                        ฿{fmt(total)}
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
                  href={`/booking/${encodeURIComponent(carId || "")}${tailQS}`}
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

              {/* Debug panel: กดเพื่อดูพารามิเตอร์ทั้งหมด */}
              {/* <details className="mt-6 rounded-lg border border-slate-300 p-4 bg-slate-50">
                <summary className="cursor-pointer font-semibold text-slate-900">
                  Debug: ข้อมูลที่ส่งมาหน้านี้ทั้งหมด
                </summary>
                <pre className="mt-3 text-xs overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(debugAllParams, null, 2)}
                </pre>
              </details> */}
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
                <span>ผู้ให้บริการ</span>
                <span className="font-medium">
                  {car?.company?.name || companyName || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>รับรถ</span>
                <span className="text-right">
                  {pickupLocation || "-"}
                  <br className="hidden sm:block" />
                  <span className="text-slate-700">{displayPick || "-"}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>คืนรถ</span>
                <span className="text-right">
                  {dropoffLocation || "-"}
                  <br className="hidden sm:block" />
                  <span className="text-slate-700">{displayDrop || "-"}</span>
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
                <span>฿{fmt(base)}</span>
              </div>
              <div className="flex justify-between">
                <span>ตัวเลือกเสริม</span>
                <span>฿{fmt(extrasSum)}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold mt-2">
                <span>รวมทั้งหมด</span>
                <span>฿{fmt(total)}</span>
              </div>

              <hr className="my-2 border-slate-300" />

              <div className="text-xs text-slate-800">
                หมายเหตุ: {note || "-"}
              </div>

              {isAdmin ? (
                <div className="mt-2 text-xs font-semibold text-green-700">
                  (Admin mode)
                </div>
              ) : null}
              {passengers || promo || ftype || key ? (
                <div className="mt-2 text-xs text-slate-700 space-y-1">
                  {passengers ? <div>ผู้โดยสาร: {passengers}</div> : null}
                  {ftype ? <div>ประเภทรถ: {ftype}</div> : null}
                  {promo ? <div>โค้ดส่วนลด: {promo}</div> : null}
                  {key ? <div>key: {key}</div> : null}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
