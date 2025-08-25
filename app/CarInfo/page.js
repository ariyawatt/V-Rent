// app/cars/[id]/page.js
"use client";

import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
import Image from "next/image";

export default function CarInfo({ params }) {
  const car = {
    id: params.id,
    name: "Toyota Corolla Cross",
    brand: "Toyota",
    type: "SUV",
    pricePerDay: 1800,
    year: 2023,
    seats: 5,
    transmission: "อัตโนมัติ",
    fuel: "เบนซิน",
    description:
      "รถ SUV สไตล์ทันสมัย ขับง่าย ประหยัดน้ำมัน เหมาะกับการเดินทางทั้งในเมืองและต่างจังหวัด",
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Headers />

      {/* เต็มกว้าง และจัดกึ่งกลางแนวตั้งระหว่าง Header/Footers */}
      <main className="flex-grow bg-gray-100 grid content-center">
        {/* การ์ดเต็มจอซ้าย-ขวา */}
        <div className="w-full bg-white rounded-none shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* รูปซ้าย */}
          <div className="relative w-full h-[42vh] md:h-[70vh]">
            <Image
              src="/images/cars/toyota-corolla-cross.jpg"
              alt={car.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* ข้อมูลขวา */}
          <div className="flex h-full flex-col justify-between p-6 md:p-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-black">
                {car.name}
              </h1>
              <p className="text-gray-700 mb-4">
                {car.brand} • {car.type}
              </p>
              <p className="text-2xl font-semibold text-black mb-6">
                {car.pricePerDay.toLocaleString()} บาท/วัน
              </p>

              <ul className="space-y-2 text-gray-800 mb-6">
                <li>ปี: {car.year}</li>
                <li>จำนวนที่นั่ง: {car.seats}</li>
                <li>ระบบเกียร์: {car.transmission}</li>
                <li>เชื้อเพลิง: {car.fuel}</li>
              </ul>

              <p className="text-gray-700">{car.description}</p>
            </div>

            <div className="mt-8">
              <button className="w-full md:w-auto px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition">
                จองรถคันนี้
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
