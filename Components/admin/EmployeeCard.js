// components/admin/EmployeeCard.jsx
"use client";

import { useEffect, useState } from "react";

export default function EmployeeCard({ userId = "" }) {
  const [employee, setEmployee] = useState({
    id: "-",
    name: "-",
    role: "-",
    status: "-",
    phone: "-",
    email: "-",
    branch: "-",
    shift: "-",
    startDate: "-",
    lastLogin: "-",
  });
  const [todaySummary, setTodaySummary] = useState({
    pickups: 0,
    returns: 0,
    pendingPay: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");

        const effectiveUserId =
          userId ||
          (typeof window !== "undefined"
            ? localStorage.getItem("vrent_user_id") || ""
            : "");

        if (!effectiveUserId) {
          setError("ไม่พบ user_id สำหรับเรียกข้อมูลพนักงาน");
          setLoading(false);
          return;
        }

        const url = new URL(
          "https://demo.erpeazy.com/api/method/erpnext.api.get_admin"
        );
        url.searchParams.set("user_id", effectiveUserId);

        const res = await fetch(url.toString(), {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 403)
            throw new Error("คุณไม่มีสิทธิ์ดึงข้อมูลพนักงาน (403)");
          throw new Error(`เกิดข้อผิดพลาด (HTTP ${res.status})`);
        }

        const json = await res.json();
        const msg = json?.message;

        // ⭐ รองรับได้ทั้ง object และ array
        let mapped = {};
        if (Array.isArray(msg)) {
          // จากรูปใน Network:
          // ["Administrator", null, "Bankok", "Normal", "2023-05-22", "2025-09-14 19:41:03.277131", "Administrator"]
          const [
            full_name,
            phone,
            branch,
            status, // ค่าที่เห็นคือ "Normal"
            start_date,
            last_login,
            role,
          ] = msg;

          mapped = {
            id: "-", // ไม่มีใน array นี้
            name: full_name ?? "-",
            role: role ?? "-",
            status: status ?? "-",
            phone: phone ?? "-",
            email: effectiveUserId, // ใช้อีเมลที่ล็อกอินแสดงแทน
            branch: branch ?? "-",
            shift: "-", // ไม่มีในผลลัพธ์นี้
            startDate: start_date ?? "-",
            lastLogin: last_login ?? "-",
          };
        } else if (msg && typeof msg === "object") {
          mapped = {
            id: msg.employee_id || msg.id || "-",
            name: msg.full_name || msg.name || "-",
            role: msg.role || "-",
            status: msg.status || "-",
            phone: msg.phone || "-",
            email: msg.email || effectiveUserId || "-",
            branch: msg.branch || "-",
            shift: msg.shift || "-",
            startDate: msg.start_date || msg.startDate || "-",
            lastLogin: msg.last_login || msg.lastLogin || "-",
          };
        } else {
          throw new Error("รูปแบบข้อมูลไม่ถูกต้อง");
        }

        setEmployee(mapped);

        // สรุปวันนี้ (ถ้ายังไม่มีให้เป็นศูนย์ไปก่อน)
        const sum = (msg && msg.summary) || {};
        setTodaySummary({
          pickups: Number(sum.pickups ?? sum.pickups_today ?? 0),
          returns: Number(sum.returns ?? sum.returns_today ?? 0),
          pendingPay: Number(sum.pending_pay ?? sum.pendingPay ?? 0),
        });
      } catch (e) {
        setError(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [userId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="relative w-full h-40 sm:h-48 lg:h-56 bg-gray-100">
        <div className="absolute inset-4 rounded-xl border-2 border-dashed border-gray-300" />
      </div>

      <div className="p-5">
        <h2 className="text-lg font-bold text-black">ข้อมูลพนักงาน</h2>

        {loading && (
          <p className="mt-3 text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
        )}

        {!!error && !loading && (
          <p className="mt-3 text-sm text-red-600">
            โหลดข้อมูลไม่สำเร็จ: {error}
          </p>
        )}

        {!loading && !error && (
          <>
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
              <div className="grid gap-y-1.5 text-sm text-gray-800 mt-3">
                <div>
                  รหัสพนักงาน:{" "}
                  <span className="font-medium text-black">{employee.id}</span>
                </div>
                <div>สาขา: {employee.branch}</div>
                <div>กะทำงาน: {employee.shift}</div>
                <div>เริ่มงาน: {employee.startDate}</div>
                <div>เข้าระบบล่าสุด: {employee.lastLogin}</div>
                <div>โทร: {employee.phone}</div>
                <div>อีเมล: {employee.email}</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border bg-gray-50 p-2">
                <div className="text-xs text-gray-500">รับรถวันนี้</div>
                <div className="text-lg font-bold">{todaySummary.pickups}</div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-2">
                <div className="text-xs text-gray-500">คืนรถวันนี้</div>
                <div className="text-lg font-bold">{todaySummary.returns}</div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-2">
                <div className="text-xs text-gray-500">รอชำระ</div>
                <div className="text-lg font-bold">
                  {todaySummary.pendingPay}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
