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
  // ตัวอย่าง minimal เฉพาะส่วนประกอบ
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [deliveries] = useState([]);
  const [now] = useState(new Date());

  const todaySummary = { pickups: 0, returns: 0, pendingPay: 0 };
  const nextBookingMap = useMemo(() => ({}), []);
  const carMapById = useMemo(() => new Map(), []);
  const carMapByKey = useMemo(() => new Map(), []);

  const [carForm, setCarForm] = useState({
    name: "",
    brand: "",
    pricePerDay: "",
    imageData: "",
  });
  const onImageChange = (e) => {
    /* ย้ายโค้ดตรวจไฟล์/reader มาตรงนี้ */
  };
  const onAddCar = (e) => {
    e.preventDefault(); /* เพิ่มรถและ reset */
  };

  const getCarRowStatus = (car, bookings, now) => car.status; // ย้าย logic จริงจากหน้าหลักมาใส่

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Headers />
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-7xl grid grid-cols-12 gap-6 px-2 sm:px-4">
          <section className="col-span-12 lg:col-span-3">
            <EmployeeCard
              userId={localStorage.getItem("vrent_user_id") || ""}
            />
          </section>

          <section className="col-span-12 lg:col-span-9">
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
              onEdit={(c) => {
                /* เปิด modal แก้ไข */
              }}
              onDelete={(id) => {
                /* ลบรถ */
              }}
              getCarRowStatus={getCarRowStatus}
            />
          </section>

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

          <section className="col-span-12">
            <DeliveriesTable
              deliveries={[]}
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
