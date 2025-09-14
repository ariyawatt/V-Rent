// app/delivery/page.js
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";
import Link from "next/link";

/* ---------- UI helpers ---------- */
const cx = (...a) => a.filter(Boolean).join(" ");
const labelCls = "text-sm font-semibold text-slate-800";
const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black";
const cardCls = "bg-white rounded-2xl shadow-lg border border-slate-200";

/* ---------- statuses (เหลือแค่ ส่งมอบ/เสร็จสิ้น) ---------- */
const STATUS = {
  pending: { label: "ส่งมอบ", badge: "bg-amber-100 text-amber-800" },
  done: { label: "เสร็จสิ้น", badge: "bg-emerald-100 text-emerald-800" },
};

/* ---------- small utils ---------- */
const toLocalInputDT = (iso) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : "";

/* ───────────────── CameraBox ───────────────── */
function CameraBox({ title, onCapture, buttonLabel = "ถ่ายรูป", disabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [err, setErr] = useState("");
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [camKey, setCamKey] = useState(0);

  const stopStream = () => {
    try {
      videoRef.current && (videoRef.current.srcObject = null);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    } catch {}
  };

  const listDevices = async () => {
    try {
      const cams = (await navigator.mediaDevices.enumerateDevices()).filter(
        (d) => d.kind === "videoinput"
      );
      setDevices(cams);
      if (!deviceId && cams[0]?.deviceId) setDeviceId(cams[0].deviceId);
    } catch {}
  };

  const openCamera = async (id = deviceId) => {
    setErr("");
    if (!window.isSecureContext && location.hostname !== "localhost")
      return setErr(
        "กล้องต้องใช้บน HTTPS หรือ http://localhost เท่านั้น\n" +
          "วิธีแก้: ใช้ https หรือเปิดผ่าน localhost"
      );

    if (!navigator.mediaDevices?.getUserMedia)
      return setErr("เบราว์เซอร์นี้ไม่รองรับ getUserMedia");

    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: id ? { deviceId: { exact: id } } : { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      await listDevices();

      const track = stream.getVideoTracks()?.[0];
      const devId = track?.getSettings?.().deviceId;
      if (devId) setDeviceId(devId);

      setCamKey((k) => k + 1);
      setIsOpen(true);
      setTimeout(async () => {
        if (!videoRef.current) return;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {}
      }, 0);
    } catch (e) {
      const name = e?.name || "";
      setErr(
        name === "NotAllowedError"
          ? "ถูกปฏิเสธสิทธิ์กล้อง กรุณาอนุญาตใน Site settings"
          : name === "NotFoundError" || name === "OverconstrainedError"
          ? "ไม่พบอุปกรณ์กล้องที่ใช้งานได้"
          : "เปิดกล้องไม่สำเร็จ: " + (e.message || String(e))
      );
      setIsOpen(false);
      stopStream();
    }
  };

  const switchCamera = async () => {
    if (devices.length < 2) return;
    const i = devices.findIndex((d) => d.deviceId === deviceId);
    const next = devices[(i + 1) % devices.length];
    await openCamera(next.deviceId);
  };

  const takeShot = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(v, 0, 0, w, h);

    c.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture?.({
          blob,
          url: URL.createObjectURL(blob),
          dataUrl: c.toDataURL("image/jpeg", 0.9),
        });
        setIsOpen(false);
        stopStream();
      },
      "image/jpeg",
      0.9
    );
  };

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") {
        setIsOpen(false);
        stopStream();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => () => stopStream(), []);
  useEffect(() => {
    listDevices();
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className={labelCls}>{title}</p>
        <button
          type="button"
          onClick={() => openCamera()}
          disabled={disabled}
          className={cx(
            "px-3 py-1.5 rounded-lg border text-sm",
            disabled
              ? "border-slate-200 text-slate-400"
              : "border-slate-300 hover:bg-slate-50"
          )}
        >
          เปิดกล้อง
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select
          className={cx(inputCls, "max-w-full")}
          value={deviceId}
          onChange={async (e) => {
            const val = e.target.value;
            setDeviceId(val);
            if (isOpen) await openCamera(val);
          }}
        >
          {devices.length === 0 && <option>ไม่พบอุปกรณ์กล้อง</option>}
          {devices.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `กล้อง ${i + 1}`}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={switchCamera}
          disabled={devices.length < 2}
          className={cx(
            "px-3 py-2 rounded-lg border text-sm",
            devices.length < 2
              ? "border-slate-200 text-slate-400"
              : "border-slate-300 hover:bg-slate-50"
          )}
          title={devices.length < 2 ? "มีกล้องตัวเดียว" : "สลับกล้อง"}
        >
          สลับ
        </button>
      </div>

      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 cursor-pointer text-sm">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            onCapture?.({
              blob: file,
              url: URL.createObjectURL(file),
              dataUrl: null,
            });
            e.currentTarget.value = "";
          }}
          disabled={disabled}
        />
        อัปโหลดรูปแทน
      </label>

      {err && <p className="text-xs whitespace-pre-line text-red-600">{err}</p>}

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 grid place-items-center">
          <div className="relative w-[92vw] max-w-[720px] rounded-2xl overflow-hidden border border-white/20">
            <video
              key={camKey}
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-[60vh] object-contain bg-black"
            />
            <div className="p-3 bg-black/60 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsOpen(false);
                  stopStream();
                }}
                className="px-3 py-2 rounded-lg text-white/90 hover:text-white"
              >
                ปิด
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={switchCamera}
                  disabled={devices.length < 2}
                  className={cx(
                    "px-3 py-2 rounded-lg border text-white/90 hover:text-white",
                    devices.length < 2
                      ? "border-white/20 text-white/50"
                      : "border-white/40"
                  )}
                >
                  สลับกล้อง
                </button>
                <button
                  onClick={takeShot}
                  className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-slate-200"
                >
                  {buttonLabel}
                </button>
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}

/* ───────────────── AdminDeliveryContent ───────────────── */
function AdminDeliveryContent() {
  const [form, setForm] = useState({
    bookingCode: "",
    carPlate: "",
    carName: "",
    customerName: "",
    customerPhone: "",
    customerId: "",
    pickupLocation: "",
    pickupTime: "",
    returnLocation: "",
    returnTime: "",
    notes: "",
    verifyType: "citizen_id",
    depositReceived: false,
    fuelLevel: "full",
    odometer: "",
  });
  const [idProofs, setIdProofs] = useState([]);
  const [carProofs, setCarProofs] = useState([]);

  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueErr, setQueueErr] = useState("");

  /* ---- fetch rentals ---- */
  useEffect(() => {
    (async () => {
      setQueueLoading(true);
      setQueueErr("");
      try {
        const res = await fetch(
          "https://demo.erpeazy.com/api/method/erpnext.api.get_rentals",
          {
            method: "GET",
            headers: new globalThis.Headers(),
            redirect: "follow",
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { message = [] } = JSON.parse(await res.text());

        const mapped = message.map((row) => {
          const pickupISO = row?.pickup_date
            ? new Date(row.pickup_date.replace(" ", "T")).toISOString()
            : "";
          const raw = (row?.status || "").toLowerCase();
          const status =
            raw.includes("done") ||
            raw.includes("return") ||
            raw.includes("complete")
              ? "done"
              : "pending";

          return {
            bookingCode: row?.name || "",
            customerName: row?.customer_name || "",
            customerPhone: row?.customer_phone || "",
            carName: row?.vehicle || "",
            carPlate: (row?.license_plate || "").trim(),
            pickupPlace: row?.pickup_place || "",
            returnPlace: row?.return_place || "",
            pickupLocation: row?.pickup_place || row?.pickup_location || "",
            returnLocation: row?.return_place || row?.return_location || "",
            pickupTime: pickupISO,
            returnTime: row?.return_date
              ? new Date(row.return_date.replace(" ", "T")).toISOString()
              : "",
            status,
          };
        });

        setQueue(mapped);
      } catch (e) {
        console.error(e);
        setQueueErr(e?.message || "โหลดคิวไม่สำเร็จ");
      } finally {
        setQueueLoading(false);
      }
    })();
  }, []);

  const onField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const clearFiles = (arr) => {
    arr.forEach((p) => {
      try {
        if (p?.url?.startsWith("blob:")) URL.revokeObjectURL(p.url);
      } catch {}
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const required = ["bookingCode", "customerName", "customerPhone"];
    const missing = required.filter((k) => !form[k]);
    if (missing.length) return alert("กรุณากรอก: " + missing.join(", "));
    if (
      idProofs.length === 0 &&
      !confirm("ยังไม่มีรูปยืนยันตัวตน บันทึกต่อหรือไม่?")
    )
      return;

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
    idProofs.forEach((p, i) =>
      fd.append(`id_proof_${i + 1}`, p.blob, `id_proof_${i + 1}.jpg`)
    );
    carProofs.forEach((p, i) =>
      fd.append(`car_proof_${i + 1}`, p.blob, `car_proof_${i + 1}.jpg`)
    );

    console.log("DELIVERY_SUBMIT_FORMDATA", {
      ...form,
      idProofsCount: idProofs.length,
      carProofsCount: carProofs.length,
    });
    alert("บันทึกสำเร็จ (demo) — พร้อมส่งรูปเป็นไฟล์ไป backend");
  };

  /* ---- fill form when click "เปิดฟอร์ม" ---- */
  const loadToForm = (j) => {
    setForm((f) => ({
      ...f,
      bookingCode: j.bookingCode || "",
      carPlate: j.carPlate || "",
      carName: j.carName || "",
      customerName: j.customerName || "",
      customerPhone: j.customerPhone || "",
      pickupLocation: j.pickupPlace ?? j.pickupLocation ?? "",
      pickupTime: toLocalInputDT(j.pickupTime),
      returnLocation: j.returnPlace ?? j.returnLocation ?? "",
      returnTime: toLocalInputDT(j.returnTime),
    }));
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
      {/* ซ้าย: ฟอร์ม */}
      <section className={cx(cardCls, "p-6 md:p-8")}>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Delivery Staff{" "}
          <span className="text-xs ml-2 align-middle rounded bg-green-100 text-green-700 px-2 py-0.5">
            Admin
          </span>
        </h1>
        <p className="text-slate-700 mt-1">
          บันทึกข้อมูลการส่งมอบรถให้ลูกค้า พร้อมถ่ายหลักฐาน/เอกสารยืนยันตัวตน
        </p>

        <form className="mt-6 grid gap-6" onSubmit={handleSubmit}>
          {/* booking / car */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>รหัสการจอง *</label>
              <input
                name="bookingCode"
                className={inputCls}
                value={form.bookingCode}
                onChange={onField}
                required
                placeholder="เช่น VR-2025-000123"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>ทะเบียนรถ</label>
              <input
                name="carPlate"
                className={inputCls}
                value={form.carPlate}
                onChange={onField}
                placeholder="1กก-1234"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>รุ่นรถ</label>
              <input
                name="carName"
                className={inputCls}
                value={form.carName}
                onChange={onField}
                placeholder="Toyota Corolla Cross"
              />
            </div>
          </div>

          {/* customer */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>ชื่อลูกค้า *</label>
              <input
                name="customerName"
                className={inputCls}
                value={form.customerName}
                onChange={onField}
                required
                placeholder="ชื่อ–นามสกุล"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>เบอร์ติดต่อ *</label>
              <input
                name="customerPhone"
                className={inputCls}
                value={form.customerPhone}
                onChange={onField}
                required
                placeholder="080-000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>เลขประจำตัว/เอกสาร</label>
              <input
                name="customerId"
                className={inputCls}
                value={form.customerId}
                onChange={onField}
                placeholder="เลขบัตร/ใบขับขี่/Passport"
              />
            </div>
          </div>

          {/* pickup / return */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>สถานที่ส่งมอบ</label>
              <input
                name="pickupLocation"
                className={inputCls}
                value={form.pickupLocation}
                onChange={onField}
                placeholder="เช่น สนามบินเชียงใหม่ (CNX)"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>วัน–เวลาส่งมอบ</label>
              <input
                type="datetime-local"
                name="pickupTime"
                className={inputCls}
                value={form.pickupTime}
                onChange={onField}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>สถานที่นัดคืนรถ</label>
              <input
                name="returnLocation"
                className={inputCls}
                value={form.returnLocation}
                onChange={onField}
                placeholder="เช่น สาขาสีลม"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>วัน–เวลาคืนรถ</label>
              <input
                type="datetime-local"
                name="returnTime"
                className={inputCls}
                value={form.returnTime}
                onChange={onField}
              />
            </div>
          </div>

          {/* numbers / flags */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>ระดับน้ำมัน</label>
              <select
                name="fuelLevel"
                className={inputCls}
                value={form.fuelLevel}
                onChange={onField}
              >
                <option value="full">เต็มถัง</option>
                <option value="3/4">3/4</option>
                <option value="1/2">1/2</option>
                <option value="1/4">1/4</option>
                <option value="empty">เกือบหมด</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelCls}>เลขไมล์ (กม.)</label>
              <input
                name="odometer"
                className={inputCls}
                value={form.odometer}
                onChange={onField}
                placeholder="เช่น 35,420"
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>เงินมัดจำ</label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50">
                <input
                  type="checkbox"
                  name="depositReceived"
                  checked={form.depositReceived}
                  onChange={onField}
                  className="h-4 w-4 accent-black"
                />
                ได้รับเรียบร้อย
              </label>
            </div>
          </div>

          {/* verify type */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>เอกสารที่ใช้ยืนยัน</label>
              <select
                name="verifyType"
                className={inputCls}
                value={form.verifyType}
                onChange={onField}
              >
                <option value="citizen_id">บัตรประชาชน</option>
                <option value="driver_license">ใบขับขี่</option>
                <option value="passport">Passport</option>
              </select>
            </div>
          </div>

          {/* proofs: id */}
          <div className="space-y-3">
            <CameraBox
              title="ถ่ายรูปเอกสารยืนยันตัวตน (บัตร/ใบขับขี่/Passport)"
              onCapture={(img) =>
                setIdProofs((p) => [
                  ...p,
                  { url: img.url, blob: img.blob, dataUrl: img.dataUrl },
                ])
              }
              buttonLabel="ถ่ายหลักฐาน"
            />
            {!!idProofs.length && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {idProofs.map((p, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden border border-slate-300"
                  >
                    <img
                      src={p.dataUrl || p.url}
                      alt={`ID Proof ${i + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setIdProofs((prev) => {
                          const cp = [...prev];
                          try {
                            if (cp[i]?.url?.startsWith("blob:"))
                              URL.revokeObjectURL(cp[i].url);
                          } catch {}
                          cp.splice(i, 1);
                          return cp;
                        })
                      }
                      className="absolute top-1 right-1 px-2 py-0.5 text-xs rounded bg-black/70 text-white"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* proofs: car */}
          <div className="space-y-3">
            <CameraBox
              title="ถ่ายรูปสภาพรถตอนส่งมอบ (รอย/ล้อ/มุมต่าง ๆ)"
              onCapture={(img) =>
                setCarProofs((p) => [
                  ...p,
                  { url: img.url, blob: img.blob, dataUrl: img.dataUrl },
                ])
              }
              buttonLabel="ถ่ายรูปสภาพรถ"
            />
            {!!carProofs.length && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {carProofs.map((p, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden border border-slate-300"
                  >
                    <img
                      src={p.dataUrl || p.url}
                      alt={`Car Proof ${i + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCarProofs((prev) => {
                          const cp = [...prev];
                          try {
                            if (cp[i]?.url?.startsWith("blob:"))
                              URL.revokeObjectURL(cp[i].url);
                          } catch {}
                          cp.splice(i, 1);
                          return cp;
                        })
                      }
                      className="absolute top-1 right-1 px-2 py-0.5 text-xs rounded bg-black/70 text-white"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* notes */}
          <div className="space-y-2">
            <label className={labelCls}>หมายเหตุเพิ่มเติม</label>
            <textarea
              name="notes"
              className={inputCls}
              rows={4}
              value={form.notes}
              onChange={onField}
              placeholder="เช่น มีรอยขีดข่วนบริเวณกันชนหน้า..."
            />
          </div>

          {/* action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setForm({
                  bookingCode: "",
                  carPlate: "",
                  carName: "",
                  customerName: "",
                  customerPhone: "",
                  customerId: "",
                  pickupLocation: "",
                  pickupTime: "",
                  returnLocation: "",
                  returnTime: "",
                  notes: "",
                  verifyType: "citizen_id",
                  depositReceived: false,
                  fuelLevel: "full",
                  odometer: "",
                });
                clearFiles(idProofs);
                clearFiles(carProofs);
                setIdProofs([]);
                setCarProofs([]);
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
            >
              ล้างฟอร์ม
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-black text-white font-semibold hover:bg-slate-900"
            >
              บันทึกข้อมูลส่งมอบ
            </button>
          </div>
        </form>

        {queueLoading && (
          <p className="text-xs mt-3 text-slate-500">กำลังโหลดคิววันนี้...</p>
        )}
        {queueErr && (
          <p className="text-xs mt-3 text-red-600">
            โหลดคิวล้มเหลว: {queueErr}
          </p>
        )}
      </section>

      {/* ขวา: สรุปโดยย่อ */}
      <aside className={cx(cardCls, "p-6 md:p-8 h-fit")}>
        <h3 className="text-lg font-bold">สรุปโดยย่อ</h3>
        <div className="mt-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span>รหัสการจอง</span>
            <span className="font-medium">{form.bookingCode || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>ลูกค้า</span>
            <span className="font-medium">{form.customerName || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>โทร</span>
            <span>{form.customerPhone || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>ส่งมอบ</span>
            <span className="text-right">
              {form.pickupLocation || "-"}
              <br className="hidden sm:block" />
              <span className="text-slate-700">{form.pickupTime || "-"}</span>
            </span>
          </div>
          <hr className="my-3 border-slate-200" />
          <div className="flex justify-between">
            <span>ประเภทเอกสาร</span>
            <span>
              {
                {
                  citizen_id: "บัตรประชาชน",
                  driver_license: "ใบขับขี่",
                  passport: "Passport",
                }[form.verifyType]
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span>รูปที่แนบ</span>
            <span>{idProofs.length + carProofs.length} รูป</span>
          </div>
          <div className="flex justify-between">
            <span>น้ำมัน</span>
            <span>{form.fuelLevel}</span>
          </div>
          <div className="flex justify-between">
            <span>เลขไมล์</span>
            <span>{form.odometer || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>เงินมัดจำ</span>
            <span>{form.depositReceived ? "รับแล้ว" : "ยังไม่รับ"}</span>
          </div>
        </div>
      </aside>

      {/* ขวา: คิววันนี้ */}
      <aside className={cx(cardCls, "p-6 md:p-8 h-fit")}>
        <h3 className="text-lg font-bold">คิววันนี้ (Today)</h3>
        <p className="text-slate-600 text-sm mt-1">
          แสดงเฉพาะงานรับรถที่นัดหมาย “วันนี้”
        </p>
        <TodayQueue queue={queue} onPick={loadToForm} />
      </aside>
    </div>
  );
}

/* ───────────────── TodayQueue ───────────────── */
function TodayQueue({ queue, onPick }) {
  const sameDate = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const fmtTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const todayQueue = useMemo(
    () =>
      queue.filter(
        (j) => j.pickupTime && sameDate(new Date(j.pickupTime), new Date())
      ),
    [queue]
  );

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-600">
            <th className="py-2 pr-3 text-left">เวลา</th>
            <th className="py-2 pr-3 text-left">รหัส</th>
            <th className="py-2 pr-3 text-left">รถ / ป้าย</th>
            <th className="py-2 pr-3 text-left">ลูกค้า</th>
            <th className="py-2 pr-3 text-left">สถานะ</th>
            <th className="py-2 pr-3 text-left">สถานที่</th>
            <th className="py-2 pr-0 text-left">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {todayQueue.map((j) => (
            <tr key={j.bookingCode}>
              <td className="py-2 pr-3">{fmtTime(j.pickupTime)}</td>
              <td className="py-2 pr-3 font-medium">{j.bookingCode}</td>
              <td className="py-2 pr-3">
                {j.carName}
                <div className="text-xs text-slate-600">{j.carPlate}</div>
              </td>
              <td className="py-2 pr-3">
                {j.customerName}
                <div className="text-xs text-slate-600">{j.customerPhone}</div>
              </td>
              <td className="py-2 pr-3">
                {(() => {
                  const s = STATUS[j.status] ?? STATUS.pending;
                  return (
                    <span
                      className={cx(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        s.badge
                      )}
                    >
                      {s.label}
                    </span>
                  );
                })()}
              </td>
              <td className="py-2 pr-3">
                <div>{j.pickupPlace || j.pickupLocation || "-"}</div>
                <div className="text-xs text-slate-600">
                  คืน: {j.returnPlace || j.returnLocation || "-"}
                </div>
              </td>
              <td className="py-2 pr-0">
                <button
                  type="button"
                  onClick={() => onPick(j)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
                  title="เปิดฟอร์มด้วยข้อมูลนี้"
                >
                  เปิดฟอร์ม
                </button>
              </td>
            </tr>
          ))}
          {!todayQueue.length && (
            <tr>
              <td colSpan={7} className="py-4 text-center text-slate-500">
                วันนี้ยังไม่มีคิวรับรถ
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────── Gate ───────────────── */
export default function DeliveryStaffPage() {
  const [auth, setAuth] = useState({
    loading: true,
    isAdmin: false,
    name: "",
    email: "",
  });

  useEffect(() => {
    let ignore = false;

    // preload quick UX
    try {
      const isAdminLocal =
        (localStorage.getItem("vrent_is_admin") || "false").toLowerCase() ===
        "true";
      const fullNameLS =
        localStorage.getItem("vrent_full_name") ||
        localStorage.getItem("vrent_user_name") ||
        "";
      const emailLS =
        localStorage.getItem("vrent_login_email") ||
        localStorage.getItem("vrent_user_id") ||
        "";
      setAuth((p) =>
        p.loading
          ? {
              loading: true,
              isAdmin: isAdminLocal,
              name: fullNameLS,
              email: emailLS,
            }
          : p
      );
    } catch {}

    // verify with backend
    (async () => {
      try {
        const userIdLS = (localStorage.getItem("vrent_user_id") || "").trim();
        const emailLS =
          (localStorage.getItem("vrent_login_email") || "").trim() ||
          (localStorage.getItem("vrent_user_id") || "").trim();

        const qp = new URLSearchParams();
        if (userIdLS) qp.set("user_id", userIdLS);
        if (emailLS) qp.set("email", emailLS);

        const headers = {};
        if (userIdLS) headers["x-user-id"] = userIdLS;
        if (emailLS) headers["x-email"] = emailLS;

        const r = await fetch(`/api/erp/me?${qp.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers,
        });
        const j = await r.json().catch(() => null);
        if (ignore) return;

        const u = j?.user || {};
        setAuth({
          loading: false,
          isAdmin: !!u.isAdmin,
          name: u.fullName || "",
          email: u.email || "",
        });

        try {
          if (u.fullName) localStorage.setItem("vrent_full_name", u.fullName);
          if (u.email) localStorage.setItem("vrent_login_email", u.email);
          localStorage.setItem("vrent_is_admin", String(!!u.isAdmin));
        } catch {}
      } catch {
        if (!ignore) setAuth((p) => ({ ...p, loading: false }));
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900">
      <Header />
      <main className="flex-grow">
        {auth.loading ? (
          <div className="max-w-3xl mx-auto p-8">
            <div className={cx(cardCls, "p-8 text-center")}>
              <p className="text-lg font-semibold">กำลังตรวจสอบสิทธิ์...</p>
              <p className="text-slate-600 mt-1 text-sm">
                กรุณารอสักครู่ ระบบกำลังตรวจสอบสิทธิ์ผู้ใช้งาน
              </p>
            </div>
          </div>
        ) : !auth.isAdmin ? (
          <div className="max-w-3xl mx-auto p-8">
            <div className={cx(cardCls, "p-8 text-center")}>
              <h1 className="text-2xl font-extrabold tracking-tight">
                ไม่สามารถเข้าถึงได้
              </h1>
              <p className="text-slate-700 mt-2">
                หน้านี้สำหรับผู้ดูแลระบบเท่านั้น
              </p>
              <div className="mt-5">
                <Link href="/">
                  <div className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 inline-block">
                    กลับหน้าแรก
                  </div>
                </Link>
              </div>
              {(auth.email || auth.name) && (
                <p className="text-xs text-slate-500 mt-3">
                  ผู้ใช้ปัจจุบัน: {auth.name || "-"} ({auth.email || "-"})
                </p>
              )}
            </div>
          </div>
        ) : (
          <AdminDeliveryContent />
        )}
      </main>
      <Footer />
    </div>
  );
}
