// app/admin/page.jsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Headers from "@/Components/HeaderAd";
import Footer from "@/Components/Footer";

import EmployeeCard from "@/Components/admin/EmployeeCard";
import AddCarCard from "@/Components/admin/AddCarCard";
import CarsTable from "@/Components/admin/CarsTable";
import BookingsTable from "@/Components/admin/BookingsTable";
import DeliveriesTable from "@/Components/admin/DeliveriesTable";
import { fmtDateTimeLocal, computeDays } from "@/Components/admin/utils";

/* ===== ERP CONFIG (ให้สอดคล้องกับ CarsTable) =====
   ใช้ endpoint edit_vehicles เพื่ออัปเดตสถานะรถใน ERP */
const ERP_EDIT_URL =
  "https://demo.erpeazy.com/api/method/erpnext.api.edit_vehicles";

/* ยิง API ไป ERP เพื่ออัปเดตสถานะรถ
   - carPlate: ป้ายทะเบียน (แนะนำส่งอันนี้เป็นคีย์หลัก)
   - statusEn: สถานะ EN ที่ ERP เข้าใจ ("In Use", "Available", "Maintenance", ...)
*/
async function updateCarStatusOnServer({ carPlate, statusEn }) {
  if (!carPlate || !statusEn) return;

  const fd = new FormData();
  fd.append("license_plate", carPlate);
  fd.append("status", statusEn);

  const res = await fetch(ERP_EDIT_URL, {
    method: "POST",
    body: fd,
    credentials: "include",
  });

  const text = await res.text();
  if (!res.ok) {
    // ส่ง error body กลับเพื่อดีบักง่าย
    throw new Error(text || `Update car status failed (${res.status})`);
  }
}

/* Map สถานะภาษาอังกฤษจาก ERP → ป้ายภาษาไทยสำหรับโชว์ในตาราง
   NOTE: ให้สอดคล้องกับ getCarRowStatus ใน CarsTable */
function mapStatusToThai(en) {
  const v = String(en || "").toLowerCase();
  if (v === "in use") return "ถูกยืมอยู่";
  if (v === "maintenance") return "ซ่อมแซม";
  return "ว่าง"; // available / undefined
}

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

  // ---- อ่าน userId จาก localStorage แบบปลอดภัย ----
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

    const newCar = {
      id: `tmp_${Date.now()}`,
      name,
      brand: carForm.brand?.trim() || "",
      price_per_day: price,
      image: carForm.imageData || "",
      status: "ว่าง",
      type: "",
      key: "",
      // stage / stageLabel จะถูกใส่ตอนมีการยืม/คืน
    };

    setCars((prev) => [newCar, ...prev]);
    setCarForm({ name: "", brand: "", pricePerDay: "", imageData: "" });
  };

  // ---------- helpers: match car ----------
  const carMatchKey = (name, plate) =>
    (plate || name || "").trim().toLowerCase();

  // ---------- เมื่อ “กำลังเช่า” → ยิง API ให้รถเป็น "In Use" แล้วอัปเดต UI ----------
  const handleConfirmPickup = async ({ carPlate = "", carName = "" }) => {
    const key = carMatchKey(carName, carPlate);

    try {
      await updateCarStatusOnServer({ carPlate, statusEn: "In Use" }); // ยิงจริงไป ERP
    } catch (e) {
      alert("อัปเดตสถานะรถในเซิร์ฟเวอร์ไม่สำเร็จ: " + (e?.message || e));
      return; // ถ้ายิงไม่ผ่าน ก็ไม่ปรับ UI เพื่อกันข้อมูลไม่ตรง
    }

    // อัปเดต UI ให้สะท้อนสถานะล่าสุดจาก ERP
    setCars((list) =>
      list.map((c) => {
        const k = carMatchKey(c.name, c.plate || c.licensePlate);
        if (k !== key) return c;
        const statusTh = mapStatusToThai("In Use");
        return {
          ...c,
          status: "In Use", // เก็บ EN ไว้เผื่อส่วนอื่นใช้
          stage: "borrowed",
          stageLabel: statusTh,
        };
      })
    );
  };

  // ---------- เมื่อเสร็จสิ้น → ยิง API ให้รถเป็น "Available" แล้วอัปเดต UI ----------
  const handleComplete = async ({ carPlate = "", carName = "" }) => {
    const key = carMatchKey(carName, carPlate);

    try {
      await updateCarStatusOnServer({ carPlate, statusEn: "Available" });
    } catch (e) {
      alert("อัปเดตสถานะรถในเซิร์ฟเวอร์ไม่สำเร็จ: " + (e?.message || e));
      return;
    }

    setCars((list) =>
      list.map((c) => {
        const k = carMatchKey(c.name, c.plate || c.licensePlate);
        if (k !== key) return c;
        const statusTh = mapStatusToThai("Available");
        return {
          ...c,
          status: "Available",
          stage: "available",
          stageLabel: statusTh, // “ว่าง”
        };
      })
    );
  };

  // ---- สถานะแถวรถ (ใช้ stageLabel ก่อน; ถ้าไม่มีให้ map จาก status EN → TH; สุดท้าย fallback "ว่าง") ----
  const getCarRowStatus = (car /*, bookings, now */) =>
    car?.stageLabel || mapStatusToThai(car?.status) || "ว่าง";

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
              onConfirmPickup={handleConfirmPickup} // เมื่อกำลังเช่า → รถเป็น In Use
              onComplete={handleComplete} // เสร็จสิ้น → รถกลับเป็น Available
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
