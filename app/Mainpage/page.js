"use client";

import Footer from "@/Components/Footer";
// กันชนชื่อกับ Web Headers
import HeaderBar from "@/Components/Header";
import BookingBox from "@/Components/bookingbox";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleSearch = (data) => {
    // สร้าง query string จาก payload ที่ได้จาก BookingBox
    const params = new URLSearchParams();

    const fields = [
      "pickup_at",
      "return_at",
      "passengers",
      "promo",
      "ftype",
      "pickup_location",
      "dropoff_location",
    ];

    fields.forEach((k) => {
      const v = data?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        params.set(k, String(v));
      }
    });

    // เผื่อไว้: ถ้า BookingBox รุ่นเก่ายังส่ง pickupDate/pickupTime ... มาด้วย ก็พกไปด้วย
    ["pickupDate", "pickupTime", "returnDate", "returnTime", "carType"].forEach(
      (k) => {
        const v = data?._raw?.[k] ?? data?.[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          params.set(k, String(v));
        }
      }
    );

    router.push(`/carbox?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderBar />
      <main className="flex-grow bg-white">
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="max-w-6xl mx-auto">
            {/* แค่ส่ง onSearch -> ไปหน้าถัดไป */}
            <BookingBox onSearch={handleSearch} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
