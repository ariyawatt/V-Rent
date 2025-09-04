// app/CarBox/page.js
import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
import Image from "next/image";
import Link from "next/link";

export default function CarBox() {
  // Mock บริษัทคู่ค้า 2 เจ้า
  const partners = [
    "V-Rent Partner • PrimeDrive",
    "V-Rent Partner • SpeedAuto",
  ];

  const cars = [
    {
      id: 1,
      name: "Toyota Corolla Cross",
      brand: "Toyota",
      type: "SUV",
      pricePerDay: 1800,
      year: 2023,
      seats: 5,
      transmission: "อัตโนมัติ",
      fuel: "เบนซิน",
      image: "/images/cars/toyota-corolla-cross.jpg",
      description:
        "รถ SUV สไตล์ทันสมัย ขับง่าย ประหยัดน้ำมัน เหมาะกับทั้งในเมืองและต่างจังหวัด",
      company: partners[0],
    },
    {
      id: 2,
      name: "Mitsubishi Evolution",
      brand: "Mitsubishi",
      type: "JDM",
      pricePerDay: 1500,
      year: 2006,
      seats: 5,
      transmission: "ธรรมดา",
      fuel: "เบนซิน",
      image: "/images/cars/Evo.jpg",
      description: "สปอร์ต 4 ประตูสายโหด ขับสนุก เกาะถนน",
      company: partners[1],
    },
    {
      id: 3,
      name: "Toyota AE86",
      brand: "Toyota",
      type: "JDM",
      pricePerDay: 1200,
      year: 1986,
      seats: 4,
      transmission: "ธรรมดา",
      fuel: "เบนซิน",
      image: "/images/cars/AE86.jpg",
      description: "ไอคอนยุค 80s ขับสนุก น้ำหนักเบา สายดริฟท์",
      company: partners[0],
    },
    {
      id: 4,
      name: "Nissan Skyline (R34)",
      brand: "Nissan",
      type: "JDM",
      pricePerDay: 2000,
      year: 1999,
      seats: 4,
      transmission: "ธรรมดา",
      fuel: "เบนซิน",
      image: "/images/cars/JDM-7.jpg",
      description: "ตำนาน Skyline R34 ขับมันส์ ดุดัน",
      company: partners[1],
    },
    {
      id: 5,
      name: "Nissan Skyline (R32)",
      brand: "Nissan",
      type: "JDM",
      pricePerDay: 1100,
      year: 1993,
      seats: 4,
      transmission: "ธรรมดา",
      fuel: "เบนซิน",
      image: "/images/cars/nissan-gt-r-r32-ev-conversion.jpg",
      description: "R32 สายคลาสสิก เสียงเครื่องเร้าใจ",
      company: partners[0],
    },
    {
      id: 6,
      name: "Nissan Skyline (R30)",
      brand: "Nissan",
      type: "JDM",
      pricePerDay: 1700,
      year: 1984,
      seats: 4,
      transmission: "ธรรมดา",
      fuel: "เบนซิน",
      image: "/images/cars/R (1).jpg",
      description: "คาแรคเตอร์จัดจ้าน กลิ่นอายเรโทร",
      company: partners[1],
    },
    {
      id: 7,
      name: "Nissan Silvia S13",
      brand: "Nissan",
      type: "JDM",
      pricePerDay: 1600,
      year: 1991,
      seats: 4,
      transmission: "ธรรมดา",
      fuel: "เบนซิน",
      image: "/images/cars/R (2).jpg",
      description: "แชสซีส์ยอดนิยม สายดริฟท์ต้องรู้จัก",
      company: partners[0],
    },
    {
      id: 8,
      name: "Subaru Impreza WRX STI",
      brand: "Subaru",
      type: "JDM",
      pricePerDay: 1400,
      year: 2007,
      seats: 5,
      transmission: "ธรรมดา",
      fuel: "เบนซิน",
      image: "/images/cars/R.jpg",
      description: "เทอร์โบ AWD เกาะถนนโหดในทุกสภาพ",
      company: partners[1],
    },
  ];

  return (
    <div>
      <Headers />

      <section className="p-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {cars.map((car) => (
            <Link key={car.id} href={`/cars/${car.id}`} className="block">
              <div className="bg-white text-black rounded-xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                {/* รูป + ป้ายบริษัท */}
                <div className="relative w-full aspect-[3/4] overflow-hidden rounded-t-xl">
                  <Image
                    src={car.image}
                    alt={car.name}
                    fill
                    className="object-cover"
                    sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                    priority={car.id <= 4}
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-black/75 text-white text-[11px] px-2 py-0.5">
                    {car.company}
                  </span>
                </div>

                {/* ข้อมูล */}
                <div className="p-3 space-y-1.5">
                  <h3 className="text-base font-semibold leading-snug">
                    {car.name}
                  </h3>
                  <p className="text-sm leading-tight">
                    {car.brand} • {car.type}
                  </p>
                  {/* แสดงบริษัทอีกจุดแบบอ่านง่าย (ถ้าชอบไม่ซ้อนบนรูป เอาอันนี้พอได้) */}
                  <p className="text-xs text-gray-600">
                    บริษัทให้เช่า: {car.company}
                  </p>

                  <p className="text-sm font-bold mt-1">
                    {car.pricePerDay.toLocaleString()} บาท/วัน
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
