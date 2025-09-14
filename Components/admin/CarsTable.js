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
// ถ้าต้องยิงด้วย Token ให้เปิดบรรทัดนี้
// const ERP_AUTH = "token xxx:yyy";

export default function CarsTable({
  cars = [],
  bookings = [],
  now = new Date(),
  nextBookingMap = {},
  onEdit,
  onDelete,
  getCarRowStatus = (c) => c.status || "ว่าง",
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
  const [selectedPlate, setSelectedPlate] = useState(""); // ใช้กับลบ ERP
  const [selectedName, setSelectedName] = useState(""); // แสดงชื่อใน modal
  const [imgError, setImgError] = useState("");
  const [saving, setSaving] = useState(false);
  const editImgRef = useRef(null);

  // sync external cars
  useEffect(() => setRows(cars), [cars]);

  // auto-fetch list (เมื่อ parent ไม่ส่ง cars มา)
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
      vid: car?.vid || car?.id || "", // เผื่อกรณีระบบคุณใช้ vid
      name: car?.name ?? "",
      brand: car?.brand ?? "",
      type: car?.type ?? "Sedan",
      transmission: car?.transmission ?? "อัตโนมัติ",
      licensePlate: car?.licensePlate ?? "",
      seats: String(car?.seats ?? 5),
      fuel: car?.fuel ?? "เบนซิน",
      year: String(car?.year ?? ""),
      pricePerDay: String(car?.pricePerDay ?? 0),
      status: car?.status ?? "ว่าง",
      company: car?.company || "", // ถ้าระบบมีบริษัทแนบมาด้วย
      description: car?.description ?? "",
      imageData: car?.imageData || car?.imageUrl || "",
      imageRemoved: false, // flag ลบรูป
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
        imageData: String(reader.result), // แสดง preview
        imageRemoved: false, // มีรูปใหม่แล้ว ไม่ใช่การลบ
      }));
    reader.onerror = () => {
      setImgError("อ่านไฟล์ไม่สำเร็จ");
      if (editImgRef.current) editImgRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const clearEditImage = () => {
    // ลบรูปเก่า (ให้ backend ลบจริงด้วย flag)
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

      // ==== map fields ให้ตรง API ====
      fd.append("license_plate", editForm.licensePlate || "");
      fd.append("vehicle_name", editForm.name || "");
      fd.append("status", editForm.status || "");
      fd.append("price", String(editForm.pricePerDay || 0));
      fd.append("company", editForm.company || "");
      // มีทั้ง "type" และ "v_type" ในตัวอย่าง API — ส่งทั้งคู่ให้ชัวร์
      fd.append("type", editForm.type || "");
      fd.append("v_type", editForm.type || "");
      fd.append("brand", editForm.brand || "");
      fd.append("seat", String(editForm.seats || ""));
      fd.append("year", String(editForm.year || ""));
      fd.append("gear_system", editForm.transmission || "");
      fd.append("fuel_type", editForm.fuel || "");
      fd.append("description", editForm.description || "");
      fd.append("vid", editForm.vid || editForm.id || selectedId || "");

      // ==== รูปเดียวต่อคัน: แนวทาง ====
      // 1) ถ้ามีไฟล์ใหม่ -> ส่ง "file"
      const newFile = editImgRef.current?.files?.[0];
      if (newFile) {
        fd.append("file", newFile, newFile.name);
      }
      // 2) ถ้ากดลบรูป -> ส่ง flag ให้ backend รู้ (ชื่อคีย์ "delete_image" สมมติทั่วไป)
      //    ถ้า backend ของคุณใช้คีย์ชื่ออื่น ให้แก้ตามนั้น
      if (editForm.imageRemoved && !newFile) {
        fd.append("delete_image", "1");
      }
      // หมายเหตุ: ถ้าไม่ลบและไม่อัปโหลดใหม่ จะไม่แตะรูปเดิม

      const headers = new Headers();
      // ถ้าต้องใช้ token:
      // headers.set("Authorization", ERP_AUTH);

      const res = await fetch(ERP_EDIT_URL, {
        method: "POST",
        headers, // ห้าม set Content-Type เองเมื่อใช้ FormData
        body: fd,
        credentials: "include",
        redirect: "follow",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Save failed (${res.status}) ${txt}`.trim());
      }

      // ===== อัปเดต UI ทันที =====
      // สร้างรูป preview ใหม่ถ้าอัปโหลดไฟล์
      const nextImageData = newFile
        ? URL.createObjectURL(newFile)
        : editForm.imageRemoved
        ? ""
        : editForm.imageData;

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
      // ถ้าต้องใช้ token:
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

  // สำหรับ column runnum
  const dataForRender = useMemo(
    () => rows.map((c, i) => ({ ...c, _idx: i })),
    [rows]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-black">ตารางรถ</h2>
        <div className="text-sm text-black">
          {loading ? "กำลังโหลด…" : `ทั้งหมด ${rows.length} คัน`}
        </div>
      </div>

      {!!error && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto mt-4">
        <table className="w-full min-w-full text-sm">
          <thead>
            <tr className="text-left text-black">
              <th className="py-2 pr-3">runnum</th>
              <th className="py-2 pr-3">รุ่น</th>
              <th className="py-2 pr-3">ยี่ห้อ</th>
              <th className="py-2 pr-3">ป้ายทะเบียน</th>
              <th className="py-2 pr-3">ราคา/วัน</th>
              <th className="py-2 pr-3">สถานะ</th>
              <th className="py-2 pr-3">จองถัดไป</th>
              <th className="py-2 pr-3">การจัดการ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-black">
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center">
                  กำลังโหลดข้อมูล…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center">
                  ไม่มีข้อมูลรถ
                </td>
              </tr>
            ) : (
              dataForRender.map((c) => {
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
                  <tr key={String(c.id)}>
                    <td className="py-3 pr-3">{c._idx + 1}</td>
                    <td className="py-3 pr-3 font-medium">{c.name}</td>
                    <td className="py-3 pr-3">{c.brand || "—"}</td>
                    <td className="py-3 pr-3">{c.licensePlate || "—"}</td>
                    <td className="py-3 pr-3">
                      {fmtBaht(Number(c.pricePerDay || 0))} ฿
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge value={displayStatus || "ว่าง"} />
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
                          onClick={() => openDelete(c)} // ส่งทั้ง object
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
                  <option value="ว่าง">ว่าง</option>
                  <option value="ถูกยืมอยู่">ถูกยืมอยู่</option>
                  <option value="ซ่อมแซม">ซ่อมแซม</option>
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
                    <img
                      src={editForm.imageData}
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
    licensePlate: v.license_plate || v.plate || v.licensePlate || "",
    pricePerDay: Number(v.price_per_day ?? v.rate ?? v.price ?? 0),
    status: v.status || "ว่าง",
    type: v.type || v.category || "Sedan",
    transmission: v.transmission || "อัตโนมัติ",
    seats: Number(v.seats ?? 5),
    fuel: v.fuel || "เบนซิน",
    year: Number(v.year ?? 0),
    company: v.company || "",
    description: v.description || "",
    imageData:
      v.imageData || v.image_url || v.image || v.photo || v.thumbnail || "",
    imageUrl:
      v.image_url || v.image || v.photo || v.thumbnail || v.imageData || "",
  };
}
function mapVehicleArray(arr) {
  const [id, brand, model, plate, price, status, img] = arr;
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
    imageData: img || "",
    imageUrl: img || "",
  };
}
