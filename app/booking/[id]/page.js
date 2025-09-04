"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
import Image from "next/image";
import Link from "next/link";
import { getCarById } from "@/data/cars";

function toLocalDateTimeInputValue(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}
function diffDays(a, b) {
  const ms = new Date(b) - new Date(a);
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return Math.max(days, 1);
}
const toBool = (v) => String(v).toLowerCase() === "true";

export default function BookingPage() {
  // ✅ ใช้ hooks ของ Next.js 15
  const params = useParams();
  const search = useSearchParams();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const car = useMemo(() => getCarById(String(id)), [id]);

  const now = new Date();
  const defaultPick = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const defaultDrop = new Date(defaultPick.getTime() + 24 * 60 * 60 * 1000);

  // ✅ พรีฟิลจาก query
  const [form, setForm] = useState({
    pickupLocation: search.get("pickupLocation") || "",
    dropoffLocation: search.get("dropoffLocation") || "",
    pickupAt: search.get("pickupAt") || toLocalDateTimeInputValue(defaultPick),
    dropoffAt:
      search.get("dropoffAt") || toLocalDateTimeInputValue(defaultDrop),
    name: search.get("name") || "",
    phone: search.get("phone") || "",
    email: search.get("email") || "",
    extras: {
      childSeat: toBool(search.get("childSeat")),
      gps: toBool(search.get("gps")),
      fullInsurance: toBool(search.get("fullInsurance")),
    },
    note: search.get("note") || "",
  });

  const dayCount = useMemo(
    () => diffDays(form.pickupAt, form.dropoffAt),
    [form.pickupAt, form.dropoffAt]
  );
  const extrasPrice = useMemo(() => {
    let sum = 0;
    if (form.extras.childSeat) sum += 120;
    if (form.extras.gps) sum += 80;
    if (form.extras.fullInsurance) sum += 300;
    return sum * dayCount;
  }, [form.extras, dayCount]);
  const basePrice = (car?.pricePerDay || 0) * dayCount;
  const total = basePrice + extrasPrice;

  useEffect(() => {
    if (new Date(form.dropoffAt) <= new Date(form.pickupAt)) {
      const next = new Date(
        new Date(form.pickupAt).getTime() + 24 * 60 * 60 * 1000
      );
      setForm((f) => ({ ...f, dropoffAt: toLocalDateTimeInputValue(next) }));
    }
  }, [form.pickupAt]);

  if (!car) {
    return (
      <div className="min-h-screen bg-white">
        <Headers />
        <main className="max-w-4xl mx-auto p-6">ไม่พบรถคันนี้</main>
        <Footer />
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("extras.")) {
      const k = name.split(".")[1];
      setForm((f) => ({ ...f, extras: { ...f.extras, [k]: checked } }));
    } else {
      setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const minDateTime = toLocalDateTimeInputValue(now);

  const labelCls = "text-sm font-semibold text-slate-800";
  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black";
  const cardCls = "bg-white rounded-2xl shadow-lg border border-slate-200";

  // ✅ เก็บ query เดิมทั้งหมด ใช้ส่งต่อหรือลิงก์ย้อนกลับ
  const passthroughQS = search.toString();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Headers />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          {/* ซ้าย: ฟอร์มจอง */}
          <section className={`${cardCls} p-6 md:p-8`}>
            {/* Header รถ */}
            <div className="flex items-start gap-4">
              <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <Image
                  src={car.image}
                  alt={car.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {car.name}
                </h1>
                <p className="text-sm md:text-base text-slate-700">
                  {car.brand} • {car.type} • {car.year} • {car.transmission}
                </p>
                <p className="mt-1 text-sm">
                  ผู้ให้บริการ:{" "}
                  <Link
                    href={`/companies/${car.company.slug}`}
                    className="font-semibold underline underline-offset-4 hover:text-black"
                  >
                    {car.company.name}
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-6 md:mt-8 grid gap-6">
              {/* สถานที่ */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelCls}>สถานที่รับรถ</label>
                  <input
                    name="pickupLocation"
                    value={form.pickupLocation}
                    onChange={handleChange}
                    placeholder="เช่น สนามบินเชียงใหม่ (CNX)"
                    className={inputCls}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>สถานที่คืนรถ</label>
                  <input
                    name="dropoffLocation"
                    value={form.dropoffLocation}
                    onChange={handleChange}
                    placeholder="เช่น ตัวเมืองเชียงใหม่"
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              {/* เวลา */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelCls}>วัน–เวลารับรถ</label>
                  <input
                    type="datetime-local"
                    name="pickupAt"
                    value={form.pickupAt}
                    onChange={handleChange}
                    min={minDateTime}
                    className={inputCls}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>วัน–เวลาคืนรถ</label>
                  <input
                    type="datetime-local"
                    name="dropoffAt"
                    value={form.dropoffAt}
                    onChange={handleChange}
                    min={form.pickupAt}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              {/* ผู้ติดต่อ */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className={labelCls}>ชื่อ–นามสกุล</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="ชื่อผู้จอง"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>เบอร์โทร</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="080-000-0000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>อีเมล</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* ตัวเลือกเสริม */}
              <div className="space-y-2">
                <p className={labelCls}>ตัวเลือกเสริมต่อวัน</p>
                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      name="extras.childSeat"
                      checked={form.extras.childSeat}
                      onChange={handleChange}
                      className="h-4 w-4 accent-black"
                    />
                    Child Seat (+฿120/วัน)
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      name="extras.gps"
                      checked={form.extras.gps}
                      onChange={handleChange}
                      className="h-4 w-4 accent-black"
                    />
                    GPS (+฿80/วัน)
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      name="extras.fullInsurance"
                      checked={form.extras.fullInsurance}
                      onChange={handleChange}
                      className="h-4 w-4 accent-black"
                    />
                    Full Insurance (+฿300/วัน)
                  </label>
                </div>
              </div>

              {/* หมายเหตุ */}
              <div className="space-y-2">
                <label className={labelCls}>หมายเหตุเพิ่มเติม</label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows={4}
                  className={inputCls}
                  placeholder="เช่น ต้องการที่นั่งเด็ก 1 ตัว รับรถหน้าประตู 3"
                />
              </div>

              {/* ปุ่ม */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href={`/cars/${car.id}${
                    passthroughQS ? `?${passthroughQS}` : ""
                  }`}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-center"
                >
                  กลับไปหน้ารถ
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const qp = new URLSearchParams({
                      pickupLocation: form.pickupLocation,
                      dropoffLocation: form.dropoffLocation,
                      pickupAt: form.pickupAt,
                      dropoffAt: form.dropoffAt,
                      name: form.name,
                      phone: form.phone,
                      email: form.email,
                      childSeat: String(form.extras.childSeat),
                      gps: String(form.extras.gps),
                      fullInsurance: String(form.extras.fullInsurance),
                      note: form.note,
                      carId: String(car.id),
                    }).toString();
                    window.location.href = `/payment/choose?${qp}`;
                  }}
                  className="px-5 py-2.5 rounded-lg bg-black text-white font-semibold hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black text-center"
                >
                  ไปหน้า Choose payment →
                </button>
              </div>
            </div>
          </section>

          {/* ขวา: สรุปรายการ */}
          <aside className={`${cardCls} p-6 md:p-8 h-fit`}>
            <h3 className="text-lg font-bold">สรุปรายการจอง</h3>
            <div className="mt-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span>รถ</span>
                <span className="font-medium">{car.name}</span>
              </div>
              <div className="flex justify-between">
                <span>ระยะเวลา</span>
                <span className="font-medium">{dayCount} วัน</span>
              </div>
              <div className="flex justify-between">
                <span>ราคา/วัน</span>
                <span>฿{car.pricePerDay.toLocaleString()}</span>
              </div>
              <hr className="my-3 border-slate-200" />
              <div className="flex justify-between">
                <span>ราคารถ (x{dayCount})</span>
                <span>฿{basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>ราคาตัวเลือก (รวม)</span>
                <span>฿{extrasPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold mt-2">
                <span>รวมทั้งหมด</span>
                <span>฿{total.toLocaleString()}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
