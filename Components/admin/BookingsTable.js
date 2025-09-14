// components/admin/BookingsTable.jsx
import { BookingBadge, PayBadge } from "./Badges";
import { fmtBaht, fmtDateTimeLocal, computeDays } from "./utils";

export default function BookingsTable({
  bookings,
  carMapById,
  carMapByKey,
  now,
  onOpenDetail,
  onMarkPaid,
  onConfirmPickup,
  onComplete,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-black">ตารางการจองของลูกค้า</h2>
        <span className="text-sm text-gray-600">
          ทั้งหมด {bookings.length} รายการ
        </span>
      </div>

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
            {bookings.map((b) => {
              const car =
                (b.carId && carMapById.get(b.carId)) ||
                carMapByKey.get(b.carPlate || b.carName);
              const days = computeDays(b.pickupTime, b.returnTime);
              const total =
                Number(b.pricePerDay || 0) * days +
                (b.extras?.reduce((t, e) => t + Number(e.price || 0), 0) || 0) -
                Number(b.discount || 0);
              return (
                <tr key={b.id}>
                  <td className="py-3 pr-3">
                    <div>{fmtDateTimeLocal(b.pickupTime)}</div>
                    <div className="text-xs text-gray-500">
                      → {fmtDateTimeLocal(b.returnTime)}
                    </div>
                  </td>
                  <td className="py-3 pr-3 font-medium text-black">
                    {b.bookingCode}
                  </td>
                  <td className="py-3 pr-3">
                    <div>{b.customerName}</div>
                    <div className="text-xs text-gray-500">
                      {b.customerPhone}
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    {(car?.name || b.carName || "—") +
                      " / " +
                      (car?.licensePlate || b.carPlate || "—")}
                  </td>
                  <td className="py-3 pr-3">{fmtBaht(b.pricePerDay)} ฿</td>
                  <td className="py-3 pr-3">{days} วัน</td>
                  <td className="py-3 pr-3">{fmtBaht(total)} ฿</td>
                  <td className="py-3 pr-3">
                    <PayBadge value={b.paymentStatus} />
                  </td>
                  <td className="py-3 pr-3">
                    <BookingBadge value={b.bookingStatus} />
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onOpenDetail(b)}
                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                      >
                        ดู
                      </button>
                      <button
                        onClick={() => onMarkPaid(b)}
                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                      >
                        มาร์คชำระ
                      </button>
                      <button
                        onClick={() => onConfirmPickup(b)}
                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                      >
                        รับรถ
                      </button>
                      <button
                        onClick={() => onComplete(b)}
                        className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                      >
                        ปิดงาน
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
