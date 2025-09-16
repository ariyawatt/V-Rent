// app/admin/page.jsx
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Headers from "@/Components/HeaderAd";
import Footer from "@/Components/Footer";

import EmployeeCard from "@/Components/admin/EmployeeCard";
import AddCarCard from "@/Components/admin/AddCarCard";
import CarsTable from "@/Components/admin/CarsTable";
import BookingsTable from "@/Components/admin/BookingsTable";
import DeliveriesTable from "@/Components/admin/DeliveriesTable";
import { fmtDateTimeLocal, computeDays } from "@/Components/admin/utils";

// …(state และฟังก์ชันเดิมๆ เกี่ยวกับ cars / bookings / deliveries / todaySummary / nextBookingMap ฯลฯ ใส่ไว้ที่นี่)…

export default function AdminPage() {
  // ---- data หลัก (ตัวอย่าง minimal) ----
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [deliveries] = useState([]);
  const [now] = useState(new Date());

  const todaySummary = { pickups: 0, returns: 0, pendingPay: 0 };
  const nextBookingMap = useMemo(() => ({}), []);
  const carMapById = useMemo(() => new Map(), []);
  const carMapByKey = useMemo(() => new Map(), []);

  // ---- อ่าน userId จาก localStorage แบบปลอดภัย (ไม่อ่านตรงๆ ใน render) ----
  const [userId, setUserId] = useState("");
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        setUserId(localStorage.getItem("vrent_user_id") || "");
      }
    } catch {}
  }, []);

  // ---- ฟอร์มเพิ่มรถ ----
  const [carForm, setCarForm] = useState({
    name: "",
    brand: "",
    pricePerDay: "",
    imageData: "", // base64 preview
  });

  const onImageChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    const MAX_MB = 3;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`ไฟล์ใหญ่เกิน ${MAX_MB}MB`);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCarForm((f) => ({ ...f, imageData: reader.result || "" }));
    };
    reader.readAsDataURL(file);
  };

  const onAddCar = (e) => {
    e.preventDefault();

    const name = carForm.name?.trim();
    if (!name) {
      alert("กรุณากรอกชื่อรถ");
      return;
    }

    const price = Number(carForm.pricePerDay || 0) || 0;

    // โครงสร้างตัวอย่างให้ตารางโชว์ได้ (ปรับตามสคีมจริงของคุณได้)
    const newCar = {
      id: `tmp_${Date.now()}`,
      name,
      brand: carForm.brand?.trim() || "",
      price_per_day: price,
      image: carForm.imageData || "",
      status: "ว่าง",
      type: "",
      key: "",
    };

    setCars((prev) => [newCar, ...prev]);
    setCarForm({ name: "", brand: "", pricePerDay: "", imageData: "" });
  };

  // ---- สถานะแถวรถ (ใส่ลอจิกจริงของคุณได้) ----
  const getCarRowStatus = (car, bookings, now) => car?.status || "ว่าง";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Headers />
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-7xl grid grid-cols-12 gap-6 px-2 sm:px-4">
          {/* Employee */}
          <section className="col-span-12 lg:col-span-3">
            <EmployeeCard userId={userId} />
          </section>

          {/* Add Car */}
          <section className="col-span-12 lg:col-span-9">
            <AddCarCard
              form={carForm}
              setForm={setCarForm}
              onAddCar={onAddCar}
              onImageChange={onImageChange}
            />
          </section>

          {/* Cars Table */}
          <section className="col-span-12">
            <CarsTable
              cars={cars}
              bookings={bookings}
              now={now}
              nextBookingMap={nextBookingMap}
              onEdit={(c) => {
                /* เปิด modal แก้ไข */
              }}
              onDelete={(id) => {
                /* ลบรถ */
              }}
              getCarRowStatus={getCarRowStatus}
            />
          </section>

          {/* Bookings Table */}
          <section className="col-span-12">
            <BookingsTable
              bookings={bookings}
              carMapById={carMapById}
              carMapByKey={carMapByKey}
              now={now}
              onOpenDetail={(b) => {
                /* modal รายละเอียด */
              }}
              onMarkPaid={(b) => {
                /* มาร์คชำระ */
              }}
              onConfirmPickup={(b) => {
                /* รับรถ */
              }}
              onComplete={(b) => {
                /* เสร็จสิ้น */
              }}
            />
          </section>

          {/* Deliveries Table */}
          <section className="col-span-12">
            <DeliveriesTable
              deliveries={deliveries}
              onOpen={(d) => {
                /* modal */
              }}
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
