"use client";

import { useEffect, useMemo, useState } from "react";

/* ───────── helpers ───────── */
const toDate = (val) => {
  if (!val) return null;
  const s = String(val).trim();
  const isoish = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(isoish);
  return isNaN(d.getTime()) ? null : d;
};
const fmtDateTimeLocal = (val) => {
  const d = toDate(val);
  if (!d) return "-";
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const computeDays = (a, b) => {
  const A = toDate(a);
  const B = toDate(b);
  if (!A || !B) return 1;
  const diff = Math.ceil((B - A) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
};
const fmtBaht = (n) => Number(n || 0).toLocaleString("th-TH");

/* ───────── badges ───────── */
function PayBadge({ value }) {
  const v = String(value || "")
    .toLowerCase()
    .trim();
  return v === "paid" ? (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
      ชำระแล้ว
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
      –
    </span>
  );
}
function BookingBadge({ value }) {
  const v = String(value || "")
    .toLowerCase()
    .trim();
  const MAP = {
    confirmed: { label: "ยืนยันแล้ว", cls: "bg-sky-100 text-sky-800" },
    "waiting pickup": { label: "รอรับ", cls: "bg-amber-100 text-amber-800" },
    "pickup overdue": {
      label: "เลยกำหนดรับ",
      cls: "bg-rose-100 text-rose-800",
    },
    "in use": { label: "กำลังเช่า", cls: "bg-indigo-100 text-indigo-800" },
    "return overdue": {
      label: "เลยกำหนดคืน",
      cls: "bg-rose-100 text-rose-800",
    },
    cancelled: { label: "ยกเลิก", cls: "bg-slate-200 text-slate-700" },
    completed: { label: "เสร็จสิ้น", cls: "bg-violet-100 text-violet-800" },
  };
  const m = MAP[v] || {
    label: value || "-",
    cls: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

/* ───────── normalize record ───────── */
function normalizeRental(rec) {
  const pickupTime =
    rec?.pickup_date ||
    rec?.pickup_time ||
    rec?.start_date ||
    rec?.start_time ||
    null;
  const returnTime =
    rec?.return_date ||
    rec?.dropoff_date ||
    rec?.end_date ||
    rec?.return_time ||
    null;

  const bookingCode =
    rec?.booking_code ||
    rec?.rental_no ||
    rec?.name ||
    rec?.id ||
    rec?.code ||
    "-";
  const customerName =
    rec?.customer_name ||
    rec?.customer ||
    `${rec?.customer_first_name ?? ""} ${
      rec?.customer_last_name ?? ""
    }`.trim() ||
    "-";
  const customerPhone =
    rec?.customer_phone || rec?.phone || rec?.mobile_no || rec?.mobile || "";

  const carName =
    rec?.vehicle || rec?.car_name || rec?.car || rec?.vehicle_name || "-";
  const carPlate = rec?.license_plate || rec?.car_plate || rec?.plate || "";

  const pricePerDay =
    Number(
      rec?.price_per_day ??
        rec?.daily_rate ??
        rec?.rate ??
        rec?.price ??
        rec?.base_price_per_day ??
        0
    ) || 0;

  const discount = Number(rec?.discount ?? rec?.discount_amount ?? 0) || 0;
  const addon = Number(rec?.extras_total ?? rec?.additional_total ?? 0) || 0;

  const daysFallback = computeDays(pickupTime, returnTime);
  const totalComputed = pricePerDay * daysFallback + addon - discount;

  const total =
    Number(
      rec?.total_price ??
        rec?.grand_total ??
        rec?.net_total ??
        rec?.amount ??
        totalComputed
    ) || totalComputed;

  const payRaw = String(
    rec?.payment_status || rec?.pay_status || rec?.payment || ""
  ).toLowerCase();
  const paymentStatus = payRaw.includes("paid") ? "paid" : "";

  let bookingStatus = String(rec?.status || rec?.booking_status || "")
    .toLowerCase()
    .trim();

  return {
    id: bookingCode,
    bookingCode,
    customerName,
    customerPhone,
    carName,
    carPlate,
    pricePerDay,
    pickupTime,
    returnTime,
    paymentStatus,
    bookingStatus,
    discount,
    addon,
    total,
    pickupLocation: rec?.pickup_location || rec?.pickup_place || "",
    returnLocation: rec?.return_location || rec?.return_place || "",
    channel: rec?.contact_platform || rec?.source || "",
    docType: rec?.id_document_type || "",
    note: rec?.note || "",
  };
}

/* ───────── lifecycle (stage) ───────── */
function getLifecycle(row, now = new Date()) {
  const status = String(row.bookingStatus || "")
    .toLowerCase()
    .trim();
  const pickup = toDate(row.pickupTime);
  const drop = toDate(row.returnTime);

  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";

  if (status === "in use") {
    if (drop && now > drop) return "return overdue";
    return "in use";
  }
  if (status === "waiting pickup" || status === "confirmed") {
    if (pickup && now > pickup) return "pickup overdue";
    return "waiting pickup";
  }

  if (pickup && now > pickup) return "pickup overdue";
  if (drop && now > drop) return "return overdue";
  return status || "confirmed";
}

/* ───────── options ───────── */
const STATUS_OPTIONS = [
  { value: "", label: "ทั้งหมด" },
  { value: "waiting pickup", label: "รอรับ" },
  { value: "pickup overdue", label: "เลยกำหนดรับ" },
  { value: "in use", label: "กำลังเช่า" },
  { value: "return overdue", label: "เลยกำหนดคืน" },
  { value: "cancelled", label: "ยกเลิก" },
  { value: "completed", label: "เสร็จสิ้น" },
];
const DOC_TYPES = ["บัตรประชาชน", "หนังสือเดินทาง", "ใบขับขี่"];

/* API mapping UI ↔ ERP strings */
const UI_TO_API_STATUS = {
  confirmed: "Confirmed",
  "waiting pickup": "Waiting Pickup",
  "pickup overdue": "Pickup Overdue",
  "in use": "In Use",
  "return overdue": "Return Overdue",
  cancelled: "Cancelled",
  completed: "Completed",
};
const API_TO_UI_STATUS = Object.fromEntries(
  Object.entries(UI_TO_API_STATUS).map(([k, v]) => [v.toLowerCase(), k])
);

/* ───────── Edit Modal ───────── */
function EditModal({ open, data, carOptions = [], onClose, onSaved }) {
  const [form, setForm] = useState(data || {});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setForm(data || {});
    setErr("");
  }, [data]);

  if (!open) return null;

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleSave = async () => {
    try {
      setSaving(true);
      setErr("");

      const uiStatus = String(form.bookingStatus || "")
        .toLowerCase()
        .trim();
      const apiStatus = UI_TO_API_STATUS[uiStatus];
      if (apiStatus && form.bookingCode) {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        const body = JSON.stringify({
          vid: form.bookingCode,
          status: apiStatus,
        });

        const res = await fetch(
          "https://demo.erpeazy.com/api/method/erpnext.api.edit_rentals_status",
          {
            method: "POST",
            headers,
            body,
            redirect: "follow",
            credentials: "include",
          }
        );
        const text = await res.text();
        if (!res.ok) throw new Error(text || "เปลี่ยนสถานะไม่สำเร็จ");
      }

      onSaved?.(form);
      onClose?.();
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  // ทำให้ตัวอักษรชัดเจนทุกช่อง
  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 " +
    "placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black " +
    "disabled:bg-gray-100 disabled:text-gray-500";
  const labelCls = "text-xs font-semibold text-black mb-1";

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl">
        {/* header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-black">แก้ไขการจอง</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* รหัสจอง / เอกสารยืนยัน */}
            <div>
              <div className={labelCls}>รหัสจอง</div>
              <input
                value={form.bookingCode || ""}
                disabled
                className={inputCls}
              />
            </div>
            <div>
              <div className={labelCls}>เอกสารยืนยัน</div>
              <select
                value={form.docType || "บัตรประชาชน"}
                onChange={(e) => set("docType", e.target.value)}
                className={inputCls}
              >
                {DOC_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* ชื่อลูกค้า / เบอร์โทร */}
            <div>
              <div className={labelCls}>ชื่อลูกค้า</div>
              <input
                value={form.customerName || ""}
                onChange={(e) => set("customerName", e.target.value)}
                className={inputCls}
                placeholder="ชื่อลูกค้า"
              />
            </div>
            <div>
              <div className={labelCls}>เบอร์โทร</div>
              <input
                value={form.customerPhone || ""}
                onChange={(e) => set("customerPhone", e.target.value)}
                className={inputCls}
                placeholder="เบอร์โทร"
              />
            </div>

            {/* เลือกรถ / ราคา/วัน */}
            <div>
              <div className={labelCls}>เลือกรถ</div>
              <select
                value={`${form.carName || ""}|${form.carPlate || ""}|${
                  form.pricePerDay ?? 0
                }`}
                onChange={(e) => {
                  const [name, plate, price] = e.target.value.split("|");
                  set("carName", name);
                  set("carPlate", plate);
                  set("pricePerDay", Number(price || 0));
                }}
                className={inputCls}
              >
                {(Array.isArray(carOptions) && carOptions.length
                  ? carOptions
                  : [
                      {
                        name: form.carName || "ไม่ระบุ",
                        plate: form.carPlate || "",
                        pricePerDay: form.pricePerDay ?? 0,
                      },
                    ]
                ).map((c) => (
                  <option
                    key={`${c.name}|${c.plate}`}
                    value={`${c.name}|${c.plate}|${c.pricePerDay ?? 0}`}
                  >
                    {`${c.name}${c.plate ? ` (${c.plate})` : ""} — ${fmtBaht(
                      c.pricePerDay ?? 0
                    )}฿/วัน`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className={labelCls}>ราคา/วัน (บาท)</div>
              <input
                type="number"
                value={form.pricePerDay ?? 0}
                onChange={(e) =>
                  set("pricePerDay", Number(e.target.value || 0))
                }
                className={inputCls}
              />
            </div>

            {/* สถานที่รับ/คืน */}
            <div>
              <div className={labelCls}>สถานที่รับรถ</div>
              <input
                value={form.pickupLocation || ""}
                onChange={(e) => set("pickupLocation", e.target.value)}
                className={inputCls}
                placeholder="สถานที่รับรถ"
              />
            </div>
            <div>
              <div className={labelCls}>สถานที่คืนรถ</div>
              <input
                value={form.returnLocation || ""}
                onChange={(e) => set("returnLocation", e.target.value)}
                className={inputCls}
                placeholder="สถานที่คืนรถ"
              />
            </div>

            {/* วัน-เวลา รับ/คืน */}
            <div>
              <div className={labelCls}>วัน-เวลา รับรถ</div>
              <input
                type="datetime-local"
                value={(form.pickupTime || "").replace(" ", "T").slice(0, 16)}
                onChange={(e) => set("pickupTime", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <div className={labelCls}>วัน-เวลา คืนรถ</div>
              <input
                type="datetime-local"
                value={(form.returnTime || "").replace(" ", "T").slice(0, 16)}
                onChange={(e) => set("returnTime", e.target.value)}
                className={inputCls}
              />
            </div>

            {/* ส่วนลด / ช่องทาง */}
            <div>
              <div className={labelCls}>ส่วนลด (บาท)</div>
              <input
                type="number"
                value={form.discount ?? 0}
                onChange={(e) => set("discount", Number(e.target.value || 0))}
                className={inputCls}
              />
            </div>
            <div>
              <div className={labelCls}>ช่องทาง</div>
              <input
                value={form.channel || ""}
                onChange={(e) => set("channel", e.target.value)}
                className={inputCls}
                placeholder="เช่น website, Line, walk-in"
              />
            </div>

            {/* ชำระเงิน / สถานะการจอง */}
            <div>
              <div className={labelCls}>สถานะชำระเงิน</div>
              <select
                value={form.paymentStatus || ""}
                onChange={(e) => set("paymentStatus", e.target.value)}
                className={inputCls}
              >
                <option value="paid">ชำระแล้ว</option>
              </select>
            </div>
            <div>
              <div className={labelCls}>สถานะการจอง</div>
              <select
                value={
                  String(form.bookingStatus || "").toLowerCase() || "confirmed"
                }
                onChange={(e) => set("bookingStatus", e.target.value)}
                className={inputCls}
              >
                <option value="waiting pickup">รอรับ</option>
                <option value="pickup overdue">เลยกำหนดรับ</option>
                <option value="in use">กำลังเช่า</option>
                <option value="return overdue">เลยกำหนดคืน</option>
                <option value="cancelled">ยกเลิก</option>
                <option value="completed">เสร็จสิ้น</option>
              </select>
            </div>

            {/* หมายเหตุ */}
            <div className="md:col-span-2">
              <div className={labelCls}>หมายเหตุ</div>
              <textarea
                rows={4}
                value={form.note || ""}
                onChange={(e) => set("note", e.target.value)}
                className={inputCls}
                placeholder="รายละเอียดเพิ่มเติม"
              />
            </div>

            {/* ไฟล์ mockup */}
            <div className="md:col-span-2">
              <div className={labelCls}>สลิปโอนเงิน (Mockup)</div>
              <input
                type="file"
                className="block w-full text-sm text-slate-900"
              />
              <div className="mt-1 text-[11px] text-gray-500">
                แนบเพื่อทดสอบการแสดงผลในหน้า “รายละเอียดการจอง”
              </div>
            </div>
          </div>

          {err && (
            <div className="mt-3 text-sm text-rose-600">
              เกิดข้อผิดพลาด: {err}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3 text-black">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            disabled={saving}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── ตาราง ───────── */
export default function BookingsTable({
  bookings = [],
  carMapById = new Map(),
  carMapByKey = new Map(),
  onOpenDetail,
  onConfirmPickup,
  onComplete,
  onEdited,
}) {
  const [remoteRows, setRemoteRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // fetch เมื่อไม่มี props
  useEffect(() => {
    if (Array.isArray(bookings) && bookings.length > 0) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(
          "https://demo.erpeazy.com/api/method/erpnext.api.get_rentals_overall",
          { method: "GET", credentials: "include", redirect: "follow" }
        );
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(text);
        }
        const list = Array.isArray(json?.message)
          ? json.message
          : Array.isArray(json)
          ? json
          : [];
        if (!ignore) setRemoteRows(list.map(normalizeRental));
      } catch (e) {
        if (!ignore) setErr(String(e?.message || e));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [bookings]);

  const rows = useMemo(() => {
    if (Array.isArray(bookings) && bookings.length > 0) {
      return bookings.map(normalizeRental);
    }
    return remoteRows;
  }, [bookings, remoteRows]);

  /* ฟิลเตอร์ */
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("");

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return rows.filter((r) => {
      const texts = [
        r.bookingCode,
        r.customerName,
        r.customerPhone,
        r.carName,
        r.carPlate,
        r.pickupLocation,
        r.returnLocation,
        r.channel,
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      const okText = !key || texts.some((t) => t.includes(key));

      const stage = getLifecycle(r, now);
      const okStatus = !statusF || stage === statusF;
      return okText && okStatus;
    });
  }, [rows, q, statusF, now]);

  /* edit modal states */
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const carOptions = useMemo(() => {
    // รวมรายการรถจาก props map หรือจากข้อมูลในตาราง
    const temp = new Map();
    const push = (name, plate, price) => {
      const key = `${name}|${plate}`;
      if (!temp.has(key)) temp.set(key, { name, plate, pricePerDay: price });
    };
    rows.forEach((r) => push(r.carName, r.carPlate, r.pricePerDay));
    carMapByKey.forEach((v, k) =>
      push(v?.name || k, v?.plate || "", v?.pricePerDay || 0)
    );
    carMapById.forEach((v) =>
      push(v?.name || "", v?.plate || "", v?.pricePerDay || 0)
    );
    return [...temp.values()];
  }, [rows, carMapById, carMapByKey]);

  const openEdit = (row) => {
    setEditRow(row);
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  const applyEditedLocal = (newRec) => {
    onEdited?.(newRec);
    if (!(Array.isArray(bookings) && bookings.length > 0)) {
      setRemoteRows((prev) =>
        prev.map((r) =>
          r.id === newRec.id || r.bookingCode === newRec.bookingCode
            ? { ...r, ...newRec }
            : r
        )
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-black">ตารางการจองของลูกค้า</h2>
        <span className="text-sm text-gray-600">
          แสดง {filtered.length} / {rows.length} รายการ
        </span>
      </div>

      {/* filter bar */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 items-end">
        <div>
          <div className="text-xs font-semibold text-slate-700 mb-1">ค้นหา</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="รหัสจอง / ลูกค้า / รถ / ป้าย / สถานที่ / ช่องทาง…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-700 mb-1">
            สถานะการจอง
          </div>
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            setQ("");
            setStatusF("");
          }}
          className="h-[38px] md:h-[40px] rounded-lg border border-slate-300 px-3 text-sm text-slate-900 hover:bg-slate-50"
        >
          ล้างตัวกรอง
        </button>
      </div>

      {loading && <div className="mt-4 text-gray-600">กำลังโหลด...</div>}
      {err && <div className="mt-4 text-red-600">เกิดข้อผิดพลาด: {err}</div>}

      {!loading && !err && (
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
              {filtered.map((b) => {
                const days = computeDays(b.pickupTime, b.returnTime);
                const total = b.total ?? b.pricePerDay * days;
                const life = getLifecycle(b, now);
                const ended = ["cancelled", "completed"].includes(
                  String(b.bookingStatus || "").toLowerCase()
                );
                const canConfirmPickup =
                  (life === "waiting pickup" || life === "pickup overdue") &&
                  !ended;
                const canComplete =
                  (life === "in use" || life === "return overdue") && !ended;

                return (
                  <tr key={b.id}>
                    <td className="py-3 pr-3 text-black">
                      <div>{fmtDateTimeLocal(b.pickupTime)}</div>
                      <div className="text-xs text-gray-500">
                        → {fmtDateTimeLocal(b.returnTime)}
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-medium text-black">
                      {b.bookingCode}
                    </td>
                    <td className="py-3 pr-3 text-black">
                      <div>{b.customerName}</div>
                      <div className="text-xs text-gray-500">
                        {b.customerPhone}
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-black">
                      {(b.carName || "—") + " / " + (b.carPlate || "—")}
                    </td>
                    <td className="py-3 pr-3 text-black">
                      {fmtBaht(b.pricePerDay)} ฿
                    </td>
                    <td className="py-3 pr-3 text-black">{days} วัน</td>
                    <td className="py-3 pr-3 text-black">{fmtBaht(total)} ฿</td>
                    <td className="py-3 pr-3 text-black">
                      <PayBadge value={b.paymentStatus} />
                    </td>
                    <td className="py-3 pr-3">
                      <BookingBadge value={life} />
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openEdit(b)}
                          className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => onOpenDetail?.(b)}
                          className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300"
                          disabled={!onOpenDetail}
                        >
                          รายละเอียด
                        </button>
                        {canConfirmPickup && (
                          <button
                            onClick={() => onConfirmPickup?.(b)}
                            className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300"
                            disabled={!onConfirmPickup}
                          >
                            รับรถ
                          </button>
                        )}
                        {canComplete && (
                          <button
                            onClick={() => onComplete?.(b)}
                            className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300"
                            disabled={!onComplete}
                          >
                            เสร็จสิ้น
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-gray-600">
                    ไม่พบรายการที่ตรงกับตัวกรอง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal แก้ไข */}
      <EditModal
        open={editOpen}
        data={editRow}
        carOptions={carOptions}
        onClose={closeEdit}
        onSaved={applyEditedLocal}
      />
    </div>
  );
}

/* เผื่อไฟล์หน้าอื่น import แบบ named */
export { BookingsTable };
