// app/delivery/page.js
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";

const labelCls = "text-sm font-semibold text-slate-800";
const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black";
const cardCls = "bg-white rounded-2xl shadow-lg border border-slate-200";

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

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
      const v = videoRef.current;
      if (v) {
        v.pause?.();
        v.srcObject = null;
      }
      const s = streamRef.current;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } catch {}
  };

  const listDevices = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      if (!deviceId && cams[0]?.deviceId) setDeviceId(cams[0].deviceId);
    } catch {}
  };

  const openCamera = async (id = deviceId) => {
    setErr("");
    if (!window.isSecureContext && location.hostname !== "localhost") {
      setErr(
        "กล้องต้องใช้บน HTTPS หรือ http://localhost เท่านั้น\n" +
          "วิธีแก้: ใช้ https, เปิดผ่าน localhost, หรือเปิด flags: Insecure origins treated as secure แล้วใส่โดเมนนี้"
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErr("เบราว์เซอร์นี้ไม่รองรับ getUserMedia");
      return;
    }

    stopStream();

    try {
      const constraints = {
        video: id ? { deviceId: { exact: id } } : { facingMode: "environment" },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      await listDevices();

      try {
        const track = stream.getVideoTracks()?.[0];
        const settings = track?.getSettings?.();
        if (settings?.deviceId) setDeviceId(settings.deviceId);
      } catch {}

      setCamKey((k) => k + 1);
      setIsOpen(true);

      setTimeout(async () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        try {
          await video.play();
        } catch {}
      }, 0);
    } catch (e) {
      const name = e?.name || "";
      if (name === "NotAllowedError") {
        setErr("ถูกปฏิเสธสิทธิ์กล้อง กรุณาอนุญาตใน Site settings แล้วลองใหม่");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setErr("ไม่พบอุปกรณ์กล้องที่ใช้งานได้");
      } else {
        setErr("เปิดกล้องไม่สำเร็จ: " + (e.message || String(e)));
      }
      setIsOpen(false);
      stopStream();
    }
  };

  const closeCamera = () => {
    stopStream();
    setIsOpen(false);
  };

  const switchCamera = async () => {
    if (devices.length < 2) return;
    const idx = devices.findIndex((d) => d.deviceId === deviceId);
    const next = devices[(idx + 1) % devices.length];
    await openCamera(next.deviceId);
  };

  const takeShot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        onCapture?.({ blob, url, dataUrl });
        closeCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") {
        stopStream();
        setIsOpen(false);
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openCamera()}
            disabled={disabled}
            className={cls(
              "px-3 py-1.5 rounded-lg border text-sm",
              disabled
                ? "border-slate-200 text-slate-400"
                : "border-slate-300 hover:bg-slate-50"
            )}
          >
            เปิดกล้อง
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          className={cls(inputCls, "max-w-full")}
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
          className={cls(
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

      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 cursor-pointer text-slate-900 text-sm">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            onCapture?.({ blob: file, url, dataUrl: null });
            e.currentTarget.value = "";
          }}
          disabled={disabled}
        />
        อัปโหลดรูปแทน
      </label>

      {err && <p className="text-xs whitespace-pre-line text-red-600">{err}</p>}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
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
                  stopStream();
                  setIsOpen(false);
                }}
                className="px-3 py-2 rounded-lg text-white/90 hover:text-white"
              >
                ปิด
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={switchCamera}
                  disabled={devices.length < 2}
                  className={cls(
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

/* ───────────── Admin ส่วนที่มี hooks เยอะ แยกออกมา ───────────── */
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

  const addProof = (setFn) => (img) =>
    setFn((prev) => [
      ...prev,
      { url: img.url, blob: img.blob, dataUrl: img.dataUrl },
    ]);

  const removeProof = (setFn) => (idx) =>
    setFn((prev) => {
      const cp = [...prev];
      const item = cp[idx];
      try {
        if (item?.url?.startsWith("blob:")) URL.revokeObjectURL(item.url);
      } catch {}
      cp.splice(idx, 1);
      return cp;
    });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const required = ["bookingCode", "customerName", "customerPhone"];
    const missing = required.filter((k) => !form[k]);
    if (missing.length) {
      alert("กรุณากรอกข้อมูลให้ครบ: " + missing.join(", "));
      return;
    }
    if (idProofs.length === 0) {
      const ok = confirm("ยังไม่มีรูปยืนยันตัวตน ต้องการบันทึกต่อไปหรือไม่?");
      if (!ok) return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
    idProofs.forEach((p, i) =>
      fd.append("id_proof_" + (i + 1), p.blob, `id_proof_${i + 1}.jpg`)
    );
    carProofs.forEach((p, i) =>
      fd.append("car_proof_" + (i + 1), p.blob, `car_proof_${i + 1}.jpg`)
    );

    console.log("DELIVERY_SUBMIT_FORMDATA", {
      ...form,
      idProofsCount: idProofs.length,
      carProofsCount: carProofs.length,
    });
    alert("บันทึกสำเร็จ (demo) — พร้อมส่งรูปเป็นไฟล์ไป backend");
  };

  const sameDate = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const fmtTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const todayAt = (h, m = 0) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const initialQueue = useMemo(
    () => [
      {
        bookingCode: "VR-2025-201",
        customerName: "คุณเอ",
        customerPhone: "080-111-0001",
        carName: "Toyota Corolla Cross",
        carPlate: "1กข-1234",
        pickupLocation: "สนามบินเชียงใหม่ (CNX)",
        pickupTime: todayAt(9, 30),
        returnLocation: "สาขาสีลม",
        returnTime: todayAt(11, 30),
        status: "pending",
      },
      {
        bookingCode: "VR-2025-202",
        customerName: "คุณบี",
        customerPhone: "081-222-0002",
        carName: "Honda Civic",
        carPlate: "ฮค-4444",
        pickupLocation: "สาขาสีลม",
        pickupTime: todayAt(13, 0),
        returnLocation: "สาขาสีลม",
        returnTime: todayAt(15, 0),
        status: "in_progress",
      },
      {
        bookingCode: "VR-2025-203",
        customerName: "คุณซี",
        customerPhone: "082-333-0003",
        carName: "Isuzu D-Max",
        carPlate: "ดม-2345",
        pickupLocation: "สาขาสีลม",
        pickupTime: todayAt(17, 30),
        returnLocation: "สาขาสีลม",
        returnTime: todayAt(19, 0),
        status: "done",
      },
    ],
    []
  );

  const [queue] = useState(initialQueue);

  const loadToForm = (j) => {
    setForm((f) => ({
      ...f,
      bookingCode: j.bookingCode || "",
      carPlate: j.carPlate || "",
      carName: j.carName || "",
      customerName: j.customerName || "",
      customerPhone: j.customerPhone || "",
      pickupLocation: j.pickupLocation || "",
      pickupTime: j.pickupTime
        ? new Date(j.pickupTime).toISOString().slice(0, 16)
        : "",
      returnLocation: j.returnLocation || "",
      returnTime: j.returnTime
        ? new Date(j.returnTime).toISOString().slice(0, 16)
        : "",
    }));
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
      {/* ซ้าย: ฟอร์ม */}
      <section className={`${cardCls} p-6 md:p-8`}>
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
          {/* ข้อมูลการจอง / รถ */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>รหัสการจอง *</label>
              <input
                name="bookingCode"
                className={inputCls}
                placeholder="เช่น VR-2025-000123"
                value={form.bookingCode}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>ทะเบียนรถ</label>
              <input
                name="carPlate"
                className={inputCls}
                placeholder="1กก-1234"
                value={form.carPlate}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>รุ่นรถ</label>
              <input
                name="carName"
                className={inputCls}
                placeholder="Toyota Corolla Cross"
                value={form.carName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* ลูกค้า */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>ชื่อลูกค้า *</label>
              <input
                name="customerName"
                className={inputCls}
                placeholder="ชื่อ–นามสกุล"
                value={form.customerName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>เบอร์ติดต่อ *</label>
              <input
                name="customerPhone"
                className={inputCls}
                placeholder="080-000-0000"
                value={form.customerPhone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>เลขประจำตัว/เอกสาร</label>
              <input
                name="customerId"
                className={inputCls}
                placeholder="เลขบัตร/ใบขับขี่/Passport"
                value={form.customerId}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* สถานที่/เวลา */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>สถานที่ส่งมอบ</label>
              <input
                name="pickupLocation"
                className={inputCls}
                placeholder="เช่น สนามบินเชียงใหม่ (CNX)"
                value={form.pickupLocation}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>วัน–เวลาส่งมอบ</label>
              <input
                type="datetime-local"
                name="pickupTime"
                className={inputCls}
                value={form.pickupTime}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* คืนรถ */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>สถานที่นัดคืนรถ</label>
              <input
                name="returnLocation"
                className={inputCls}
                placeholder="เช่น สาขาสยามพารากอน"
                value={form.returnLocation}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>วัน–เวลาคืนรถ</label>
              <input
                type="datetime-local"
                name="returnTime"
                className={inputCls}
                value={form.returnTime}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* สถานะ/ตัวเลข */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>ระดับน้ำมัน</label>
              <select
                name="fuelLevel"
                className={inputCls}
                value={form.fuelLevel}
                onChange={handleChange}
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
                placeholder="เช่น 35,420"
                value={form.odometer}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>เงินมัดจำ</label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50">
                <input
                  type="checkbox"
                  name="depositReceived"
                  checked={form.depositReceived}
                  onChange={handleChange}
                  className="h-4 w-4 accent-black"
                />
                ได้รับเรียบร้อย
              </label>
            </div>
          </div>

          {/* ประเภทเอกสารที่ตรวจ */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>เอกสารที่ใช้ยืนยัน</label>
              <select
                name="verifyType"
                className={inputCls}
                value={form.verifyType}
                onChange={handleChange}
              >
                <option value="citizen_id">บัตรประชาชน</option>
                <option value="driver_license">ใบขับขี่</option>
                <option value="passport">Passport</option>
              </select>
            </div>
          </div>

          {/* กล้อง/อัปโหลด: เอกสารยืนยัน */}
          <div className="space-y-3">
            <CameraBox
              title="ถ่ายรูปเอกสารยืนยันตัวตน (บัตร/ใบขับขี่/Passport)"
              onCapture={addProof(setIdProofs)}
              buttonLabel="ถ่ายหลักฐาน"
            />
            {idProofs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {idProofs.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden border border-slate-300"
                  >
                    <img
                      src={p.dataUrl || p.url}
                      alt={`ID Proof ${idx + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeProof(setIdProofs)(idx)}
                      className="absolute top-1 right-1 px-2 py-0.5 text-xs rounded bg-black/70 text-white"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* กล้อง/อัปโหลด: สภาพรถ */}
          <div className="space-y-3">
            <CameraBox
              title="ถ่ายรูปสภาพรถตอนส่งมอบ (รอย/ล้อ/มุมต่าง ๆ)"
              onCapture={addProof(setCarProofs)}
              buttonLabel="ถ่ายรูปสภาพรถ"
            />
            {carProofs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {carProofs.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden border border-slate-300"
                  >
                    <img
                      src={p.dataUrl || p.url}
                      alt={`Car Proof ${idx + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeProof(setCarProofs)(idx)}
                      className="absolute top-1 right-1 px-2 py-0.5 text-xs rounded bg-black/70 text-white"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* หมายเหตุ */}
          <div className="space-y-2">
            <label className={labelCls}>หมายเหตุเพิ่มเติม</label>
            <textarea
              name="notes"
              className={inputCls}
              rows={4}
              placeholder="เช่น มีรอยขีดข่วนบริเวณกันชนหน้า..."
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          {/* ปุ่ม */}
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
                setIdProofs((prev) => {
                  prev.forEach((p) => {
                    try {
                      if (p?.url?.startsWith("blob:"))
                        URL.revokeObjectURL(p.url);
                    } catch {}
                  });
                  return [];
                });
                setCarProofs((prev) => {
                  prev.forEach((p) => {
                    try {
                      if (p?.url?.startsWith("blob:"))
                        URL.revokeObjectURL(p.url);
                    } catch {}
                  });
                  return [];
                });
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
      </section>

      {/* ขวา: สรุปโดยย่อ */}
      <aside className={`${cardCls} p-6 md:p-8 h-fit`}>
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
      <aside className={`${cardCls} p-6 md:p-8 h-fit`}>
        <h3 className="text-lg font-bold">คิววันนี้ (Today)</h3>
        <p className="text-slate-600 text-sm mt-1">
          แสดงเฉพาะงานรับรถที่นัดหมาย “วันนี้”
        </p>
        <TodayQueue queue={queue} onPick={loadToForm} />
      </aside>
    </div>
  );
}

/* แยก TodayQueue เป็น component ของตัวเอง (มี useMemo ของตัวเอง) */
function TodayQueue({ queue, onPick }) {
  const sameDate = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const fmtTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const todayQueue = useMemo(
    () => queue.filter((j) => sameDate(new Date(j.pickupTime), new Date())),
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
                <span
                  className={cls(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    j.status === "pending" && "bg-amber-100 text-amber-800",
                    j.status === "in_progress" && "bg-blue-100 text-blue-800",
                    j.status === "done" && "bg-emerald-100 text-emerald-800"
                  )}
                >
                  {j.status === "pending"
                    ? "รอส่งมอบ"
                    : j.status === "in_progress"
                    ? "กำลังดำเนินการ"
                    : "เสร็จแล้ว"}
                </span>
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
          {todayQueue.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-slate-500">
                วันนี้ยังไม่มีคิวรับรถ
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────── Gate Component (คงลำดับ hooks เสมอ) ───────────── */
export default function DeliveryStaffPage() {
  const [auth, setAuth] = useState({
    loading: true,
    isAdmin: false,
    name: "",
    email: "",
  });

  useEffect(() => {
    let ignore = false;

    // preload จาก localStorage
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

    // ยืนยันกับ backend
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
      <Headers />
      <main className="flex-grow">
        {auth.loading ? (
          <div className="max-w-3xl mx-auto p-8">
            <div className={`${cardCls} p-8 text-center`}>
              <p className="text-lg font-semibold">กำลังตรวจสอบสิทธิ์...</p>
              <p className="text-slate-600 mt-1 text-sm">
                กรุณารอสักครู่ ระบบกำลังตรวจสอบสิทธิ์ผู้ใช้งาน
              </p>
            </div>
          </div>
        ) : !auth.isAdmin ? (
          <div className="max-w-3xl mx-auto p-8">
            <div className={`${cardCls} p-8 text-center`}>
              <h1 className="text-2xl font-extrabold tracking-tight">
                ไม่สามารถเข้าถึงได้
              </h1>
              <p className="text-slate-700 mt-2">
                หน้านี้สำหรับผู้ดูแลระบบเท่านั้น
              </p>
              <div className="mt-5">
                <a
                  href="/"
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 inline-block"
                >
                  กลับหน้าแรก
                </a>
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
