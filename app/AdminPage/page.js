// app/admin/page.js
"use client";

import { useMemo, useState } from "react";
import Headers from "@/Components/HeaderAd";
import Footer from "@/Components/Footer";

export default function AdminPage() {
  // ---- Mock: รายชื่อรถเริ่มต้น ----
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

  // ---- ตัวกรองตาราง ----
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

  // ---- ฟอร์มเพิ่มรถ ----
  const [form, setForm] = useState({
    name: "",
    brand: "",
    type: "Sedan",
    pricePerDay: "",
    status: "ว่าง",
    transmission: "อัตโนมัติ", // Auto / Manual
    licensePlate: "",
    seats: "",
    fuel: "เบนซิน",
    year: "",
    description: "",
  });

  // ---- Mock: พนักงานหลัก (การ์ดซ้าย) ----
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

  // ---- Modal แก้ไขข้อมูลรถ ----
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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Headers />

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-10 gap-6">
          {/* ซ้าย: ข้อมูลพนักงาน (3 ส่วน) */}
          <section className="md:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* กรอบรูปด้านบน (ขยายเต็ม) */}
              <div className="relative w-full h-40 sm:h-48 md:h-56 bg-gray-100">
                <div className="absolute inset-4 rounded-xl border-2 border-dashed border-gray-300" />
              </div>

              {/* ข้อมูลพนักงานด้านล่าง */}
              <div className="p-5">
                <h2 className="text-lg font-bold text-black">ข้อมูลพนักงาน</h2>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-semibold text-black">
                      {employee.name}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        employee.status === "ออนไลน์"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
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
              </div>
            </div>
          </section>

          {/* ขวา: หน้าต่างทำงาน (7 ส่วน) */}
          <section className="md:col-span-7">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-lg font-bold text-black">จัดการรถ</h2>

              {/* ฟอร์มเพิ่มรถ */}
              <form
                onSubmit={handleAddCar}
                className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3"
              >
                {/* แถว 1 */}
                <div className="md:col-span-2">
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
                <div className="md:col-span-2">
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
                <div className="md:col-span-2">
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

                {/* แถว 2 */}
                <div className="md:col-span-2">
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
                <div className="md:col-span-2">
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
                <div className="md:col-span-2">
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

                {/* แถว 3 */}
                <div className="md:col-span-2">
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
                <div className="md:col-span-2">
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
                <div className="md:col-span-2">
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

                {/* แถว 4 */}
                <div className="md:col-span-2">
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
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-black mb-1">
                    คำอธิบายเพิ่มเติม
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={5}
                    className="w-full rounded-lg border border-gray-400 px-3 py-2 focus:border-black focus:ring-black text-black placeholder:text-gray-400"
                    placeholder="รายละเอียด อุปกรณ์เสริม เงื่อนไขการเช่า ฯลฯ"
                  />
                </div>

                {/* ปุ่มเพิ่มรถ — จัดกลางหน้าจอ */}
                <div className="col-span-1 md:col-span-6 flex justify-center pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition"
                  >
                    เพิ่มรถ
                  </button>
                </div>
              </form>

              {/* แถบตัวกรองเหนือโต๊ะ */}
              <div className="mt-6 mb-3 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
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

              {/* ตารางรายการรถ */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">รุ่น</th>
                      <th className="py-2 pr-3">ยี่ห้อ</th>
                      <th className="py-2 pr-3">ป้ายทะเบียน</th>
                      <th className="py-2 pr-3">ราคา/วัน</th>
                      <th className="py-2 pr-3">สถานะ</th>
                      <th className="py-2 pr-3">การจัดการ</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredCars.map((c) => (
                      <tr key={c.id} className="align-middle">
                        <td className="py-3 pr-3 text-gray-700">{c.id}</td>
                        <td className="py-3 pr-3 font-medium text-black">
                          {c.name}
                        </td>
                        <td className="py-3 pr-3 text-gray-700">{c.brand}</td>
                        <td className="py-3 pr-3 text-gray-700">
                          {c.licensePlate || "—"}
                        </td>
                        <td className="py-3 pr-3 text-gray-700">
                          {c.pricePerDay.toLocaleString()} ฿
                        </td>
                        <td className="py-3 pr-3">
                          <StatusBadge value={c.status} />
                        </td>

                        {/* ปุ่มแก้ไข/ลบ แบบเรียบ ๆ */}
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(c)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-gray-800 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
                              aria-label={`แก้ไข ${c.name}`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0-2.121-2.121L5.879 17.879 4 20z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              แก้ไข
                            </button>

                            <button
                              onClick={() => handleDelete(c.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
                              aria-label={`ลบ ${c.name}`}
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredCars.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
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
          </section>
        </div>
      </main>

      <Footer />

      {/* ----- Modal แก้ไขข้อมูลรถ ----- */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* พื้นหลังมืดกดปิดได้ */}
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
    </div>
  );
}
