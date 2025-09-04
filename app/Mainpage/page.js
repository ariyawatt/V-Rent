"use client";

import Footer from "@/Components/Footer";
import Headers from "@/Components/Header";
import BookingBox from "@/Components/bookingbox";

export default function Home() {
  const handleSearch = (data) => {
    // TODO: ส่ง data ไปค้นรถใน backend หรือไปหน้าผลการค้นหา
    console.log("search payload:", data);
  };
  return (
    <div className="flex flex-col min-h-screen">
      <Headers />

      {/* ส่วนเนื้อหา */}
      <main className="flex-grow bg-white">
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="max-w-6xl mx-auto">
            <BookingBox onSearch={handleSearch} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
