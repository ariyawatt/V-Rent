"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
import Image from "next/image";
import Link from "next/link";

const IMG_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "https://demo.erpeazy.com";
const PLACEHOLDER = "/noimage.jpg";

/* ---------- Utils ---------- */
function normalizeImage(u) {
  if (!u) return PLACEHOLDER;
  let s = String(u).trim();
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("/")) s = IMG_BASE.replace(/\/+$/, "") + s;
  if (!/^https?:\/\//i.test(s))
    s = IMG_BASE.replace(/\/+$/, "") + "/" + s.replace(/^\/+/, "");
  return encodeURI(s);
}
const slugify = (v) =>
  String(v ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

function buildQueryTail(obj) {
  const q = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "")
      q.set(k, String(v));
  });
  return q.toString() ? `?${q.toString()}` : "";
}

export default function CarBox() {
  const search = useSearchParams();

  const payload = useMemo(() => {
    const pickup_at = search.get("pickup_at") || "";
    const return_at = search.get("return_at") || "";
    const passengers = Number(search.get("passengers") || 1);
    const promo = search.get("promo") || "";
    const ftype = search.get("ftype") || "";
    return { pickup_at, return_at, passengers, promo, ftype };
  }, [search]);

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCars(Array.isArray(data?.message) ? data.message : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErr(String(e));
          setCars([]);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [payload]);

  return (
    <div className="flex min-h-screen flex-col">
      <Headers />
      <main className="flex-1">
        <section className="p-10 text-white bg-black">
          <div className="mb-6 rounded-xl border border-gray-600 bg-gray-900/60 p-4 text-sm">
            <div>รับ: {payload.pickup_at || "-"}</div>
            <div>คืน: {payload.return_at || "-"}</div>
            <div>ผู้โดยสาร: {payload.passengers}</div>
            {payload.ftype && <div>ประเภทรถ: {payload.ftype}</div>}
            {payload.promo && <div>โค้ดส่วนลด: {payload.promo}</div>}
          </div>

          {loading && <div className="text-gray-300">กำลังโหลดข้อมูล...</div>}
          {err && <div className="text-red-400 mb-4">โหลดล้มเหลว: {err}</div>}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {cars.length > 0
              ? cars.map((car, i) => {
                  // ❗ ใช้ docname จริงจาก ERP ก่อน (ERPNext มักใช้ 'name')
                  const rawKey =
                    car.name ??
                    car.id ??
                    car.vehicle_id ??
                    car.vehicle_name ??
                    String(i);

                  // query = payload + key=docname
                  const q = new URLSearchParams();
                  Object.entries(payload).forEach(([k, v]) => {
                    if (
                      v !== undefined &&
                      v !== null &&
                      String(v).trim() !== ""
                    )
                      q.set(k, String(v));
                  });
                  q.set("key", String(rawKey));

                  const href = `/cars/${slugify(rawKey)}?${q.toString()}`;

                  const img = normalizeImage(car.vehicle_image || car.image);
                  return (
                    <Link key={rawKey} href={href} className="block">
                      <div className="bg-white text-black rounded-xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-t-xl">
                          <Image
                            src={img}
                            alt={car.vehicle_name || car.name || "รถ"}
                            fill
                            className="object-cover"
                            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                          />
                          <span className="absolute left-2 top-2 rounded-full bg-black/75 text-white text-[11px] px-2 py-0.5">
                            {car.company || car.company_name || "ไม่ระบุบริษัท"}
                          </span>
                        </div>

                        <div className="p-3 space-y-1.5">
                          <h3 className="text-base font-semibold leading-snug">
                            {car.vehicle_name || car.name || "Vehicle"}
                          </h3>
                          <p className="text-sm leading-tight">
                            {(car.brand || "").toString()} •{" "}
                            {(car.ftype || car.type || "-").toString()}
                          </p>
                          <p className="text-sm font-bold mt-1">
                            {car.price_per_day ?? car.price ?? car.rate_per_day
                              ? `${Number(
                                  car.price_per_day ??
                                    car.price ??
                                    car.rate_per_day
                                ).toLocaleString()} บาท/วัน`
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })
              : !loading && <div className="text-gray-300">ไม่พบรถว่าง</div>}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
