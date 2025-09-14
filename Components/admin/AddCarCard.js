// components/admin/AddCarCard.jsx
import { useRef } from "react";

// props ที่ต้องส่งเข้า:
// - form: state ของฟอร์มรถ
// - onChange: fn(e) อัปเดตค่าในฟอร์ม (controlled inputs)
// - onSubmit: fn(e) เมื่อกดเพิ่มรถ
// - onImageChange: fn(e) เปลี่ยนรูป
// - fileRef (optional): ใครอยากล้างค่า input[type=file] ภายนอก สามารถส่ง ref มาด้วย
export default function AddCarCard({
  form,
  onChange,
  onSubmit,
  onImageChange,
  fileRef: externalFileRef,
}) {
  const internalFileRef = useRef(null);
  const fileRef = externalFileRef ?? internalFileRef;

  const clearImage = () => {
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-lg font-bold text-black">เพิ่มรถเพื่อเช่า</h2>

      <form
        onSubmit={onSubmit}
        className="mt-4 grid grid-cols-1 xl:grid-cols-6 gap-3"
      >
        {/* ชื่อรถ / ยี่ห้อ / ประเภท */}
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-black mb-1">
            ชื่อรถ *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="เช่น Toyota Corolla Cross"
            required
            className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
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
            onChange={onChange}
            placeholder="เช่น Toyota"
            required
            className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
          />
        </div>
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-black mb-1">
            ประเภท
          </label>
          <select
            name="type"
            value={form.type}
            onChange={onChange}
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

        {/* เกียร์ / ป้ายทะเบียน / จำนวนที่นั่ง */}
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-black mb-1">
            ระบบเกียร์
          </label>
          <select
            name="transmission"
            value={form.transmission}
            onChange={onChange}
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
            onChange={onChange}
            placeholder="เช่น 1กข 1234 กรุงเทพฯ"
            className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
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
            onChange={onChange}
            placeholder="เช่น 5"
            className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
          />
        </div>

        {/* เชื้อเพลิง / ปีรถ / ราคา/วัน */}
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-black mb-1">
            ประเภทเชื้อเพลิง
          </label>
          <select
            name="fuel"
            value={form.fuel}
            onChange={onChange}
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
            onChange={onChange}
            placeholder="เช่น 2021"
            className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
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
            onChange={onChange}
            placeholder="เช่น 1500"
            required
            className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
          />
        </div>

        {/* สถานะ / รูป */}
        <div className="xl:col-span-2">
          <label className="block text-xs font-semibold text-black mb-1">
            สถานะ
          </label>
          <select
            name="status"
            value={form.status}
            onChange={onChange}
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
            onChange={onImageChange}
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
                  onChange({ target: { name: "imageData", value: "" } });
                  clearImage();
                }}
                className="mt-2 text-xs text-gray-600 underline"
              >
                ลบรูป
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              รองรับไฟล์ .jpg, .png, .webp (≤ 4MB)
            </p>
          )}
        </div>

        {/* คำอธิบาย */}
        <div className="xl:col-span-4">
          <label className="block text-xs font-semibold text-black mb-1">
            คำอธิบายเพิ่มเติม
          </label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={onChange}
            placeholder="รายละเอียด อุปกรณ์เสริม เงื่อนไขการเช่า ฯลฯ"
            className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
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
  );
}
