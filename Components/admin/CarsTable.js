// Components/admin/CarsTable.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "./Badges";
import { fmtBaht, fmtDateTimeLocal } from "./utils";

const MAX_FILE_MB = 3;

/** ───────── ERP CONFIG (ปรับได้) ───────── */
const ERP_DELETE_URL =
  "https://demo.erpeazy.com/api/method/erpnext.api.delete_vehicle";
const ERP_EDIT_URL =
  "https://demo.erpeazy.com/api/method/erpnext.api.edit_vehicles";
// const ERP_AUTH = "token xxx:yyy";

/** ✅ Base URL และตัวช่วยแปลง URL รูป */
const ERP_BASE = process.env.NEXT_PUBLIC_ERP_BASE || "https://demo.erpeazy.com";
function normalizeImage(u) {
  if (!u) return "";
  const s0 = String(u).trim();
  if (/^(data:|blob:)/i.test(s0)) return s0; // ไม่แตะ data: / blob:
  let s = s0;
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("/")) s = ERP_BASE.replace(/\/+$/, "") + s;
  if (!/^https?:\/\//i.test(s)) {
    s = ERP_BASE.replace(/\/+$/, "") + "/" + s.replace(/^\/+/, "");
  }
  return encodeURI(s);
}

export default function CarsTable({
  cars = [],
  bookings = [],
  now = new Date(),
  nextBookingMap = {},
  onEdit,
  onDelete,

  // ✅ default แปลง EN/TH → TH (robust)
  getCarRowStatus = (c) => {
    // เลือกค่าที่ “ไม่ว่างจริงๆ” ตัวแรกจากหลายคีย์
    const firstNonEmpty = (...xs) =>
      xs.find(
        (s) =>
          String(s ?? "")
            .replace(/\u00A0|\u200B|\u200C|\u200D/g, "")
            .trim().length > 0
      );

    const raw0 = firstNonEmpty(
      c?.status,
      c?.stage,
      c?.vehicle_stage,
      c?.car_status,
      c?.status_text,
      ""
    );
    const raw = String(raw0)
      .normalize("NFKC")
      .replace(/\u00A0|\u200B|\u200C|\u200D/g, " ") // NBSP/ZWSP → space
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " "); // squeeze spaces
    const compact = raw.replace(/\s+/g, ""); // "inrent", "inuse" etc.

    // ถูกจอง
    if (
      raw === "in rent" ||
      compact === "inrent" ||
      raw === "ถูกจอง" ||
      raw === "reserved" ||
      raw === "booked"
    )
      return "ถูกจอง";

    // กำลังใช้งาน
    if (
      raw === "in use" ||
      compact === "inuse" ||
      raw === "ถูกยืมอยู่" ||
      raw === "กำลังเช่า" ||
      raw === "rented"
    )
      return "ถูกยืมอยู่";

    // ซ่อมบำรุง
    if (
      raw === "maintenance" ||
      raw === "maintainance" ||
      raw === "ซ่อมบำรุง" ||
      raw === "ซ่อมแซม"
    )
      return "ซ่อมบำรุง";

    // ว่าง
    if (raw === "available" || raw === "ว่าง") return "ว่าง";

    // ไม่รู้จัก → ว่าง (กัน UI พัง)
    return "ว่าง";
  },

  apiUrl = "https://demo.erpeazy.com/api/method/erpnext.api.get_vehicles_admin",
  autoFetchIfEmpty = true,
}) {
  const [rows, setRows] = useState(cars);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // modal state
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [editForm, setEditForm] = useState(initCar());
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [imgError, setImgError] = useState("");
  const [saving, setSaving] = useState(false);
  const editImgRef = useRef(null);

  // ───────── Filter state ─────────
  const [filterQ, setFilterQ] = useState(""); // ค้นหา
  const [filterStatus, setFilterStatus] = useState("ทั้งหมด"); // สถานะ

  // sync external cars
  useEffect(() => setRows(cars), [cars]);

  // auto-fetch list
  useEffect(() => {
    if (!autoFetchIfEmpty) return;
    if (Array.isArray(cars) && cars.length > 0) return;

    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(apiUrl, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rawList =
          (Array.isArray(json?.message) && json.message) ||
          json?.data ||
          json?.result ||
          [];
        setRows(normalizeVehicles(rawList));
      } catch (e) {
        // ✅ ถ้าเป็น abort ไม่ต้องแสดง error
        if (
          e?.name === "AbortError" ||
          String(e?.message).includes("aborted")
        ) {
          return;
        }
        setError(e?.message || "โหลดรายการรถไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [apiUrl, autoFetchIfEmpty, cars]);

  // ─── modal handlers ───
  const openEdit = (car) => {
    setSelectedId(car?.id ?? null);
    setImgError("");
    if (editImgRef.current) editImgRef.current.value = "";

    setEditForm({
      id: car?.id ?? "",
      vid: car?.vid || car?.id || "",
      name: car?.name ?? "",
      brand: car?.brand ?? "",
      type: car?.type ?? "Sedan",
      transmission: car?.transmission ?? "อัตโนมัติ",
      licensePlate: car?.licensePlate ?? "",
      seats: String(car?.seats ?? 5),
      fuel: car?.fuel ?? "เบนซิน",
      year: String(car?.year ?? ""),
      pricePerDay: String(car?.pricePerDay ?? 0),
      // TIP: field status เก็บอะไรก็ได้ (EN/TH) — เราจะแปลงตอนโชว์/กรองด้วย getCarRowStatus
      status: toEN(car?.status ?? "Available"),
      company: car?.company || "",
      description: car?.description ?? "",
      // ✅ รูปปัจจุบัน normalize ให้เป็น URL เต็ม (รองรับ /files/xxx)
      imageData: normalizeImage(car?.imageData || car?.imageUrl || ""),
      imageRemoved: false,
    });
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value ?? "" }));
  };

  const handleEditImageChange = (e) => {
    setImgError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setImgError(`ไฟล์ใหญ่เกิน ${MAX_FILE_MB}MB`);
      if (editImgRef.current) editImgRef.current.value = "";
      return;
    }
    if (!/^image\//.test(file.type)) {
      setImgError("กรุณาเลือกเป็นไฟล์รูปภาพเท่านั้น");
      if (editImgRef.current) editImgRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setEditForm((p) => ({
        ...p,
        imageData: String(reader.result), // data: URL
        imageRemoved: false,
      }));
    reader.onerror = () => {
      setImgError("อ่านไฟล์ไม่สำเร็จ");
      if (editImgRef.current) editImgRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const clearEditImage = () => {
    setEditForm((p) => ({ ...p, imageData: "", imageRemoved: true }));
    setImgError("");
    if (editImgRef.current) editImgRef.current.value = "";
  };

  /** 🔗 บันทึกไป ERPNext: edit_vehicles (FormData) */
  const saveEdit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("license_plate", editForm.licensePlate || "");
      fd.append("vehicle_name", editForm.name || "");
      fd.append("status", editForm.status || "");
      fd.append("price", String(editForm.pricePerDay || 0));
      fd.append("company", editForm.company || "");
      fd.append("type", editForm.type || "");
      fd.append("v_type", editForm.type || "");
      fd.append("brand", editForm.brand || "");
      fd.append("seat", String(editForm.seats || ""));
      fd.append("year", String(editForm.year || ""));
      fd.append("gear_system", editForm.transmission || "");
      fd.append("fuel_type", editForm.fuel || "");
      fd.append("description", editForm.description || "");
      fd.append("vid", editForm.vid || editForm.id || selectedId || "");

      const newFile = editImgRef.current?.files?.[0];
      if (newFile) fd.append("file", newFile, newFile.name);
      if (editForm.imageRemoved && !newFile) fd.append("delete_image", "1");

      const headers = new Headers();
      // headers.set("Authorization", ERP_AUTH);

      const res = await fetch(ERP_EDIT_URL, {
        method: "POST",
        headers,
        body: fd,
        credentials: "include",
        redirect: "follow",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Save failed (${res.status}) ${txt}`.trim());
      }

      const nextImageData = newFile
        ? URL.createObjectURL(newFile) // blob: แสดงใน UI ทันที
        : editForm.imageRemoved
        ? ""
        : editForm.imageData; // ค่าที่ normalize มาแล้ว

      const updatedLocal = {
        id: editForm.id || selectedId,
        name: editForm.name,
        brand: editForm.brand,
        type: editForm.type,
        transmission: editForm.transmission,
        licensePlate: editForm.licensePlate,
        seats: Number(editForm.seats || 0),
        fuel: editForm.fuel,
        year: Number(editForm.year || 0),
        pricePerDay: Number(editForm.pricePerDay || 0),
        status: editForm.status,
        company: editForm.company || "",
        description: editForm.description,
        imageData: nextImageData,
        imageUrl: nextImageData,
      };

      setRows((list) =>
        list.map((it) => {
          const same =
            String(it.id) === String(updatedLocal.id) ||
            (updatedLocal.licensePlate &&
              String(it.licensePlate) === String(updatedLocal.licensePlate));
          return same ? { ...it, ...updatedLocal } : it;
        })
      );

      if (typeof onEdit === "function") onEdit(updatedLocal);
      closeEdit();
    } catch (err) {
      alert(err?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  /** ลบคันรถ (ERP DELETE) */
  const openDelete = (car) => {
    setSelectedId(car?.id ?? null);
    setSelectedPlate(car?.licensePlate || "");
    setSelectedName(car?.name || "");
    setDelOpen(true);
  };
  const closeDelete = () => setDelOpen(false);

  const doDelete = async () => {
    try {
      if (!selectedPlate) throw new Error("ไม่พบป้ายทะเบียนของรถคันนี้");

      const erpHeaders = new Headers();
      erpHeaders.set("Content-Type", "application/json");
      // erpHeaders.set("Authorization", ERP_AUTH);

      const payload = { license_plate: selectedPlate };

      const res = await fetch(ERP_DELETE_URL, {
        method: "DELETE",
        headers: erpHeaders,
        body: JSON.stringify(payload),
        credentials: "include",
        redirect: "follow",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Delete failed (${res.status}) ${txt}`.trim());
      }

      setRows((list) =>
        list.filter(
          (it) =>
            String(it.licensePlate || "") !== String(selectedPlate) &&
            String(it.id || "") !== String(selectedId)
        )
      );

      if (typeof onDelete === "function") onDelete(selectedPlate);
      closeDelete();
    } catch (err) {
      alert(err?.message || "ลบไม่สำเร็จ");
    }
  };

  // ───────── Filtered rows (apply ค้นหา + สถานะ) ─────────
  const filteredRows = useMemo(() => {
    const q = filterQ.trim().toLowerCase();
    return rows.filter((c) => {
      // ✅ ใช้สถานะที่ผ่าน getCarRowStatus เพื่อให้เข้ากับค่าตัวกรองที่เป็นภาษาไทย
      const displayStatus = getCarRowStatus(c, bookings, now);
      const matchStatus =
        filterStatus === "ทั้งหมด" ? true : displayStatus === filterStatus;
      if (!matchStatus) return false;

      if (!q) return true;

      const keys = [c.name, c.brand, c.licensePlate, c.type]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());

      return keys.some((v) => v.includes(q));
    });
  }, [rows, filterQ, filterStatus, bookings, now, getCarRowStatus]);

  // สำหรับ column runnum → ใช้ filteredRows
  const dataForRender = useMemo(
    () => filteredRows.map((c, i) => ({ ...c, _idx: i })),
    [filteredRows]
  );

  const clearFilters = () => {
    setFilterQ("");
    setFilterStatus("ทั้งหมด");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-black">ตารางรถ</h2>
        <div className="text-sm text-black">
          {loading ? "กำลังโหลด…" : `ทั้งหมด ${rows.length} คัน`}
        </div>
      </div>

      {/* Error */}
      {!!error && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ───────── Filter Bar ───────── */}
      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <input
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            placeholder="รุ่น / ยี่ห้อ / ป้ายทะเบียน..."
            className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-gray-700 focus:ring-gray-700"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-gray-700 focus:ring-gray-700"
          >
            <option>ทั้งหมด</option>
            <option>ว่าง</option>
            <option>ถูกจอง</option>
            <option>ถูกยืมอยู่</option>
            <option>ซ่อมบำรุง</option>
          </select>
          <button
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-black hover:bg-gray-200"
          >
            ล้างตัวกรอง
          </button>
        </div>

        <div className="text-sm text-black">
          แสดง {filteredRows.length} จาก {rows.length} รายการ
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full min-w-full text-sm">
          <thead>
            <tr className="text-left text-black">
              <th className="py-2 pr-3">runnum</th>
              <th className="py-2 pr-3">รุ่น</th>
              <th className="py-2 pr-3">ยี่ห้อ</th>
              <th className="py-2 pr-3">ป้ายทะเบียน</th>
              <th className="py-2 pr-3">ประเภทรถ</th>
              <th className="py-2 pr-3">ราคา/วัน</th>
              <th className="py-2 pr-3">สถานะ</th>
              <th className="py-2 pr-3">จองถัดไป</th>
              <th className="py-2 pr-3">การจัดการ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-black">
            {loading && rows.length === 0 ? (
              <tr>
                {/* ✅ มี 9 คอลัมน์ -> colSpan=9 */}
                <td colSpan={9} className="py-6 text-center">
                  กำลังโหลดข้อมูล…
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                {/* ✅ มี 9 คอลัมน์ -> colSpan=9 */}
                <td colSpan={9} className="py-6 text-center">
                  ไม่พบข้อมูลตามตัวกรอง
                </td>
              </tr>
            ) : (
              dataForRender.map((c) => {
                const displayStatus = getCarRowStatus(c, bookings, now);
                const hideNext = [
                  "ซ่อมบำรุง",
                  "ซ่อมแซม",
                  "ถูกยืมอยู่",
                  "ถูกจอง",
                  "เลยกำหนดรับ",
                  "เลยกำหนดส่ง",
                ].includes(displayStatus);

                const nb = hideNext
                  ? null
                  : nextBookingMap[c.id] ||
                    nextBookingMap[c.licensePlate || c.name] ||
                    null;
                // // ใน map ของตาราง ก่อน return <tr>
                // console.log("row", { rawStatus: c.status, displayStatus });
                return (
                  <tr key={String(c.id)}>
                    <td className="py-3 pr-3">{c._idx + 1}</td>
                    <td className="py-3 pr-3 font-medium">{c.name}</td>
                    <td className="py-3 pr-3">{c.brand || "—"}</td>
                    <td className="py-3 pr-3">{c.licensePlate || "—"}</td>
                    <td className="py-3 pr-3">{c.type || "—"}</td>
                    <td className="py-3 pr-3">
                      {fmtBaht(Number(c.pricePerDay || 0))} ฿
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge
                        value={
                          displayStatus ||
                          c.status ||
                          c.stage ||
                          c.vehicle_stage ||
                          c.car_status ||
                          "ว่าง"
                        }
                      />
                    </td>
                    <td className="py-3 pr-3">
                      {nb ? (
                        <div className="leading-tight">
                          <div className="font-medium">{nb.bookingCode}</div>
                          <div className="text-xs text-gray-600">
                            {fmtDateTimeLocal(nb.pickupTime)} →{" "}
                            {fmtDateTimeLocal(nb.returnTime)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300"
                        >
                          ✎ แก้ไข
                        </button>
                        <button
                          onClick={() => openDelete(c)}
                          className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1.5 text-black hover:bg-gray-300"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: แก้ไขรถ */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-800/60 hover:bg-gray-900/70 transition-colors"
            onClick={closeEdit}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">
                แก้ไขข้อมูลรถ #{selectedId}
              </h3>
              <button
                onClick={closeEdit}
                className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={saveEdit}
              className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3 text-black"
            >
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold mb-1">
                  ชื่อรถ *
                </label>
                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-700 focus:ring-gray-700"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold mb-1">
                  ยี่ห้อ *
                </label>
                <input
                  name="brand"
                  value={editForm.brand}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-700 focus:ring-gray-700"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">
                  ประเภท
                </label>
                <select
                  name="type"
                  value={editForm.type}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-700 focus:ring-gray-700"
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
                <label className="block text-xs font-semibold mb-1">
                  ระบบเกียร์
                </label>
                <select
                  name="transmission"
                  value={editForm.transmission}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-700 focus:ring-gray-700"
                >
                  <option value="อัตโนมัติ">อัตโนมัติ (Auto)</option>
                  <option value="ธรรมดา">ธรรมดา (Manual)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">
                  ป้ายทะเบียน
                </label>
                <input
                  name="licensePlate"
                  value={editForm.licensePlate}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-700 focus:ring-gray-700"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">
                  จำนวนที่นั่ง
                </label>
                <input
                  type="number"
                  min="1"
                  name="seats"
                  value={editForm.seats}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-700 focus:ring-gray-700"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold mb-1">
                  ประเภทเชื้อเพลิง
                </label>
                <select
                  name="fuel"
                  value={editForm.fuel}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-700 focus:ring-gray-700"
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
                <label className="block text-xs font-semibold mb-1">
                  ปีของรถ
                </label>
                <input
                  type="number"
                  name="year"
                  min="1980"
                  max="2100"
                  value={editForm.year}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-700 focus:ring-gray-700"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold mb-1">
                  ราคา/วัน (บาท) *
                </label>
                <input
                  type="number"
                  min="0"
                  name="pricePerDay"
                  value={editForm.pricePerDay}
                  onChange={handleEditChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-700 focus:ring-gray-700"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold mb-1">
                  สถานะ
                </label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-700 focus:ring-gray-700"
                >
                  {/* ค่าใน ERP จะเป็น EN ก็ได้ เราแปลงทีหลังตอนแสดง */}
                  <option value="Available">ว่าง</option>
                  <option value="In Use">ถูกยืมอยู่</option>
                  <option value="In Rent">ถูกจอง</option>
                  <option value="Maintenance">ซ่อมบำรุง</option>
                </select>
              </div>

              {/* รูปเดียวต่อคัน */}
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold mb-1">
                  รูปรถ (อัปโหลดใหม่/ลบ) — ระบบรองรับรูปเดียวต่อคัน
                </label>
                <input
                  ref={editImgRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border file:border-gray-300 file:bg-gray-200 file:px-3 file:py-2 file:text-black hover:file:bg-gray-300"
                />
                {imgError && (
                  <div className="mt-1 text-xs text-rose-600">{imgError}</div>
                )}

                {editForm.imageData ? (
                  <div className="mt-3">
                    {/* ✅ ใช้ normalizeImage กันพาธ /files/... */}
                    <img
                      src={normalizeImage(editForm.imageData)}
                      alt="ตัวอย่างรูปรถ"
                      className="h-28 w-auto rounded-lg border object-cover"
                    />
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={clearEditImage}
                        className="rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                      >
                        ลบรูป
                      </button>
                    </div>
                  </div>
                ) : editForm.imageRemoved ? (
                  <p className="mt-1 text-xs text-gray-500">
                    จะลบรูปเดิมเมื่อกด “บันทึกการเปลี่ยนแปลง”
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    รองรับไฟล์ .jpg .png .webp ≤ {MAX_FILE_MB}MB
                  </p>
                )}
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold mb-1">
                  คำอธิบายเพิ่มเติม
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-700 focus:ring-gray-700"
                />
              </div>

              <div className="md:col-span-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-black hover:bg-gray-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ยืนยันลบ */}
      {delOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-800/60 hover:bg-gray-900/70 transition-colors"
            onClick={closeDelete}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl text-black">
            <h3 className="text-lg font-bold">ยืนยันการลบ</h3>
            <p className="mt-2 text-sm text-gray-700">
              ต้องการลบรถ
              {selectedName ? (
                <>
                  {" "}
                  <b>{selectedName}</b>
                </>
              ) : null}{" "}
              {selectedPlate ? (
                <>
                  (ป้ายทะเบียน <b>{selectedPlate}</b>)
                </>
              ) : (
                <>
                  หมายเลข <b>#{selectedId}</b>
                </>
              )}{" "}
              ใช่หรือไม่?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={closeDelete}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                ยกเลิก
              </button>
              <button
                onClick={doDelete}
                className="px-5 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const toEN = (s) => {
  const x = String(s ?? "")
    .normalize("NFKC")
    .replace(/\u00A0|\u200B|\u200C|\u200D/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (["in rent", "inrent", "reserved", "booked", "ถูกจอง"].includes(x))
    return "In Rent";
  if (["in use", "inuse", "rented", "กำลังเช่า", "ถูกยืมอยู่"].includes(x))
    return "In Use";
  if (["maintenance", "maintainance", "ซ่อมบำรุง", "ซ่อมแซม"].includes(x))
    return "Maintenance";
  if (["available", "ว่าง"].includes(x)) return "Available";
  return "Available";
};

/* helpers */

function initCar() {
  return {
    id: "",
    vid: "",
    name: "",
    brand: "",
    type: "Sedan",
    transmission: "อัตโนมัติ",
    licensePlate: "",
    seats: "5",
    fuel: "เบนซิน",
    year: "",
    pricePerDay: "0",
    status: "ว่าง",
    company: "",
    description: "",
    imageData: "",
    imageRemoved: false,
  };
}

function normalizeVehicles(rawList) {
  if (!Array.isArray(rawList)) return [];
  if (rawList.length > 0 && isPlainObject(rawList[0]))
    return rawList.map(mapVehicleObject);
  return rawList.map(mapVehicleArray);
}
const isPlainObject = (v) =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function mapVehicleObject(v) {
  // รูป: รองรับ vehicle_image และพาธ /files/...
  const rawImg =
    v.imageData ||
    v.image_url ||
    v.image ||
    v.photo ||
    v.thumbnail ||
    v.vehicle_image || // <- สำคัญกับ payload ชุดนี้
    "";
  const img = normalizeImage(rawImg);

  // แปลงตัวเลข/สตริง
  const priceNum = Number(v.price_per_day ?? v.rate ?? v.price ?? 0);
  const seatsNum = Number(v.seats ?? v.seat ?? 5); // <- รองรับ seat
  const yearNum = Number(v.year ?? 0);

  return {
    id:
      v.id ||
      v.name ||
      v.vehicle_id ||
      v.vehicle ||
      v.license_plate ||
      v.plate ||
      "",
    vid: v.vid || "",
    name: v.model || v.vehicle_name || v.name || "—",
    brand: v.brand || v.make || "",
    licensePlate: (v.license_plate || v.plate || v.licensePlate || "").trim(),
    pricePerDay: priceNum,
    status:
      v.status ||
      v.stage ||
      v.vehicle_stage ||
      v.car_status ||
      v.status_text ||
      "ว่าง",
    // รองรับหลายคีย์จาก backend
    type: v.type || v.v_type || v.ftype || v.category || "Sedan",
    transmission: v.transmission || v.gear_system || "อัตโนมัติ", // <- รองรับ gear_system
    seats: seatsNum,
    fuel: v.fuel || v.fuel_type || "เบนซิน", // <- รองรับ fuel_type
    year: yearNum,
    company: v.company || "",
    description: v.description || "",
    imageData: img, // ใช้ URL เต็ม / data: / blob: ได้
    imageUrl: img,
  };
}

function mapVehicleArray(arr) {
  const [id, brand, model, plate, price, status, img] = arr;
  const imgUrl = normalizeImage(img || "");
  return {
    id: id ?? "",
    vid: "",
    name: model ?? "—",
    brand: brand ?? "",
    licensePlate: plate ?? "",
    pricePerDay: Number(price ?? 0),
    status: status || "ว่าง",
    type: "Sedan",
    transmission: "อัตโนมัติ",
    seats: 5,
    fuel: "เบนซิน",
    year: 0,
    company: "",
    description: "",
    imageData: imgUrl,
    imageUrl: imgUrl,
  };
}
