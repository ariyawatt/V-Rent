// components/admin/DeliveriesTable.jsx
import { fmtDateTimeLocal } from "./utils";

export default function DeliveriesTable({ deliveries, onOpen }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-lg font-bold text-black">ประวัติส่งมอบ</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-3">รหัส</th>
              <th className="py-2 pr-3">จอง</th>
              <th className="py-2 pr-3">ลูกค้า</th>
              <th className="py-2 pr-3">รถ/ทะเบียน</th>
              <th className="py-2 pr-3">ส่งมอบ</th>
              <th className="py-2 pr-3">ผู้บันทึก</th>
              <th className="py-2 pr-3">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td className="py-3 pr-3">{d.id}</td>
                <td className="py-3 pr-3">{d.bookingCode}</td>
                <td className="py-3 pr-3">{d.customerName}</td>
                <td className="py-3 pr-3">
                  {d.carName} / {d.carPlate}
                </td>
                <td className="py-3 pr-3">{fmtDateTimeLocal(d.pickupTime)}</td>
                <td className="py-3 pr-3">{d.staff}</td>
                <td className="py-3 pr-3">
                  <button
                    onClick={() => onOpen(d)}
                    className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                  >
                    ดู
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
