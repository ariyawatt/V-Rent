"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const carTypeToFType = {
  any: undefined,
  eco: "ECO",
  sedan: "SEDAN",
  suv: "SUV",
  pickup: "PICKUP",
  van: "VAN",
};

// รวม date + time เป็น ISO (ตามเวลาท้องถิ่นผู้ใช้)
function toLocalISO(dateStr, timeStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh = 0, mm = 0] = (timeStr || "00:00").split(":").map(Number);
  const dt = new Date(y, (m || 1) - 1, d, hh, mm, 0, 0);
  return dt.toISOString();
}

export default function BookingBox({ onSearch }) {
  const [form, setForm] = useState({
    pickupLocation: "",
    returnSame: true,
    dropoffLocation: "",
    pickupDate: "",
    pickupTime: "",
    returnDate: "",
    returnTime: "",
    carType: "any",
    passengers: 1,
    promo: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const canSubmit = useMemo(() => {
    const required = [
      "pickupLocation",
      "pickupDate",
      "pickupTime",
      "returnDate",
      "returnTime",
    ];
    return required.every((k) => !!form[k]);
  }, [form]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1) ตรวจฟิลด์ที่จำเป็น
    const required = [
      "pickupLocation",
      "pickupDate",
      "pickupTime",
      "returnDate",
      "returnTime",
    ];
    const missing = required.filter((k) => !form[k]);
    if (missing.length) {
      alert("กรุณากรอกข้อมูลให้ครบ: " + missing.join(", "));
      return;
    }

    // 2) ตรวจวัน-เวลาคืนต้องหลังวัน-เวลารับ
    const pickupISO = toLocalISO(form.pickupDate, form.pickupTime);
    const returnISO = toLocalISO(form.returnDate, form.returnTime);
    if (new Date(returnISO) <= new Date(pickupISO)) {
      alert("เวลาคืนรถต้องช้ากว่าเวลารับรถ");
      return;
    }

    // 3) เตรียม payload สำหรับ backend / ERP
    const payload = {
      // ฟิลด์จาก UI
      pickup_location: form.pickupLocation,
      dropoff_location: form.returnSame
        ? form.pickupLocation
        : form.dropoffLocation || "",
      pickup_at: pickupISO, // ISO string
      return_at: returnISO, // ISO string
      passengers: Number(form.passengers) || 1,
      promo: form.promo?.trim() || "",

      // แม็ป carType → ftype (ถ้า any จะไม่ส่ง ftype)
      ...(carTypeToFType[form.carType]
        ? { ftype: carTypeToFType[form.carType] }
        : {}),

      // เก็บค่าดิบไว้ด้วย เผื่อฝั่งผลลัพธ์อยากใช้
      _raw: { ...form },
    };

    // 4) ยิงออกไปให้ผู้ปกครอง (Home) จัดการ fetch
    try {
      onSearch?.(payload);
    } catch (err) {
      console.error("onSearch error:", err);
    }

    console.log("Booking search payload:", payload);
  };

  return (
    <section className="w-full flex justify-center text-black overflow-x-hidden">
      <div className="w-full max-w-[640px] md:max-w-6xl px-4 md:px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full bg-white/95 backdrop-blur rounded-xl md:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-5 md:p-8 overflow-hidden"
        >
          {/* Header */}
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight">
              ค้นหายานพาหนะ
            </h2>
            <Link href="/help" className="text-xs sm:text-sm hover:underline">
              ต้องการความช่วยเหลือ?
            </Link>
          </div>

          {/* Grid Fields */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-w-0">
            {/* Pickup Location */}
            <div className="md:col-span-4 min-w-0">
              <label className="block text-sm font-medium mb-1">
                จุดรับรถ *
              </label>
              <input
                type="text"
                name="pickupLocation"
                placeholder="เช่น สนามบินดอนเมือง"
                value={form.pickupLocation}
                onChange={handleChange}
                className="w-full max-w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2"
                required
              />
              <label className="mt-2 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="returnSame"
                  checked={form.returnSame}
                  onChange={handleChange}
                  className="rounded border-gray-500 text-black focus:ring-black"
                />
                คืนรถที่จุดเดิม
              </label>
            </div>

            {/* Drop-off Location */}
            <div className="md:col-span-4 min-w-0">
              <label className="block text-sm font-medium mb-1">
                จุดคืนรถ {form.returnSame ? "(ล็อกเป็นจุดรับรถ)" : ""}
              </label>
              <input
                type="text"
                name="dropoffLocation"
                placeholder="เช่น สาขาสยามพารากอน"
                value={
                  form.returnSame ? form.pickupLocation : form.dropoffLocation
                }
                onChange={handleChange}
                disabled={form.returnSame}
                className={`w-full max-w-full rounded-lg md:rounded-xl px-3 py-2 border ${
                  form.returnSame
                    ? "bg-gray-100 border-gray-300 text-gray-500"
                    : "border-gray-500 focus:border-black focus:ring-black"
                }`}
              />
            </div>

            {/* Car Type */}
            <div className="md:col-span-4 min-w-0">
              <label className="block text-sm font-medium mb-1">ประเภทรถ</label>
              <select
                name="carType"
                value={form.carType}
                onChange={handleChange}
                className="w-full max-w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2 appearance-none"
              >
                <option value="any">ไม่ระบุ</option>
                <option value="eco">Eco / เล็ก</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="pickup">กระบะ</option>
                <option value="van">Van</option>
              </select>
            </div>

            {/* Pickup Date & Time */}
            <div className="md:col-span-3 min-w-0">
              <label className="block text-sm font-medium mb-1">
                วันที่รับรถ *
              </label>
              <input
                type="date"
                name="pickupDate"
                value={form.pickupDate}
                onChange={handleChange}
                className="w-full max-w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2"
                required
              />
            </div>
            <div className="md:col-span-3 min-w-0">
              <label className="block text-sm font-medium mb-1">
                เวลารับรถ *
              </label>
              <input
                type="time"
                name="pickupTime"
                value={form.pickupTime}
                onChange={handleChange}
                className="w-full max-w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2"
                required
              />
            </div>

            {/* Return Date & Time */}
            <div className="md:col-span-3 min-w-0">
              <label className="block text-sm font-medium mb-1">
                วันที่คืนรถ *
              </label>
              <input
                type="date"
                name="returnDate"
                value={form.returnDate}
                onChange={handleChange}
                className="w-full max-w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2"
                required
              />
            </div>
            <div className="md:col-span-3 min-w-0">
              <label className="block text-sm font-medium mb-1">
                เวลาคืนรถ *
              </label>
              <input
                type="time"
                name="returnTime"
                value={form.returnTime}
                onChange={handleChange}
                className="w-full max-w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2"
                required
              />
            </div>

            {/* Passengers */}
            <div className="md:col-span-3 min-w-0">
              <label className="block text-sm font-medium mb-1">
                ผู้โดยสาร
              </label>
              <select
                name="passengers"
                value={form.passengers}
                onChange={handleChange}
                className="w-full max-w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2 appearance-none"
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Promo */}
            <div className="md:col-span-6 min-w-0">
              <label className="block text-sm font-medium mb-1">
                โค้ดส่วนลด (ถ้ามี)
              </label>
              <input
                type="text"
                name="promo"
                placeholder="เช่น VRENT10"
                value={form.promo}
                onChange={handleChange}
                className="w-full max-w-full rounded-lg md:rounded-xl border border-gray-500 focus:border-black focus:ring-black px-3 py-2"
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-12 flex justify-end">
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 md:px-6 py-3 rounded-xl md:rounded-2xl bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed active:scale-[.99] transition"
                title={!canSubmit ? "กรอกข้อมูลที่จำเป็นให้ครบก่อน" : ""}
              >
                ค้นหารถว่าง
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M13.5 4.5a.75.75 0 0 1 .75-.75h5.25a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V6.31l-7.22 7.22a.75.75 0 1 1-1.06-1.06l7.22-7.22h-3.44a.75.75 0 0 1-.75-.75Z" />
                  <path d="M3.75 5.25A2.25 2.25 0 0 1 6 3h5.25a.75.75 0 0 1 0 1.5H6A.75.75 0 0 0 5.25 5.25v12A.75.75 0 0 0 6 18h12a.75.75 0 0 0 .75-.75V12a.75.75 0 0 1 1.5 0v5.25A2.25 2.25 0 0 1 18 19.5H6A2.25 2.25 0 0 1 3.75 17.25v-12Z" />
                </svg>
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs">
            *
            กรุณากรอกข้อมูลที่จำเป็นให้ครบเพื่อค้นหารถว่างตามช่วงเวลาที่คุณต้องการ
          </p>
        </form>
      </div>
    </section>
  );
}
