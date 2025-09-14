// components/admin/Badges.jsx
import { cls } from "./utils";

/** แปลง (TH -> EN) และ normalize ให้รับได้ทั้งไทย/อังกฤษ */
const TH_EN_MAP = {
  // Car status
  ว่าง: "Available",
  ถูกยืมอยู่: "In Use",
  ซ่อมแซม: "Maintenance",
  รอส่ง: "Pending Delivery",
  เลยกำหนดรับ: "Pickup Overdue",
  เลยกำหนดส่ง: "Return Overdue",
  // Booking status
  ยืนยันแล้ว: "Confirmed",
  รอรับ: "Waiting Pickup",
  กำลังเช่า: "In Use",
  เลยกำหนดคืน: "Return Overdue",
  ยกเลิก: "Cancelled",
  เสร็จสิ้น: "Completed",
  // Payment status
  ชำระแล้ว: "Paid",
  รอชำระ: "Pending Payment",
};

const toEnglish = (v = "") => TH_EN_MAP[v] || v;
const lc = (s = "") => s.toLowerCase();
const isPendingPayment = (v = "") =>
  ["รอชำระ", "pending payment", "pending", "unpaid"].includes(lc(toEnglish(v)));

/* -------------------- Car Status Badge -------------------- */
export const StatusBadge = ({ value }) => {
  const en = toEnglish(value);
  const s = lc(en);

  const color =
    s === "available"
      ? "bg-green-100 text-green-800"
      : s === "in use" || s === "rented" || s === "in-use"
      ? "bg-red-100 text-red-800"
      : s === "maintenance"
      ? "bg-amber-100 text-amber-800"
      : s === "pending delivery"
      ? "bg-blue-100 text-blue-800"
      : s === "pickup overdue"
      ? "bg-orange-100 text-orange-800"
      : s === "return overdue"
      ? "bg-rose-100 text-rose-800"
      : "bg-gray-100 text-gray-700";

  return (
    <span
      className={cls(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        color
      )}
    >
      {en}
    </span>
  );
};

/* -------------------- Booking Badge -------------------- */
export const BookingBadge = ({ value }) => {
  // ซ่อนสถานะ Pending Payment
  if (isPendingPayment(value)) return null;

  const en = toEnglish(value);
  const s = lc(en);

  const color =
    s === "confirmed" || s === "waiting pickup"
      ? "bg-emerald-100 text-emerald-800"
      : s === "in use" || s === "in-use"
      ? "bg-indigo-100 text-indigo-800"
      : s === "pickup overdue" || s === "return overdue"
      ? "bg-rose-100 text-rose-800"
      : s === "cancelled"
      ? "bg-gray-200 text-gray-700"
      : s === "completed"
      ? "bg-sky-100 text-sky-800"
      : "bg-gray-100 text-gray-700";

  return (
    <span
      className={cls(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        color
      )}
    >
      {en}
    </span>
  );
};

/* -------------------- Payment Badge -------------------- */
export const PayBadge = ({ value }) => {
  // ซ่อนสถานะ Pending Payment
  if (isPendingPayment(value)) return null;

  const en = toEnglish(value);
  const s = lc(en);

  const color =
    s === "paid"
      ? "bg-emerald-100 text-emerald-800"
      : s === "completed"
      ? "bg-sky-100 text-sky-800"
      : s === "cancelled"
      ? "bg-gray-200 text-gray-700"
      : "bg-gray-100 text-gray-700";

  return (
    <span
      className={cls(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        color
      )}
    >
      {en}
    </span>
  );
};
