// app/admin/page.js
"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Headers from "@/Components/HeaderAd";
import Footer from "@/Components/Footer";

/* ───────────── Utilities ───────────── */
const cls = (...a) => a.filter(Boolean).join(" ");
const fmtDateTime = fmtDateTimeLocal;
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

/* ★ เวลาแบบไม่เพี้ยนโซน (preserve local wall time) */
function localToIsoPreserveWallTime(localStr) {
  if (!localStr) return "";
  const [date, time] = localStr.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00`;
}
function isoToLocalInputPreserve(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${dd}T${hh}:${mm}`;
}
function fmtDateTimeLocal(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${dd} ${hh}:${mm}`;
}

/* อัปโหลดไฟล์: ตรวจชนิด/ขนาด */
const MAX_FILE_MB = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
function readImageSafe(file, onload) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    alert("ไฟล์ต้องเป็น .jpg .png หรือ .webp");
    return false;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    alert(`ไฟล์ใหญ่เกิน ${MAX_FILE_MB}MB`);
    return false;
  }
  const reader = new FileReader();
  reader.onload = onload;
  reader.readAsDataURL(file);
  return true;
}

/* ───────────── Booking Lifecycle ───────────── */
const LIFECYCLE = {
  WAIT_PAYMENT: "รอชำระ",
  WAIT_PICKUP: "รอรับ",
  PICKUP_OVERDUE: "เลยกำหนดรับ",
  IN_USE: "กำลังเช่า",
  RETURN_OVERDUE: "เลยกำหนดคืน",
  DONE: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

function getLifecycle(b, now = new Date()) {
  if (b.bookingStatus === "ยกเลิก") return LIFECYCLE.CANCELLED;
  if (b.bookingStatus === "เสร็จสิ้น" || b.returnedAt) return LIFECYCLE.DONE;

  const pickup = b.pickupTime ? new Date(b.pickupTime) : null;
  const drop = b.returnTime ? new Date(b.returnTime) : null;

  if (b.pickedUpAt && !b.returnedAt) {
    if (drop && now > drop) return LIFECYCLE.RETURN_OVERDUE;
    return LIFECYCLE.IN_USE;
  }

  if (!b.pickedUpAt) {
    if (b.paymentStatus !== "ชำระแล้ว") return LIFECYCLE.WAIT_PAYMENT;
    if (pickup && now > pickup) return LIFECYCLE.PICKUP_OVERDUE;
    return LIFECYCLE.WAIT_PICKUP;
  }

  return LIFECYCLE.WAIT_PAYMENT;
}

function isOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/* ───────────── NEW: คำนวณสถานะตารางรถจากการจอง (optimize + ใช้ carId) ───────────── */
function getCarRowStatus(car, bookings, now = new Date()) {
  const keyId = car.id;
  let hasReturnOverdue = false;
  let hasPickupOverdue = false;
  let hasInUse = false;
  let hasPaidWaitPickup = false;

  for (const b of bookings) {
    const bKey = b.carId ?? (b.carPlate || b.carName); // fallback เผื่อยังมีรายการเก่าก่อน migrate
    if (bKey !== keyId && bKey !== (car.licensePlate || car.name)) continue;

    const lc = getLifecycle(b, now);
    if (lc === LIFECYCLE.RETURN_OVERDUE) {
      hasReturnOverdue = true;
      break;
    }
    if (lc === LIFECYCLE.PICKUP_OVERDUE) hasPickupOverdue = true;
    if (lc === LIFECYCLE.IN_USE) hasInUse = true;
    if (b.paymentStatus === "ชำระแล้ว" && lc === LIFECYCLE.WAIT_PICKUP)
      hasPaidWaitPickup = true;
  }

  if (hasReturnOverdue) return "เลยกำหนดส่ง";
  if (hasPickupOverdue) return "เลยกำหนดรับ";
  if (hasInUse) return "ถูกยืมอยู่";
  if (hasPaidWaitPickup) return "รอส่ง";
  return car.status;
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

/* ───────────── Badges ───────────── */
const StatusBadge = ({ value }) => {
  const map =
    value === "ว่าง"
      ? "bg-green-100 text-green-800"
      : value === "ถูกยืมอยู่"
      ? "bg-red-100 text-red-800"
      : value === "ซ่อมแซม"
      ? "bg-amber-100 text-amber-800"
      : value === "รอส่ง"
      ? "bg-blue-100 text-blue-800"
      : value === "เลยกำหนดรับ"
      ? "bg-orange-100 text-orange-800"
      : value === "เลยกำหนดส่ง"
      ? "bg-rose-100 text-rose-800"
      : "bg-gray-100 text-gray-700";
  return (
    <span
      className={cls(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        map
      )}
    >
      {value}
    </span>
  );
};

const BookingBadge = ({ value }) => {
  const map =
    value === "ยืนยันแล้ว" || value === "รอรับ"
      ? "bg-emerald-100 text-emerald-800"
      : value === "รอชำระ"
      ? "bg-amber-100 text-amber-800"
      : value === "กำลังเช่า"
      ? "bg-indigo-100 text-indigo-800"
      : value === "เลยกำหนดรับ" || value === "เลยกำหนดคืน"
      ? "bg-rose-100 text-rose-800"
      : value === "ยกเลิก"
      ? "bg-gray-200 text-gray-700"
      : value === "เสร็จสิ้น"
      ? "bg-sky-100 text-sky-800"
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
      : value === "เสร็จสิ้น"
      ? "bg-sky-100 text-sky-800"
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

/* ───────────── Page ───────────── */
export default function AdminPage() {
  /* clock for lifecycle */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  /* ---- Cars ---- */
  const initialCars = useMemo(
    () => [
      {
        id: 1,
        name: "Toyota Yaris",
        brand: "Toyota",
        type: "Hatchback",
        pricePerDay: 1200,
        status: "ว่าง",
        transmission: "อัตโนมัติ",
        licensePlate: "กข 1234",
        seats: 5,
        fuel: "เบนซิน",
        year: 2022,
        description: "แฮทช์แบ็กขับง่าย ประหยัด",
      },
      {
        id: 2,
        name: "Honda Civic",
        brand: "Honda",
        type: "Sedan",
        pricePerDay: 1400,
        status: "ว่าง",
        transmission: "อัตโนมัติ",
        licensePlate: "ฮค 4444",
        seats: 5,
        fuel: "เบนซิน",
        year: 2023,
        description: "ซีดานยอดนิยม",
      },
      {
        id: 3,
        name: "Toyota Fortuner",
        brand: "Toyota",
        type: "SUV",
        pricePerDay: 2400,
        status: "ว่าง",
        transmission: "อัตโนมัติ",
        licensePlate: "ฟท 1111",
        seats: 7,
        fuel: "ดีเซล",
        year: 2023,
        description: "PPV นั่งสบาย ลุยได้",
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
        description: "SUV สมดุลดี",
      },
      {
        id: 5,
        name: "Isuzu D-Max",
        brand: "Isuzu",
        type: "Pickup",
        pricePerDay: 1600,
        status: "ว่าง",
        transmission: "ธรรมดา",
        licensePlate: "ดม 2345",
        seats: 5,
        fuel: "ดีเซล",
        year: 2021,
        description: "กระบะงานบรรทุก",
      },
      {
        id: 6,
        name: "BMW 5 Series",
        brand: "BMW",
        type: "Sedan",
        pricePerDay: 3500,
        status: "ว่าง",
        transmission: "อัตโนมัติ",
        licensePlate: "บม 5005",
        seats: 5,
        fuel: "ไฮบริด",
        year: 2022,
        description: "พรีเมียมสำหรับผู้บริหาร",
      },
    ],
    []
  );

  const [cars, setCars] = useState(initialCars);

  /* car filters */
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

  /* add car form */
  const fileRef = useRef(null);
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
    imageData: "",
  });
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setForm((p) => ({ ...p, imageData: "" }));
      return;
    }
    readImageSafe(file, function () {
      setForm((p) => ({ ...p, imageData: String(this.result || "") }));
    });
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
      imageData: form.imageData || "",
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
      imageData: "",
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = (id) => {
    if (confirm("ยืนยันการลบรถคันนี้?")) {
      setCars((prev) => prev.filter((c) => c.id !== id));
    }
  };

  /* edit car modal */
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
      // 1) ชำระแล้ว + รอรับ (นับเป็น "รับรถวันนี้")
      {
        id: "VR-2001",
        bookingCode: "VR-2001",
        customerName: "คุณเอ",
        customerPhone: "080-111-0001",
        verifyType: "บัตรประชาชน",
        carId: 1,
        carName: "Toyota Yaris",
        carPlate: "กข 1234",
        pricePerDay: 1200,
        pickupLocation: "สาขาสีลม",
        pickupTime: localToIsoPreserveWallTime("2025-09-08T10:00"),
        returnLocation: "สาขาสีลม",
        returnTime: localToIsoPreserveWallTime("2025-09-10T10:00"),
        extras: [],
        discount: 0,
        deposit: 0,
        paymentStatus: "ชำระแล้ว",
        bookingStatus: "ยืนยันแล้ว",
        pickedUpAt: "",
        returnedAt: "",
        channel: "Web",
        createdAt: localToIsoPreserveWallTime("2025-09-07T09:10"),
        notes: "",
        slipImage: "",
      },

      // 2) รอชำระ (งานอนาคตใกล้ๆ)
      {
        id: "VR-2002",
        bookingCode: "VR-2002",
        customerName: "คุณบี",
        customerPhone: "081-222-0002",
        verifyType: "ใบขับขี่",
        carId: 2,
        carName: "Honda Civic",
        carPlate: "ฮค 4444",
        pricePerDay: 1400,
        pickupLocation: "สาขาสีลม",
        pickupTime: localToIsoPreserveWallTime("2025-09-09T09:00"),
        returnLocation: "สาขาสีลม",
        returnTime: localToIsoPreserveWallTime("2025-09-10T09:00"),
        extras: [],
        discount: 0,
        deposit: 0,
        paymentStatus: "รอชำระ",
        bookingStatus: "รอชำระ",
        pickedUpAt: "",
        returnedAt: "",
        channel: "LINE",
        createdAt: localToIsoPreserveWallTime("2025-09-08T08:30"),
        notes: "",
        slipImage: "",
      },

      // 3) กำลังเช่า (pickedUpAt มีค่า, ยังไม่คืน)
      {
        id: "VR-2003",
        bookingCode: "VR-2003",
        customerName: "คุณซี",
        customerPhone: "082-333-0003",
        verifyType: "Passport",
        carId: 3,
        carName: "Toyota Fortuner",
        carPlate: "ฟท 1111",
        pricePerDay: 2400,
        pickupLocation: "สาขาสีลม",
        pickupTime: localToIsoPreserveWallTime("2025-09-07T14:00"),
        returnLocation: "สาขาสีลม",
        returnTime: localToIsoPreserveWallTime("2025-09-11T12:00"),
        extras: [],
        discount: 0,
        deposit: 0,
        paymentStatus: "ชำระแล้ว",
        bookingStatus: "ยืนยันแล้ว",
        pickedUpAt: localToIsoPreserveWallTime("2025-09-07T14:05"),
        returnedAt: "",
        channel: "Call",
        createdAt: localToIsoPreserveWallTime("2025-09-06T11:00"),
        notes: "",
        slipImage: "",
      },

      // 4) เสร็จสิ้น (ปิดงานแล้ว)
      {
        id: "VR-2004",
        bookingCode: "VR-2004",
        customerName: "คุณดี",
        customerPhone: "083-444-0004",
        verifyType: "บัตรประชาชน",
        carId: 4,
        carName: "Mazda CX-5",
        carPlate: "ขน 2025",
        pricePerDay: 1700,
        pickupLocation: "สาขาสีลม",
        pickupTime: localToIsoPreserveWallTime("2025-09-01T09:00"),
        returnLocation: "สาขาสีลม",
        returnTime: localToIsoPreserveWallTime("2025-09-03T09:00"),
        extras: [],
        discount: 0,
        deposit: 0,
        paymentStatus: "เสร็จสิ้น",
        bookingStatus: "เสร็จสิ้น",
        pickedUpAt: localToIsoPreserveWallTime("2025-09-01T09:05"),
        returnedAt: localToIsoPreserveWallTime("2025-09-03T09:10"),
        channel: "Web",
        createdAt: localToIsoPreserveWallTime("2025-08-31T15:00"),
        notes: "",
        slipImage: "",
      },

      // 5) ยกเลิก
      {
        id: "VR-2005",
        bookingCode: "VR-2005",
        customerName: "คุณอี",
        customerPhone: "084-555-0005",
        verifyType: "บัตรประชาชน",
        carId: 5,
        carName: "Isuzu D-Max",
        carPlate: "ดม 2345",
        pricePerDay: 1600,
        pickupLocation: "สาขาสีลม",
        pickupTime: localToIsoPreserveWallTime("2025-09-10T09:00"),
        returnLocation: "สาขาสีลม",
        returnTime: localToIsoPreserveWallTime("2025-09-12T12:00"),
        extras: [],
        discount: 0,
        deposit: 0,
        paymentStatus: "ยกเลิก",
        bookingStatus: "ยกเลิก",
        pickedUpAt: "",
        returnedAt: "",
        channel: "Walk-in",
        createdAt: localToIsoPreserveWallTime("2025-09-08T10:00"),
        notes: "ยกเลิกตามคำขอลูกค้า",
        slipImage: "",
      },
    ],
    []
  );

  const [bookings, setBookings] = useState(initialBookings);

  /* --- MIGRATION: เติม carId ให้ booking ตามป้าย/ชื่อ (ครั้งเดียว) --- */
  useEffect(() => {
    setBookings((prev) => {
      let changed = false;
      const byPlate = new Map(cars.map((c) => [c.licensePlate, c.id]));
      const byName = new Map(cars.map((c) => [c.name, c.id]));
      const next = prev.map((b) => {
        if (b.carId) return b;
        const cid =
          (b.carPlate && byPlate.get(b.carPlate)) ||
          (b.carName && byName.get(b.carName)) ||
          null;
        if (cid) {
          changed = true;
          return { ...b, carId: cid };
        }
        return b;
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* booking filters */
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

  /* next booking per car (ใช้ carId) */
  const nextBookingMap = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const lc = getLifecycle(b, now);
      if ([LIFECYCLE.CANCELLED, LIFECYCLE.DONE, LIFECYCLE.IN_USE].includes(lc))
        return;
      const p = new Date(b.pickupTime);
      if (p >= now) {
        const key = b.carId ?? (b.carPlate || b.carName);
        const prev = map[key];
        if (!prev || new Date(prev.pickupTime) > p) map[key] = b;
      }
    });
    return map;
  }, [bookings, now]);

  /* carMap (by id + fallback plate/name) */
  const carMapById = useMemo(() => {
    const m = new Map();
    cars.forEach((c) => m.set(c.id, c));
    return m;
  }, [cars]);
  const carMapByKey = useMemo(() => {
    const m = new Map();
    cars.forEach((c) => {
      m.set(c.licensePlate || c.name, c);
    });
    return m;
  }, [cars]);

  /* summary (พึ่งพาเวลาที่ preserve local) */
  const todaySummary = useMemo(() => {
    const pickups = bookings.filter((b) => {
      const lc = getLifecycle(b, now);
      return (
        (lc === LIFECYCLE.WAIT_PICKUP || lc === LIFECYCLE.PICKUP_OVERDUE) &&
        b.pickupTime &&
        sameDate(new Date(b.pickupTime), now)
      );
    }).length;

    const returns = bookings.filter((b) => {
      const lc = getLifecycle(b, now);
      return (
        (lc === LIFECYCLE.IN_USE || lc === LIFECYCLE.RETURN_OVERDUE) &&
        b.returnTime &&
        sameDate(new Date(b.returnTime), now)
      );
    }).length;

    const pendingPay = bookings.filter(
      (b) => getLifecycle(b, now) === LIFECYCLE.WAIT_PAYMENT
    ).length;

    return { pickups, returns, pendingPay };
  }, [bookings, now]);

  /* Detail modal */
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

  /* ---- Handlers ---- */
  const handleMarkPaid = (b) => {
    setBookings((prev) =>
      prev.map((x) =>
        x.id === b.id
          ? {
              ...x,
              paymentStatus: "ชำระแล้ว",
              bookingStatus:
                x.bookingStatus === "ยกเลิก" || x.bookingStatus === "เสร็จสิ้น"
                  ? x.bookingStatus
                  : "ยืนยันแล้ว",
            }
          : x
      )
    );
  };

  const handleConfirmPickup = (b) => {
    const nowISO = new Date().toISOString();
    setBookings((prev) =>
      prev.map((x) =>
        x.id === b.id
          ? {
              ...x,
              pickedUpAt: nowISO,
            }
          : x
      )
    );
    setCars((prev) =>
      prev.map((c) => {
        const same =
          (b.carId && c.id === b.carId) ||
          (!b.carId &&
            ((b.carPlate && c.licensePlate === b.carPlate) ||
              (b.carName && c.name === b.carName)));
        return same ? { ...c, status: "ถูกยืมอยู่" } : c;
      })
    );
  };

  // NOTE: markCompleted คงเดิม (ตามที่ผู้ใช้ขอให้รถไม่กลับมาปล่อยอัตโนมัติ)
  const markCompleted = (b) => {
    setBookings((prev) =>
      prev.map((x) =>
        x.id === b.id
          ? {
              ...x,
              bookingStatus: "เสร็จสิ้น",
              paymentStatus: "เสร็จสิ้น",
              returnedAt: toISO(new Date()),
            }
          : x
      )
    );
    setCars((prev) =>
      prev.map((c) => {
        const same =
          (b.carId && c.id === b.carId) ||
          (!b.carId &&
            ((b.carPlate && c.licensePlate === b.carPlate) ||
              (b.carName && c.name === b.carName)));
        return same ? { ...c, status: "ซ่อมแซม" } : c;
      })
    );
  };

  const handleCancel = (b) => {
    setBookings((prev) =>
      prev.map((x) =>
        x.id === b.id
          ? {
              ...x,
              bookingStatus: "ยกเลิก",
              paymentStatus: "ยกเลิก",
            }
          : x
      )
    );
  };

  /* ---- Edit Booking Modal (Full + Slip Upload) ---- */
  const [bkEditOpen, setBkEditOpen] = useState(false);
  const [bkEditId, setBkEditId] = useState(null);
  const [bkEditForm, setBkEditForm] = useState({
    bookingCode: "",
    customerName: "",
    customerPhone: "",
    verifyType: "",
    carId: "",
    carName: "",
    carPlate: "",
    pricePerDay: "",
    pickupLocation: "",
    pickupTime: "",
    returnLocation: "",
    returnTime: "",
    discount: "",
    deposit: "",
    channel: "",
    notes: "",
    paymentStatus: "รอชำระ",
    bookingStatus: "รอชำระ",
    extrasText: "",
    slipImage: "",
  });
  const slipRef = useRef(null);

  const openBkEdit = (b) => {
    const car =
      (b.carId && carMapById.get(b.carId)) ||
      carMapByKey.get(b.carPlate || b.carName);
    const extrasText = (b.extras || [])
      .map((e) => `${e.name ?? ""}:${e.price ?? 0}`)
      .join("\n");
    setBkEditId(b.id);
    setBkEditForm({
      bookingCode: b.bookingCode || "",
      customerName: b.customerName || "",
      customerPhone: b.customerPhone || "",
      verifyType: b.verifyType || "",
      carId: car?.id ?? b.carId ?? "",
      carName: car?.name || b.carName || "",
      carPlate: car?.licensePlate || b.carPlate || "",
      pricePerDay: b.pricePerDay || car?.pricePerDay || "",
      pickupLocation: b.pickupLocation || "",
      pickupTime: isoToLocalInputPreserve(b.pickupTime),
      returnLocation: b.returnLocation || "",
      returnTime: isoToLocalInputPreserve(b.returnTime),
      discount: b.discount ?? "",
      deposit: b.deposit ?? "",
      channel: b.channel || "",
      notes: b.notes || "",
      paymentStatus: b.paymentStatus || "รอชำระ",
      bookingStatus: b.bookingStatus || "รอชำระ",
      extrasText,
      slipImage: b.slipImage || "",
    });
    setBkEditOpen(true);
  };
  const closeBkEdit = () => {
    setBkEditOpen(false);
    setBkEditId(null);
    if (slipRef.current) slipRef.current.value = "";
  };
  const handleBkEditChange = (e) => {
    const { name, value } = e.target;

    // เปลี่ยนรถตาม carId (เสถียรกว่า plate/name)
    if (name === "carId") {
      const car = carMapById.get(Number(value));
      setBkEditForm((p) => ({
        ...p,
        carId: value,
        carName: car?.name || p.carName,
        carPlate: car?.licensePlate || p.carPlate,
        pricePerDay: car?.pricePerDay ?? p.pricePerDay,
      }));
      return;
    }

    // บังคับความสอดคล้อง: payment "รอชำระ" → booking "รอชำระ"
    if (name === "paymentStatus") {
      const next = value;
      setBkEditForm((p) => ({
        ...p,
        paymentStatus: next,
        bookingStatus: next === "รอชำระ" ? "รอชำระ" : p.bookingStatus,
      }));
      return;
    }

    setBkEditForm((p) => ({ ...p, [name]: value }));
  };
  const handleSlipChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setBkEditForm((p) => ({ ...p, slipImage: "" }));
      return;
    }
    readImageSafe(f, function () {
      setBkEditForm((p) => ({ ...p, slipImage: String(this.result || "") }));
    });
  };
  const parseExtras = (text) => {
    const lines = (text || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const arr = lines.map((ln) => {
      const [name, price] = ln.split(":");
      return { name: (name || "").trim(), price: Number(price || 0) };
    });
    return arr;
  };
  const handleBkEditSubmit = (e) => {
    e.preventDefault();

    if (!bkEditForm.carId) {
      alert("กรุณาเลือกรถ");
      return;
    }

    const pickISO = localToIsoPreserveWallTime(bkEditForm.pickupTime);
    const retISO = localToIsoPreserveWallTime(bkEditForm.returnTime);
    if (!pickISO || !retISO || new Date(retISO) <= new Date(pickISO)) {
      alert("กรุณาตรวจสอบวันเวลา รับ/คืนรถ (คืนต้องช้ากว่ารับ)");
      return;
    }

    // กันซ้อนช่วงเวลา — เข้มขึ้น: ชนกับทุก booking ที่ยังไม่ปิด
    const targetId = Number(bkEditForm.carId);
    const overlaps = bookings.some((x) => {
      if (x.id === bkEditId) return false;

      // เทียบด้วย carId เป็นหลัก
      const xId = typeof x.carId === "number" ? x.carId : null;

      let sameCar = false;
      if (xId != null) {
        sameCar = xId === targetId;
      } else {
        // fallback สำหรับ booking เก่าที่ยังไม่มี carId
        const car = carMapById.get(targetId);
        const xKey = x.carPlate || x.carName || "";
        const targetKey = car?.licensePlate || car?.name || "";
        sameCar = xKey && targetKey && xKey === targetKey;
      }
      if (!sameCar) return false;

      const lc = getLifecycle(x, now);
      if ([LIFECYCLE.CANCELLED, LIFECYCLE.DONE].includes(lc)) return false;

      const aStart = new Date(pickISO);
      const aEnd = new Date(retISO);
      const bStart = new Date(x.pickupTime);
      const bEnd = new Date(x.returnTime);
      return isOverlap(aStart, aEnd, bStart, bEnd);
    });

    if (overlaps) {
      alert(
        "ช่วงเวลานี้มีการจองซ้อนสำหรับรถคันนี้ กรุณาเลือกเวลาอื่นหรือเปลี่ยนคัน"
      );
      return;
    }

    const extras = parseExtras(bkEditForm.extrasText);
    const car = carMapById.get(Number(bkEditForm.carId));

    const normalizedPayment = bkEditForm.paymentStatus;
    const normalizedBooking =
      normalizedPayment === "รอชำระ"
        ? "รอชำระ"
        : bkEditForm.bookingStatus || "ยืนยันแล้ว";

    setBookings((prev) =>
      prev.map((x) =>
        x.id === bkEditId
          ? {
              ...x,
              bookingCode: bkEditForm.bookingCode,
              customerName: bkEditForm.customerName,
              customerPhone: bkEditForm.customerPhone,
              verifyType: bkEditForm.verifyType,
              carId: car?.id ?? Number(bkEditForm.carId),
              carName: car?.name || bkEditForm.carName,
              carPlate: car?.licensePlate || bkEditForm.carPlate,
              pricePerDay:
                Number(bkEditForm.pricePerDay) || Number(car?.pricePerDay || 0),
              pickupLocation: bkEditForm.pickupLocation,
              pickupTime: pickISO,
              returnLocation: bkEditForm.returnLocation,
              returnTime: retISO,
              discount: Number(bkEditForm.discount) || 0,
              deposit: Number(bkEditForm.deposit) || 0,
              channel: bkEditForm.channel,
              notes: bkEditForm.notes,
              paymentStatus: normalizedPayment,
              bookingStatus: normalizedBooking,
              extras,
              slipImage: bkEditForm.slipImage || "",
            }
          : x
      )
    );
    closeBkEdit();
  };

  /* employee mock */
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
        <div className="mx-auto max-w-7xl grid grid-cols-12 gap-6 px-2 sm:px-4">
          {/* Employee card */}
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

                {/* Today summary */}
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

          {/* Add car */}
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
                    <option value="ซ่อมแซม">ซ่อมแซม</option>
                  </select>
                </div>

                <div className="xl:col-span-2">
                  <label className="block text-xs font-semibold text-black mb-1">
                    รูปรถ (อัปโหลด)
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-gray-800 hover:file:bg-gray-50"
                  />
                  {form.imageData ? (
                    <div className="mt-2">
                      <img
                        src={form.imageData}
                        alt="ตัวอย่างรูปรถ"
                        className="h-24 w-full max-w-[180px] rounded-lg border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, imageData: "" }));
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="mt-2 text-xs text-gray-600 underline"
                      >
                        ลบรูป
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      รองรับไฟล์ .jpg, .png, .webp (≤ {MAX_FILE_MB}MB)
                    </p>
                  )}
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

          {/* Tables */}
          <section className="col-span-12">
            <div className="grid grid-cols-1 gap-6">
              {/* Car table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-black">ตารางรถ</h2>
                  <div className="text-sm text-gray-600">
                    ทั้งหมด {cars.length} คัน
                  </div>
                </div>

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
                      <option value="ซ่อมแซม">ซ่อมแซม</option>
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
                        const displayStatus = getCarRowStatus(c, bookings, now);

                        const hideNext = [
                          "ซ่อมแซม",
                          "ถูกยืมอยู่",
                          "เลยกำหนดรับ",
                          "เลยกำหนดส่ง",
                        ].includes(displayStatus);

                        const nb = hideNext
                          ? null
                          : nextBookingMap[c.id] ||
                            nextBookingMap[c.licensePlate || c.name] ||
                            null;

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
                              <StatusBadge value={displayStatus} />
                            </td>
                            <td className="py-3 pr-3 text-gray-700">
                              {nb ? (
                                <div className="leading-tight">
                                  <div className="font-medium">
                                    {nb.bookingCode}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {fmtDateTimeLocal(nb.pickupTime)} →{" "}
                                    {fmtDateTimeLocal(nb.returnTime)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            {/* FIX: เอา <td> ซ้อน <td> ออก */}
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
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Booking table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-black">
                    ตารางการจองของลูกค้า
                  </h2>
                  <span className="text-sm text-gray-600">
                    ทั้งหมด {bookings.length} รายการ
                  </span>
                </div>

                {/* filters */}
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
                      <option>รอรับ</option>
                      <option>ยกเลิก</option>
                      <option>เสร็จสิ้น</option>
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
                      <option>ยกเลิก</option>
                      <option>เสร็จสิ้น</option>
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

                {/* table */}
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
                        const lc = getLifecycle(b, now);
                        const car =
                          (b.carId && carMapById.get(b.carId)) ||
                          carMapByKey.get(b.carPlate || b.carName);
                        return (
                          <tr key={b.id} className="align-middle">
                            <td className="py-3 pr-3 text-gray-700">
                              <div className="leading-tight">
                                <div>{fmtDateTimeLocal(b.pickupTime)}</div>
                                <div className="text-xs text-gray-500">
                                  → {fmtDateTimeLocal(b.returnTime)}
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
                              {(car?.name || b.carName || "—") +
                                (" / " +
                                  (car?.licensePlate || b.carPlate || "—"))}
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
                              <BookingBadge value={lc} />
                            </td>
                            <td className="py-3 pr-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => openBkEdit(b)}
                                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                                >
                                  แก้ไข
                                </button>

                                <button
                                  onClick={() => openDetail(b)}
                                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                                >
                                  รายละเอียด
                                </button>

                                {b.paymentStatus !== "ชำระแล้ว" &&
                                  !["ยกเลิก", "เสร็จสิ้น"].includes(
                                    b.bookingStatus
                                  ) && (
                                    <button
                                      onClick={() => handleMarkPaid(b)}
                                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                                    >
                                      ชำระแล้ว
                                    </button>
                                  )}

                                {[
                                  LIFECYCLE.WAIT_PICKUP,
                                  LIFECYCLE.PICKUP_OVERDUE,
                                ].includes(lc) &&
                                  !["ยกเลิก", "เสร็จสิ้น"].includes(
                                    b.bookingStatus
                                  ) && (
                                    <button
                                      onClick={() => handleConfirmPickup(b)}
                                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                                    >
                                      รับสำเร็จ
                                    </button>
                                  )}

                                {[
                                  LIFECYCLE.IN_USE,
                                  LIFECYCLE.RETURN_OVERDUE,
                                ].includes(lc) &&
                                  !["ยกเลิก", "เสร็จสิ้น"].includes(
                                    b.bookingStatus
                                  ) && (
                                    <button
                                      onClick={() => markCompleted(b)}
                                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                                    >
                                      คืนสำเร็จ
                                    </button>
                                  )}

                                {!["ยกเลิก", "เสร็จสิ้น"].includes(
                                  b.bookingStatus
                                ) &&
                                  ![
                                    LIFECYCLE.IN_USE,
                                    LIFECYCLE.RETURN_OVERDUE,
                                  ].includes(lc) && (
                                    <button
                                      onClick={() => handleCancel(b)}
                                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400"
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

      {/* ----- Modal แก้ไขรถ ----- */}
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
                  <option value="ซ่อมแซม">ซ่อมแซม</option>
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

      {/* ----- Modal รายละเอียดการจอง (โชว์สลิป mockup) ----- */}
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

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black">
              <div>
                <div>
                  ลูกค้า: <b>{detailItem.customerName}</b>
                </div>
                <div>โทร: {detailItem.customerPhone}</div>
                <div>เอกสาร: {detailItem.verifyType}</div>
                <div>ช่องทางจอง: {detailItem.channel || "-"}</div>
                <div>สร้างเมื่อ: {fmtDateTimeLocal(detailItem.createdAt)}</div>
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

            <div className="mt-3 text-sm text-black">
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
                      <div className="mb-1">
                        ชำระเงิน: <PayBadge value={detailItem.paymentStatus} />
                      </div>
                      <div className="mb-1">
                        สถานะ:{" "}
                        <BookingBadge value={getLifecycle(detailItem, now)} />
                      </div>
                      <div className="font-semibold">
                        รวมสุทธิ: {fmtBaht(c.total)} ฿
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* หมายเหตุ */}
            <div className="mt-4 rounded-lg border bg-gray-200 p-3">
              <div className="text-xs font-semibold text-gray-700 mb-1">
                หมายเหตุจากลูกค้า
              </div>
              <div className="text-sm text-black whitespace-pre-wrap">
                {detailItem?.notes?.trim() || "—"}
              </div>
            </div>

            {/* สลิปชำระเงิน (Mockup) */}
            <div className="mt-4">
              <div className="text-xs font-semibold text-gray-700 mb-1">
                สลิปชำระเงิน (Mockup)
              </div>
              {detailItem.slipImage ? (
                <img
                  src={detailItem.slipImage}
                  alt="สลิปชำระเงิน"
                  className="w-full max-w-sm rounded-lg border object-contain"
                />
              ) : (
                <div className="w-full max-w-sm h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                  — ยังไม่มีสลิป —
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2 text-black">
              {/* ทำเครื่องหมายชำระแล้ว */}
              {detailItem.paymentStatus !== "ชำระแล้ว" &&
                !["ยกเลิก", "เสร็จสิ้น"].includes(detailItem.bookingStatus) && (
                  <button
                    onClick={() => {
                      handleMarkPaid(detailItem);
                      closeDetail();
                    }}
                    className="px-4 py-2 rounded-lg border"
                  >
                    ทำเครื่องหมายชำระแล้ว
                  </button>
                )}

              {/* รับสำเร็จ */}
              {[LIFECYCLE.WAIT_PICKUP, LIFECYCLE.PICKUP_OVERDUE].includes(
                getLifecycle(detailItem, now)
              ) &&
                !["ยกเลิก", "เสร็จสิ้น"].includes(detailItem.bookingStatus) && (
                  <button
                    onClick={() => {
                      handleConfirmPickup(detailItem);
                      closeDetail();
                    }}
                    className="px-4 py-2 rounded-lg border"
                  >
                    รับสำเร็จ
                  </button>
                )}

              {/* คืนสำเร็จ */}
              {[LIFECYCLE.IN_USE, LIFECYCLE.RETURN_OVERDUE].includes(
                getLifecycle(detailItem, now)
              ) &&
                !["ยกเลิก", "เสร็จสิ้น"].includes(detailItem.bookingStatus) && (
                  <button
                    onClick={() => {
                      markCompleted(detailItem);
                      closeDetail();
                    }}
                    className="px-4 py-2 rounded-lg bg-black text-white"
                  >
                    คืนสำเร็จ
                  </button>
                )}

              {/* ยกเลิก */}
              {!["ยกเลิก", "เสร็จสิ้น"].includes(detailItem.bookingStatus) &&
                ![LIFECYCLE.IN_USE, LIFECYCLE.RETURN_OVERDUE].includes(
                  getLifecycle(detailItem, now)
                ) && (
                  <button
                    onClick={() => {
                      handleCancel(detailItem);
                      closeDetail();
                    }}
                    className="px-4 py-2 rounded-lg border"
                  >
                    ยกเลิกการจอง
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ----- Modal แก้ไขการจอง (Full + Slip Upload) ----- */}
      {bkEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeBkEdit} />
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">แก้ไขการจอง</h3>
              <button
                onClick={closeBkEdit}
                className="text-gray-500 hover:text-gray-700"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleBkEditSubmit}
              className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3 text-sm"
            >
              {/* Customer */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  รหัสจอง
                </label>
                <input
                  name="bookingCode"
                  value={bkEditForm.bookingCode}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  เอกสารยืนยัน
                </label>
                <input
                  name="verifyType"
                  value={bkEditForm.verifyType}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  ชื่อลูกค้า
                </label>
                <input
                  name="customerName"
                  value={bkEditForm.customerName}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  เบอร์โทร
                </label>
                <input
                  name="customerPhone"
                  value={bkEditForm.customerPhone}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>

              {/* Car */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  เลือกรถ
                </label>
                <select
                  name="carId"
                  value={String(bkEditForm.carId || "")}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                >
                  <option value="">— เลือกรถ —</option>
                  {cars.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} {c.licensePlate ? `(${c.licensePlate})` : ""} —{" "}
                      {fmtBaht(c.pricePerDay)}฿/วัน
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  ราคา/วัน (บาท)
                </label>
                <input
                  type="number"
                  name="pricePerDay"
                  min="0"
                  value={bkEditForm.pricePerDay}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black placeholder:text-gray-400"
                />
              </div>

              {/* Locations */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  สถานที่รับรถ
                </label>
                <input
                  name="pickupLocation"
                  value={bkEditForm.pickupLocation}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  สถานที่คืนรถ
                </label>
                <input
                  name="returnLocation"
                  value={bkEditForm.returnLocation}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>

              {/* Times */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  วัน–เวลา รับรถ
                </label>
                <input
                  type="datetime-local"
                  name="pickupTime"
                  value={bkEditForm.pickupTime}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  วัน–เวลา คืนรถ
                </label>
                <input
                  type="datetime-local"
                  name="returnTime"
                  value={bkEditForm.returnTime}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>

              {/* Money */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-black mb-1">
                  ส่วนลด (บาท)
                </label>
                <input
                  type="number"
                  name="discount"
                  min="0"
                  value={bkEditForm.discount}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-black mb-1">
                  มัดจำ (บาท)
                </label>
                <input
                  type="number"
                  name="deposit"
                  min="0"
                  value={bkEditForm.deposit}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-black mb-1">
                  ช่องทาง
                </label>
                <input
                  name="channel"
                  value={bkEditForm.channel}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>

              {/* Status */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  สถานะชำระเงิน
                </label>
                <select
                  name="paymentStatus"
                  value={bkEditForm.paymentStatus}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                >
                  <option>รอชำระ</option>
                  <option>ชำระแล้ว</option>
                  <option>ยกเลิก</option>
                  <option>เสร็จสิ้น</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-black mb-1">
                  สถานะการจอง
                </label>
                <select
                  name="bookingStatus"
                  value={bkEditForm.bookingStatus}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                >
                  <option>รอชำระ</option>
                  <option>ยืนยันแล้ว</option>
                  <option>รอรับ</option>
                  <option>ยกเลิก</option>
                  <option>เสร็จสิ้น</option>
                </select>
              </div>

              {/* Extras as text */}
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-black mb-1">
                  ออปชันเสริม (name:price ต่อบรรทัด)
                </label>
                <textarea
                  name="extrasText"
                  rows={3}
                  value={bkEditForm.extrasText}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black placeholder:text-gray-400"
                  placeholder="คาร์ซีท:100&#10;GPS:60"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-black mb-1">
                  หมายเหตุ
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  value={bkEditForm.notes}
                  onChange={handleBkEditChange}
                  className="w-full rounded-lg border border-gray-400 px-3 py-2 text-black"
                />
              </div>

              {/* Slip upload (mock) */}
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-black mb-1">
                  สลิปโอนเงิน (Mockup)
                </label>
                <input
                  ref={slipRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSlipChange}
                  className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-gray-800 hover:file:bg-gray-50"
                />
                {bkEditForm.slipImage ? (
                  <div className="mt-2">
                    <img
                      src={bkEditForm.slipImage}
                      alt="สลิป"
                      className="h-40 w-auto rounded-lg border object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBkEditForm((p) => ({ ...p, slipImage: "" }));
                        if (slipRef.current) slipRef.current.value = "";
                      }}
                      className="mt-2 text-xs text-gray-600 underline"
                    >
                      ลบสลิป
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    แนบเพื่อทดสอบการแสดงผลในหน้า “รายละเอียดการจอง”
                  </p>
                )}
              </div>

              <div className="md:col-span-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeBkEdit}
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
    </div>
  );
}
