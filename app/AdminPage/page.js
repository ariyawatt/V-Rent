// app/admin/page.js
"use client";

import { useMemo, useState } from "react";
import Headers from "@/Components/HeaderAd";
import Footer from "@/Components/Footer";

/* ───────────── Utilities ───────────── */
const cls = (...a) => a.filter(Boolean).join(" ");
const fmtBaht = (n) => Number(n || 0).toLocaleString("th-TH");
const toISO = (s) => (s ? new Date(s).toISOString() : "");
const sameDate = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function diffDays(pickupISO, returnISO) {
  try {
    const a = new Date(pickupISO);
    const b = new Date(returnISO);
    const d = Math.ceil((b - a) / (24 * 60 * 60 * 1000));
    return Math.max(d, 1);
  } catch {
    return 1;
  }
}
const sumExtras = (extras = []) =>
  extras.reduce((t, e) => t + Number(e?.price || 0), 0);

function computeTotal(bk) {
  const days = diffDays(bk.pickupTime, bk.returnTime);
  const base = Number(bk.pricePerDay || 0) * days;
  const extras = sumExtras(bk.extras);
  const discount = Number(bk.discount || 0);
  return {
    days,
    base,
    extras,
    discount,
    total: Math.max(base + extras - discount, 0),
  };
}

function fmtDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${dd} ${hh}:${mm}`;
}

/* ───────────── Badges ───────────── */
const StatusBadge = ({ value }) => {
  const isAvail = value === "ว่าง";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        isAvail ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {value}
    </span>
  );
};
const BookingBadge = ({ value }) => {
  const map =
    value === "ยืนยันแล้ว"
      ? "bg-emerald-100 text-emerald-800"
      : value === "รอชำระ"
      ? "bg-amber-100 text-amber-800"
      : value === "ยกเลิก"
      ? "bg-gray-200 text-gray-700"
      : "bg-gray-100 text-gray-700";
  return (
    <span
      className={cls(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        map
      )}
    >
      {value}
    </span>
  );
};
const PayBadge = ({ value }) => {
  const map =
    value === "ชำระแล้ว"
      ? "bg-emerald-100 text-emerald-800"
      : value === "รอชำระ"
      ? "bg-rose-100 text-rose-800"
      : "bg-gray-100 text-gray-700";
  return (
    <span
      className={cls(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        map
      )}
    >
      {value}
    </span>
  );
};

/* ───────────── Page ───────────── */
export default function AdminPage() {
  /* ---- Cars ---- */
  const initialCars = useMemo(
    () => [
      {
        id: 1,
        name: "Toyota Corolla Cross",
        brand: "Toyota",
        type: "SUV",
        pricePerDay: 1800,
        status: "ว่าง",
        transmission: "อัตโนมัติ",
        licensePlate: "1กข 1234",
        seats: 5,
        fuel: "เบนซิน",
        year: 2023,
        description: "SUV ขับง่าย ประหยัด",
      },
      {
        id: 2,
        name: "Mitsubishi Evolution",
        brand: "Mitsubishi",
        type: "JDM",
        pricePerDay: 1500,
        status: "ถูกยืมอยู่",
        transmission: "ธรรมดา",
        licensePlate: "2ขค 5678",
        seats: 5,
        fuel: "เบนซิน",
        year: 2006,
        description: "สปอร์ต 4 ประตู",
      },
      {
        id: 3,
        name: "Nissan Skyline R34",
        brand: "Nissan",
        type: "JDM",
        pricePerDay: 2000,
        status: "ว่าง",
        transmission: "ธรรมดา",
        licensePlate: "กท 9999",
        seats: 4,
        fuel: "เบนซิน",
        year: 1999,
        description: "ตำนาน R34",
      },
      {
        id: 4,
        name: "Mazda CX-5",
        brand: "Mazda",
        type: "SUV",
        pricePerDay: 1700,
        status: "ว่าง",
        transmission: "อัตโนมัติ",
        licensePlate: "ขน 2025",
        seats: 5,
        fuel: "ดีเซล",
        year: 2021,
        description: "SUV สมดุลย์ดี",
      },
    ],
    []
  );
  const [cars, setCars] = useState(initialCars);

  /* Filters (Cars) */
  const [filters, setFilters] = useState({ q: "", status: "ทั้งหมด" });
  const onFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const filteredCars = useMemo(() => {
    const query = filters.q.trim().toLowerCase();
    return cars.filter((c) => {
      const haystack = [c.name, c.brand, c.licensePlate, c.fuel, c.transmission]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      const matchesQuery = !query || haystack.some((v) => v.includes(query));
      const matchesStatus =
        filters.status === "ทั้งหมด" || c.status === filters.status;
      return matchesQuery && matchesStatus;
    });
  }, [cars, filters]);

  /* Add car form */
  const [form, setForm] = useState({
    name: "",
    brand: "",
    type: "Sedan",
    pricePerDay: "",
    status: "ว่าง",
    transmission: "อัตโนมัติ",
    licensePlate: "",
    seats: "",
    fuel: "เบนซิน",
    year: "",
    description: "",
  });
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddCar = (e) => {
    e.preventDefault();
    if (!form.name || !form.brand || !form.pricePerDay) {
      alert("กรุณากรอกชื่อรถ ยี่ห้อ และราคา/วัน ให้ครบ");
      return;
    }
    const nextId = cars.length ? Math.max(...cars.map((c) => c.id)) + 1 : 1;
    const newCar = {
      id: nextId,
      name: form.name,
      brand: form.brand,
      type: form.type,
      pricePerDay: Number(form.pricePerDay),
      status: form.status,
      transmission: form.transmission,
      licensePlate: form.licensePlate,
      seats: form.seats ? Number(form.seats) : undefined,
      fuel: form.fuel,
      year: form.year ? Number(form.year) : undefined,
      description: form.description,
    };
    setCars((prev) => [newCar, ...prev]);
    setForm({
      name: "",
      brand: "",
      type: "Sedan",
      pricePerDay: "",
      status: "ว่าง",
      transmission: "อัตโนมัติ",
      licensePlate: "",
      seats: "",
      fuel: "เบนซิน",
      year: "",
      description: "",
    });
  };

  const handleDelete = (id) => {
    if (confirm("ยืนยันการลบรถคันนี้?")) {
      setCars((prev) => prev.filter((c) => c.id !== id));
    }
  };

  /* Edit car modal */
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    type: "Sedan",
    pricePerDay: "",
    status: "ว่าง",
    transmission: "อัตโนมัติ",
    licensePlate: "",
    seats: "",
    fuel: "เบนซิน",
    year: "",
    description: "",
  });
  const openEdit = (car) => {
    setEditId(car.id);
    setEditForm({
      name: car.name ?? "",
      brand: car.brand ?? "",
      type: car.type ?? "Sedan",
      pricePerDay: car.pricePerDay ?? "",
      status: car.status ?? "ว่าง",
      transmission: car.transmission ?? "อัตโนมัติ",
      licensePlate: car.licensePlate ?? "",
      seats: car.seats ?? "",
      fuel: car.fuel ?? "เบนซิน",
      year: car.year ?? "",
      description: car.description ?? "",
    });
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditOpen(false);
    setEditId(null);
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.brand || !editForm.pricePerDay) {
      alert("กรุณากรอกชื่อรถ ยี่ห้อ และราคา/วัน ให้ครบ");
      return;
    }
    setCars((prev) =>
      prev.map((c) =>
        c.id === editId
          ? {
              ...c,
              name: editForm.name,
              brand: editForm.brand,
              type: editForm.type,
              pricePerDay: Number(editForm.pricePerDay),
              status: editForm.status,
              transmission: editForm.transmission,
              licensePlate: editForm.licensePlate,
              seats: editForm.seats ? Number(editForm.seats) : undefined,
              fuel: editForm.fuel,
              year: editForm.year ? Number(editForm.year) : undefined,
              description: editForm.description,
            }
          : c
      )
    );
    closeEdit();
  };

  /* ---- Bookings ---- */
  const initialBookings = useMemo(
    () => [
      {
        id: "VR-2025-000123",
        bookingCode: "VR-2025-000123",
        customerName: "คุณเอ",
        customerPhone: "080-000-0000",
        verifyType: "บัตรประชาชน",
        carName: "Toyota Corolla Cross",
        carPlate: "1กข 1234",
        pricePerDay: 1800,
        pickupLocation: "สนามบินเชียงใหม่ (CNX)",
        pickupTime: toISO("2025-09-07T10:00:00"),
        returnLocation: "สาขาสีลม",
        returnTime: toISO("2025-09-10T12:00:00"),
        extras: [{ name: "คาร์ซีท", price: 100 }],
        discount: 200,
        deposit: 5000,
        paymentStatus: "ชำระแล้ว",
        bookingStatus: "ยืนยันแล้ว",
        channel: "Web",
        createdAt: toISO("2025-09-06T09:10:00"),
        notes: "ไฟลท์มาถึง 09:20",
      },
      {
        id: "VR-2025-000124",
        bookingCode: "VR-2025-000124",
        customerName: "คุณบี",
        customerPhone: "081-111-2222",
        verifyType: "ใบขับขี่",
        carName: "Mazda CX-5",
        carPlate: "ขน 2025",
        pricePerDay: 1700,
        pickupLocation: "สาขาสีลม",
        pickupTime: toISO("2025-09-08T09:00:00"),
        returnLocation: "สาขาสีลม",
        returnTime: toISO("2025-09-09T09:00:00"),
        extras: [],
        discount: 0,
        deposit: 3000,
        paymentStatus: "รอชำระ",
        bookingStatus: "รอชำระ",
        channel: "LINE",
        createdAt: toISO("2025-09-07T08:30:00"),
        notes: "",
      },
      {
        id: "VR-2025-000125",
        bookingCode: "VR-2025-000125",
        customerName: "คุณซี",
        customerPhone: "082-333-4444",
        verifyType: "Passport",
        carName: "Nissan Skyline R34",
        carPlate: "กท 9999",
        pricePerDay: 2000,
        pickupLocation: "สาขาสีลม",
        pickupTime: toISO("2025-09-12T14:00:00"),
        returnLocation: "สาขาสีลม",
        returnTime: toISO("2025-09-15T12:00:00"),
        extras: [{ name: "GPS", price: 60 }],
        discount: 0,
        deposit: 5000,
        paymentStatus: "รอชำระ",
        bookingStatus: "รอชำระ",
        channel: "Call",
        createdAt: toISO("2025-09-05T11:00:00"),
        notes: "ลูกค้าขอรับรถไวได้ถ้ามี",
      },
    ],
    []
  );
  const [bookings, setBookings] = useState(initialBookings);

  /* Filters (Bookings) */
  const [bkFilter, setBkFilter] = useState({
    q: "",
    bookingStatus: "ทั้งหมด",
    paymentStatus: "ทั้งหมด",
  });
  const filteredBookings = useMemo(() => {
    const q = bkFilter.q.trim().toLowerCase();
    return bookings.filter((b) => {
      const hitQ =
        !q ||
        [
          b.bookingCode,
          b.customerName,
          b.customerPhone,
          b.carName,
          b.carPlate,
          b.pickupLocation,
          b.returnLocation,
          b.channel,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase())
          .some((v) => v.includes(q));
      const hitBS =
        bkFilter.bookingStatus === "ทั้งหมด" ||
        b.bookingStatus === bkFilter.bookingStatus;
      const hitPS =
        bkFilter.paymentStatus === "ทั้งหมด" ||
        b.paymentStatus === bkFilter.paymentStatus;
      return hitQ && hitBS && hitPS;
    });
  }, [bookings, bkFilter]);

  /* next booking per car (for car table) */
  const nextBookingMap = useMemo(() => {
    const map = {};
    const now = new Date();
    bookings.forEach((b) => {
      if (b.bookingStatus === "ยกเลิก") return;
      const p = new Date(b.pickupTime);
      if (p >= now) {
        const key = b.carPlate || b.carName;
        const prev = map[key];
        if (!prev || new Date(prev.pickupTime) > p) map[key] = b;
      }
    });
    return map;
  }, [bookings]);

  /* today summary (for employee card) */
  const todaySummary = useMemo(() => {
    const today = new Date();
    const pickups = bookings.filter((b) =>
      sameDate(new Date(b.pickupTime), today)
    ).length;
    const returns = bookings.filter((b) =>
      sameDate(new Date(b.returnTime), today)
    ).length;
    const pendingPay = bookings.filter(
      (b) => b.paymentStatus === "รอชำระ"
    ).length;
    return { pickups, returns, pendingPay };
  }, [bookings]);

  /* Detail modal (booking) */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const openDetail = (b) => {
    setDetailItem(b);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetailItem(null);
  };

  /* Mock employee */
  const employee = {
    id: "E-2024-001",
    name: "สมชาย แอดมิน",
    role: "ผู้ดูแลระบบ",
    status: "ออนไลน์",
    phone: "081-234-5678",
    email: "admin@vrent.com",
    branch: "สาขาสีลม",
    shift: "กะเช้า (09:00–18:00)",
    startDate: "2023-05-10",
    lastLogin: "2025-08-15 09:42",
  };

  /* ───────────── Render ───────────── */
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Headers />

      <main className="flex-1 px-4 py-6">
        {/* ใช้ 12 คอลัมน์: แถวบนซ้าย/ขวา และแถวล่างเต็มกว้าง */}
        <div className="mx-auto max-w-7xl grid grid-cols-12 gap-6 px-2 sm:px-4">
          {/* 1) ซ้าย: ข้อมูลพนักงาน */}
          <section className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="relative w-full h-40 sm:h-48 lg:h-56 bg-gray-100">
                <div className="absolute inset-4 rounded-xl border-2 border-dashed border-gray-300" />
              </div>
              <div className="p-5">
                <h2 className="text-lg font-bold text-black">ข้อมูลพนักงาน</h2>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-semibold text-black">
                      {employee.name}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {employee.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{employee.role}</div>
                  <div className="grid grid-cols-1 gap-y-1.5 text-sm text-gray-800 mt-3">
                    <div>
                      รหัสพนักงาน:{" "}
                      <span className="font-medium text-black">
                        {employee.id}
                      </span>
                    </div>
                    <div>สาขา: {employee.branch}</div>
                    <div>กะทำงาน: {employee.shift}</div>
                    <div>เริ่มงาน: {employee.startDate}</div>
                    <div>เข้าระบบล่าสุด: {employee.lastLogin}</div>
                    <div>โทร: {employee.phone}</div>
                    <div>อีเมล: {employee.email}</div>
                  </div>
                </div>

                {/* สรุปงานวันนี้ */}
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border bg-gray-50 p-2">
                    <div className="text-xs text-gray-500">รับรถวันนี้</div>
                    <div className="text-lg font-bold">
                      {todaySummary.pickups}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-gray-50 p-2">
                    <div className="text-xs text-gray-500">คืนรถวันนี้</div>
                    <div className="text-lg font-bold">
                      {todaySummary.returns}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-gray-50 p-2">
                    <div className="text-xs text-gray-500">รอชำระ</div>
                    <div className="text-lg font-bold">
                      {todaySummary.pendingPay}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2) ขวา: เพิ่มรถเพื่อเช่า (เฉพาะฟอร์ม) */}
          <section className="col-span-12 lg:col-span-9">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-lg font-bold text-black">เพิ่มรถเพื่อเช่า</h2>
              <form
                onSubmit={handleAddCar}
                className="mt-4 grid grid-cols-1 xl:grid-cols-6 gap-3"
              >
                <div className="xl:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    ชื่อรถ *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                    placeholder="เช่น Toyota Corolla Cross"
                    required
                  />
                </div>
                <div className="xl:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    ยี่ห้อ *
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={form.brand}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                    placeholder="เช่น Toyota"
                    required
                  />
                </div>
                <div className="xl:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    ประเภท
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black"
                  >
                    <option>Sedan</option>
                    <option>SUV</option>
                    <option>Hatchback</option>
                    <option>Pickup</option>
                    <option>JDM</option>
                    <option>Van</option>
                  </select>
                </div>

                <div className="xl:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    ระบบเกียร์
                  </label>
                  <select
                    name="transmission"
                    value={form.transmission}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black"
                  >
                    <option value="อัตโนมัติ">อัตโนมัติ (Auto)</option>
                    <option value="ธรรมดา">ธรรมดา (Manual)</option>
                  </select>
                </div>
                <div className="xl:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    ป้ายทะเบียน
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={form.licensePlate}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                    placeholder="เช่น 1กข 1234 กรุงเทพฯ"
                  />
                </div>
                <div className="xl:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    จำนวนที่นั่ง
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="seats"
                    value={form.seats}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                    placeholder="เช่น 5"
                  />
                </div>

                <div className="xl:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    ประเภทเชื้อเพลิง
                  </label>
                  <select
                    name="fuel"
                    value={form.fuel}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black"
                  >
                    <option>เบนซิน</option>
                    <option>ดีเซล</option>
                    <option>ไฮบริด</option>
                    <option>ไฟฟ้า (EV)</option>
                    <option>LPG</option>
                    <option>NGV</option>
                  </select>
                </div>
                <div className="xl:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    ปีของรถ
                  </label>
                  <input
                    type="number"
                    name="year"
                    min="1980"
                    max="2100"
                    value={form.year}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                    placeholder="เช่น 2021"
                  />
                </div>
                <div className="xl:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    ราคา/วัน (บาท) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="pricePerDay"
                    value={form.pricePerDay}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                    placeholder="เช่น 1500"
                    required
                  />
                </div>

                <div className="xl:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    สถานะ
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black"
                  >
                    <option value="ว่าง">ว่าง</option>
                    <option value="ถูกยืมอยู่">ถูกยืมอยู่</option>
                  </select>
                </div>
                <div className="xl:col-span-4">
                  <label className="block text-xs font-semibold text-black mb-1">
                    คำอธิบายเพิ่มเติม
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                    placeholder="รายละเอียด อุปกรณ์เสริม เงื่อนไขการเช่า ฯลฯ"
                  />
                </div>

                <div className="col-span-1 xl:col-span-6 flex justify-center pt-1">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition"
                  >
                    เพิ่มรถ
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* 3) พื้นที่ด้านล่างเต็มกว้าง: รวมตารางทั้งสอง */}
          <section className="col-span-12">
            <div className="grid grid-cols-1 gap-6">
              {/* ตารางรถ */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-black">ตารางรถ</h2>
                  <div className="text-sm text-gray-600">
                    ทั้งหมด {cars.length} คัน
                  </div>
                </div>

                {/* ฟิลเตอร์ของตารางรถ */}
                <div className="mt-4 mb-3 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="w-full sm:w-64">
                    <label className="block text-xs font-semibold text-black mb-1">
                      ค้นหา
                    </label>
                    <input
                      name="q"
                      value={filters.q}
                      onChange={onFilterChange}
                      placeholder="รุ่น / ยี่ห้อ / ป้ายทะเบียน..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                    />
                  </div>
                  <div className="w-full sm:w-56">
                    <label className="block text-xs font-semibold text-black mb-1">
                      สถานะ
                    </label>
                    <select
                      name="status"
                      value={filters.status}
                      onChange={onFilterChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:ring-black text-black"
                    >
                      <option>ทั้งหมด</option>
                      <option value="ว่าง">ว่าง</option>
                      <option value="ถูกยืมอยู่">ถูกยืมอยู่</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setFilters({ q: "", status: "ทั้งหมด" })}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    ล้างตัวกรอง
                  </button>
                  <div className="sm:ml-auto text-sm text-gray-600">
                    แสดง {filteredCars.length} จาก {cars.length} รายการ
                  </div>
                </div>

                {/* ตารางรถ */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="py-2 pr-3">#</th>
                        <th className="py-2 pr-3">รุ่น</th>
                        <th className="py-2 pr-3">ยี่ห้อ</th>
                        <th className="py-2 pr-3">ป้ายทะเบียน</th>
                        <th className="py-2 pr-3">ราคา/วัน</th>
                        <th className="py-2 pr-3">สถานะ</th>
                        <th className="py-2 pr-3">จองถัดไป</th>
                        <th className="py-2 pr-3">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCars.map((c) => {
                        const key = c.licensePlate || c.name;
                        const nb = nextBookingMap[key];
                        return (
                          <tr key={c.id} className="align-middle">
                            <td className="py-3 pr-3 text-gray-700">{c.id}</td>
                            <td className="py-3 pr-3 font-medium text-black">
                              {c.name}
                            </td>
                            <td className="py-3 pr-3 text-gray-700">
                              {c.brand}
                            </td>
                            <td className="py-3 pr-3 text-gray-700">
                              {c.licensePlate || "—"}
                            </td>
                            <td className="py-3 pr-3 text-gray-700">
                              {fmtBaht(c.pricePerDay)} ฿
                            </td>
                            <td className="py-3 pr-3">
                              <StatusBadge value={c.status} />
                            </td>
                            <td className="py-3 pr-3 text-gray-700">
                              {nb ? (
                                <div className="leading-tight">
                                  <div className="font-medium">
                                    {nb.bookingCode}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {fmtDateTime(nb.pickupTime)} →{" "}
                                    {fmtDateTime(nb.returnTime)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEdit(c)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                                  aria-label={`แก้ไข ${c.name}`}
                                >
                                  ✎ แก้ไข
                                </button>
                                <button
                                  onClick={() => handleDelete(c.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                                  aria-label={`ลบ ${c.name}`}
                                >
                                  ลบ
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredCars.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-6 text-center text-gray-500"
                          >
                            ไม่พบรายการที่ตรงกับตัวกรอง
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ตารางการจอง */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-black">
                    ตารางการจองของลูกค้า
                  </h2>
                  <span className="text-sm text-gray-600">
                    ทั้งหมด {bookings.length} รายการ
                  </span>
                </div>

                {/* ฟิลเตอร์ของตารางการจอง */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="w-full sm:w-96">
                    <label className="block text-xs font-semibold text-black mb-1">
                      ค้นหา
                    </label>
                    <input
                      value={bkFilter.q}
                      onChange={(e) =>
                        setBkFilter((p) => ({ ...p, q: e.target.value }))
                      }
                      placeholder="รหัสจอง / ลูกค้า / รถ / ป้าย / สถานที่ / ช่องทาง"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                    />
                  </div>
                  <div className="w-full sm:w-56">
                    <label className="block text-xs font-semibold text-black mb-1">
                      สถานะการจอง
                    </label>
                    <select
                      value={bkFilter.bookingStatus}
                      onChange={(e) =>
                        setBkFilter((p) => ({
                          ...p,
                          bookingStatus: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:ring-black text-black"
                    >
                      <option>ทั้งหมด</option>
                      <option>ยืนยันแล้ว</option>
                      <option>รอชำระ</option>
                      <option>ยกเลิก</option>
                    </select>
                  </div>
                  <div className="w-full sm:w-56">
                    <label className="block text-xs font-semibold text-black mb-1">
                      สถานะชำระเงิน
                    </label>
                    <select
                      value={bkFilter.paymentStatus}
                      onChange={(e) =>
                        setBkFilter((p) => ({
                          ...p,
                          paymentStatus: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:ring-black text-black"
                    >
                      <option>ทั้งหมด</option>
                      <option>ชำระแล้ว</option>
                      <option>รอชำระ</option>
                    </select>
                  </div>
                  <button
                    onClick={() =>
                      setBkFilter({
                        q: "",
                        bookingStatus: "ทั้งหมด",
                        paymentStatus: "ทั้งหมด",
                      })
                    }
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    ล้างตัวกรอง
                  </button>
                </div>

                {/* ตารางการจอง */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="py-2 pr-3">รับ → คืน</th>
                        <th className="py-2 pr-3">รหัสจอง</th>
                        <th className="py-2 pr-3">ลูกค้า</th>
                        <th className="py-2 pr-3">รถ/ทะเบียน</th>
                        <th className="py-2 pr-3">ราคา/วัน</th>
                        <th className="py-2 pr-3">วันเช่า</th>
                        <th className="py-2 pr-3">รวมสุทธิ</th>
                        <th className="py-2 pr-3">ชำระเงิน</th>
                        <th className="py-2 pr-3">สถานะ</th>
                        <th className="py-2 pr-3">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredBookings.map((b) => {
                        const calc = computeTotal(b);
                        return (
                          <tr key={b.id} className="align-middle">
                            <td className="py-3 pr-3 text-gray-700">
                              <div className="leading-tight">
                                <div>{fmtDateTime(b.pickupTime)}</div>
                                <div className="text-xs text-gray-500">
                                  → {fmtDateTime(b.returnTime)}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-3 font-medium text-black">
                              {b.bookingCode}
                            </td>
                            <td className="py-3 pr-3 text-gray-800">
                              <div className="leading-tight">
                                <div>{b.customerName}</div>
                                <div className="text-xs text-gray-500">
                                  {b.customerPhone}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-3 text-gray-700">
                              {(b.carName || "—") +
                                (b.carPlate ? ` / ${b.carPlate}` : "")}
                            </td>
                            <td className="py-3 pr-3 text-gray-700">
                              {fmtBaht(b.pricePerDay)} ฿
                            </td>
                            <td className="py-3 pr-3 text-gray-700">
                              {calc.days} วัน
                            </td>
                            <td className="py-3 pr-3 text-gray-800">
                              {fmtBaht(calc.total)} ฿
                            </td>
                            <td className="py-3 pr-3">
                              <PayBadge value={b.paymentStatus} />
                            </td>
                            <td className="py-3 pr-3">
                              <BookingBadge value={b.bookingStatus} />
                            </td>
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openDetail(b)}
                                  className="px-3 py-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                                >
                                  ดูรายละเอียด
                                </button>
                                {b.paymentStatus !== "ชำระแล้ว" && (
                                  <button
                                    onClick={() =>
                                      setBookings((prev) =>
                                        prev.map((x) =>
                                          x.id === b.id
                                            ? {
                                                ...x,
                                                paymentStatus: "ชำระแล้ว",
                                              }
                                            : x
                                        )
                                      )
                                    }
                                    className="px-3 py-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                                  >
                                    ทำเครื่องหมายชำระแล้ว
                                  </button>
                                )}
                                {b.bookingStatus !== "ยกเลิก" && (
                                  <button
                                    onClick={() =>
                                      setBookings((prev) =>
                                        prev.map((x) =>
                                          x.id === b.id
                                            ? { ...x, bookingStatus: "ยกเลิก" }
                                            : x
                                        )
                                      )
                                    }
                                    className="px-3 py-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                                  >
                                    ยกเลิก
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredBookings.length === 0 && (
                        <tr>
                          <td
                            colSpan={10}
                            className="py-6 text-center text-gray-500"
                          >
                            ไม่พบรายการที่ตรงกับตัวกรอง
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* ----- Modal แก้ไขข้อมูลรถ ----- */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeEdit} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">
                แก้ไขข้อมูลรถ #{editId}
              </h3>
              <button
                onClick={closeEdit}
                className="text-gray-500 hover:text-gray-700"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3"
            >
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  ชื่อรถ *
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                  required
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  ยี่ห้อ *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={editForm.brand}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-black mb-1">
                  ประเภท
                </label>
                <select
                  name="type"
                  value={editForm.type}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black"
                >
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Hatchback</option>
                  <option>Pickup</option>
                  <option>JDM</option>
                  <option>Van</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-black mb-1">
                  ระบบเกียร์
                </label>
                <select
                  name="transmission"
                  value={editForm.transmission}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black"
                >
                  <option value="อัตโนมัติ">อัตโนมัติ (Auto)</option>
                  <option value="ธรรมดา">ธรรมดา (Manual)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-black mb-1">
                  ป้ายทะเบียน
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={editForm.licensePlate}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-black mb-1">
                  จำนวนที่นั่ง
                </label>
                <input
                  type="number"
                  name="seats"
                  min="1"
                  value={editForm.seats}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-black mb-1">
                  ประเภทเชื้อเพลิง
                </label>
                <select
                  name="fuel"
                  value={editForm.fuel}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black"
                >
                  <option>เบนซิน</option>
                  <option>ดีเซล</option>
                  <option>ไฮบริด</option>
                  <option>ไฟฟ้า (EV)</option>
                  <option>LPG</option>
                  <option>NGV</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-black mb-1">
                  ปีของรถ
                </label>
                <input
                  type="number"
                  name="year"
                  min="1980"
                  max="2100"
                  value={editForm.year}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  ราคา/วัน (บาท) *
                </label>
                <input
                  type="number"
                  name="pricePerDay"
                  min="0"
                  value={editForm.pricePerDay}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                  required
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  สถานะ
                </label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black"
                >
                  <option value="ว่าง">ว่าง</option>
                  <option value="ถูกยืมอยู่">ถูกยืมอยู่</option>
                </select>
              </div>
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-black mb-1">
                  คำอธิบายเพิ่มเติม
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                />
              </div>
              <div className="md:col-span-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----- Modal รายละเอียดการจอง ----- */}
      {detailOpen && detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetail} />
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">
                รายละเอียดการจอง — {detailItem.bookingCode}
              </h3>
              <button
                onClick={closeDetail}
                className="text-gray-500 hover:text-gray-700"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div>
                  ลูกค้า: <b>{detailItem.customerName}</b>
                </div>
                <div>โทร: {detailItem.customerPhone}</div>
                <div>เอกสาร: {detailItem.verifyType}</div>
                <div>ช่องทางจอง: {detailItem.channel || "-"}</div>
                <div>สร้างเมื่อ: {fmtDateTime(detailItem.createdAt)}</div>
              </div>
              <div>
                <div>
                  รถ: {detailItem.carName || "-"} / {detailItem.carPlate || "-"}
                </div>
                <div>
                  รับรถ: {detailItem.pickupLocation || "-"} (
                  {fmtDateTime(detailItem.pickupTime)})
                </div>
                <div>
                  คืนรถ: {detailItem.returnLocation || "-"} (
                  {fmtDateTime(detailItem.returnTime)})
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm">
              {(() => {
                const c = computeTotal(detailItem);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <div>ราคา/วัน: {fmtBaht(detailItem.pricePerDay)} ฿</div>
                      <div>วันเช่า: {c.days} วัน</div>
                      <div>ออปชันเสริม: {fmtBaht(c.extras)} ฿</div>
                      <div>ส่วนลด: {fmtBaht(c.discount)} ฿</div>
                    </div>
                    <div>
                      <div>มัดจำ: {fmtBaht(detailItem.deposit)} ฿</div>
                      <div>
                        ชำระเงิน: <PayBadge value={detailItem.paymentStatus} />
                      </div>
                      <div>
                        สถานะ: <BookingBadge value={detailItem.bookingStatus} />
                      </div>
                      <div className="font-semibold">
                        รวมสุทธิ: {fmtBaht(c.total)} ฿
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              {detailItem.bookingStatus !== "ยกเลิก" && (
                <button
                  onClick={() => {
                    setBookings((prev) =>
                      prev.map((x) =>
                        x.id === detailItem.id
                          ? { ...x, bookingStatus: "ยกเลิก" }
                          : x
                      )
                    );
                    closeDetail();
                  }}
                  className="px-4 py-2 rounded-lg border"
                >
                  ยกเลิกการจอง
                </button>
              )}
              {detailItem.paymentStatus !== "ชำระแล้ว" && (
                <button
                  onClick={() => {
                    setBookings((prev) =>
                      prev.map((x) =>
                        x.id === detailItem.id
                          ? { ...x, paymentStatus: "ชำระแล้ว" }
                          : x
                      )
                    );
                    closeDetail();
                  }}
                  className="px-4 py-2 rounded-lg bg-black text-white"
                >
                  ทำเครื่องหมายชำระแล้ว
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
