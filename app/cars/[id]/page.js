"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
import Image from "next/image";
import Link from "next/link";
import { getCarById } from "@/data/cars";

export default function CarInfo() {
  const [open, setOpen] = useState(false);

  // ✅ Next.js 15: ใช้ useParams แทนการรับ { params } ตรง ๆ
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  // ✅ รับ query และส่งต่อได้
  const search = useSearchParams();
  const queryTail = search.toString() ? `?${search.toString()}` : "";

  // หารถจาก id (memo กัน re-render)
  const car = useMemo(() => getCarById(String(id)), [id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fallback ถ้าไม่พบรถ
  if (!car) {
    return (
      <div className="min-h-screen bg-white">
        <Headers />
        <main className="p-10">ไม่พบรถคันนี้</main>
        <Footer />
      </div>
    );
  }

  const companyHref = `/companies/${car.company.slug}`;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Headers />

      <main className="flex-grow bg-gray-100 grid content-center">
        <div className="w-full bg-white rounded-none shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* รูปซ้าย (กดเพื่อเปิดเต็มจอ) */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative w-full h-[42vh] md:h-[70vh] cursor-zoom-in group"
            aria-label="ดูรูปแบบเต็มจอ"
          >
            {/* ป้ายบริษัท (คลิกได้) */}
            <Link
              href={companyHref}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-3 top-3 z-10 rounded-full bg-black/75 text-white text-xs px-2 py-1 hover:bg-black/85 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              {car.company.name}
            </Link>

            <Image
              src={car.image}
              alt={car.name}
              fill
              className="object-cover"
              priority
            />
            <span className="absolute right-3 bottom-3 rounded-md bg-black/60 text-white px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition">
              ดูแบบเต็มจอ
            </span>
          </button>

          {/* ข้อมูลขวา */}
          <div className="flex h-full flex-col justify-between p-6 md:p-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black">
                {car.name}
              </h1>
              <p className="text-gray-700">
                {car.brand} • {car.type}
              </p>

              <p className="text-2xl font-semibold text-black mt-4 mb-6">
                {car.pricePerDay.toLocaleString()} บาท/วัน
              </p>

              <ul className="space-y-2 text-gray-800 mb-6">
                <li>ปี: {car.year}</li>
                <li>จำนวนที่นั่ง: {car.seats}</li>
                <li>ระบบเกียร์: {car.transmission}</li>
                <li>เชื้อเพลิง: {car.fuel}</li>
              </ul>

              <p className="text-gray-700">{car.description}</p>
            </div>

            <div className="mt-8">
              <Link
                href={`/booking/${car.id}${queryTail}`} // ✅ ส่ง query ต่อไปด้วย
                className="inline-block w-full md:w-auto px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition text-center"
              >
                จองรถคันนี้
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Lightbox / Fullscreen */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-zoom-out"
          onClick={() => setOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            ×
          </button>

          <div className="relative w-[92vw] h-[82vh]">
            <Image
              src={car.image}
              alt={car.name}
              fill
              className="object-contain select-none"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
