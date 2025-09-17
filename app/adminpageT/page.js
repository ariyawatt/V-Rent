// app/admin/page.jsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Headers from "@/Components/HeaderAd";
import Footer from "@/Components/Footer";

import EmployeeCard from "@/Components/admin/EmployeeCard";
import AddCarCard from "@/Components/admin/AddCarCard";
import CarsTable from "@/Components/admin/CarsTable";
import BookingsTable from "@/Components/admin/BookingsTable";
import DeliveriesTable from "@/Components/admin/DeliveriesTable";

/* แปลง EN → TH สำหรับสถานะรถ (ไว้แสดงในตาราง) */
const mapStatusToThai = (en) => {
  const v = String(en || "").toLowerCase();
  if (v === "in use") return "ถูกยืมอยู่";
  if (v === "maintenance") return "ซ่อมแซม";
  return "ว่าง";
};

/* สร้าง key เทียบรถจาก name/plate */
const carMatchKey = (name, plate) =>
  String(plate || name || "")
    .trim()
    .toLowerCase();

export default function AdminPage() {
  const [cars, setCars] = useState([]);
  const [bookings] = useState([]);
  const [deliveries] = useState([]);
  const [now] = useState(new Date());

  const nextBookingMap = useMemo(() => ({}), []);
  const carMapById = useMemo(() => new Map(), []);
  const carMapByKey = useMemo(() => new Map(), []);

  const [userId, setUserId] = useState("");
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        setUserId(localStorage.getItem("vrent_user_id") || "");
      }
    } catch {}
  }, []);

  // ฟอร์มเพิ่มรถ (เดิม)
  const [carForm, setCarForm] = useState({
    name: "",
    brand: "",
    pricePerDay: "",
    imageData: "",
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
    reader.onload = () =>
      setCarForm((f) => ({ ...f, imageData: reader.result || "" }));
    reader.readAsDataURL(file);
  };

  const onAddCar = (e) => {
    e.preventDefault();
    const name = carForm.name?.trim();
    if (!name) return alert("กรุณากรอกชื่อรถ");
    const price = Number(carForm.pricePerDay || 0) || 0;
    const newCar = {
      id: `tmp_${Date.now()}`,
      name,
      brand: carForm.brand?.trim() || "",
      price_per_day: price,
      pricePerDay: price,
      image: carForm.imageData || "",
      status: "Available",
      type: "",
      key: "",
    };
    setCars((prev) => [newCar, ...prev]);
    setCarForm({ name: "", brand: "", pricePerDay: "", imageData: "" });
  };

  /* เมื่อ booking เข้าสู่ “กำลังเช่า” → ปรับ UI ของรถเป็น “ถูกยืมอยู่”
     (การยิง API ไปเปลี่ยน stage ของรถ จะทำใน BookingsTable) */
  const handleConfirmPickup = ({ carPlate = "", carName = "" }) => {
    const key = carMatchKey(carName, carPlate);
    setCars((list) =>
      list.map((c) => {
        const k = carMatchKey(c.name, c.plate || c.licensePlate);
        if (k !== key) return c;
        return {
          ...c,
          status: "In Use",
          stage: "borrowed",
          stageLabel: mapStatusToThai("In Use"),
        };
      })
    );
  };

  const handleComplete = ({ carPlate = "", carName = "" }) => {
    const key = carMatchKey(carName, carPlate);
    setCars((list) =>
      list.map((c) => {
        const k = carMatchKey(c.name, c.plate || c.licensePlate);
        if (k !== key) return c;
        return {
          ...c,
          status: "Available",
          stage: "available",
          stageLabel: mapStatusToThai("Available"),
        };
      })
    );
  };

  const getCarRowStatus = (car) =>
    car?.stageLabel || mapStatusToThai(car?.status) || "ว่าง";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Headers />
      {/* ลด margin ซ้ายขวาเล็กน้อย */}
      <main className="flex-1 px-2 md:px-4 py-6">
        {/* เพิ่มความกว้างรวม + ลดช่องว่างภายใน */}
        <div className="mx-auto max-w-screen-2xl grid grid-cols-12 gap-4 md:gap-5 lg:gap-6 px-0 sm:px-2">
          {/* ทำให้การ์ดพนักงานกว้างขึ้นบนจอใหญ่ */}
          <section className="col-span-12 lg:col-span-4 xl:col-span-3">
            <EmployeeCard userId={userId} />
          </section>

          {/* ฝั่งเพิ่มรถ ลดลงให้พอดีกับฝั่งซ้ายที่ขยาย */}
          <section className="col-span-12 lg:col-span-8 xl:col-span-9">
            <AddCarCard
              form={carForm}
              setForm={setCarForm}
              onAddCar={onAddCar}
              onImageChange={onImageChange}
            />
          </section>

          <section className="col-span-12">
            <CarsTable
              cars={cars}
              bookings={bookings}
              now={now}
              nextBookingMap={nextBookingMap}
              onEdit={() => {}}
              onDelete={() => {}}
              getCarRowStatus={getCarRowStatus}
            />
          </section>

          <section className="col-span-12">
            <BookingsTable
              bookings={bookings}
              carMapById={carMapById}
              carMapByKey={carMapByKey}
              onOpenDetail={() => {}}
              onConfirmPickup={handleConfirmPickup}
              onComplete={handleComplete}
            />
          </section>

          <section className="col-span-12">
            <DeliveriesTable />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
