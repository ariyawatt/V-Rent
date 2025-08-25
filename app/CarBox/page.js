// app/CarBox/page.js (หรือ components/CarBox.js ถ้าคุณใช้แบบ component)
import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
import Image from "next/image";
import Link from "next/link";

export default function CarBox() {
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
    },
  ];

  return (
    <div>
      <Headers />

      <section className="p-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cars.map((car) => (
            <Link key={car.id} href={`/cars/${car.id}`} className="block">
              <div className="bg-white text-black rounded-xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                {/* รูป */}
                <div className="relative w-full aspect-[3/4] overflow-hidden rounded-t-xl">
                  <Image
                    src={car.image}
                    alt={car.name}
                    fill
                    className="object-cover"
                    sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                    priority={car.id <= 4}
                  />
                </div>
                {/* ข้อมูล */}
                <div className="p-3 space-y-1.5">
                  <h3 className="text-base font-semibold leading-snug">
                    {car.name}
                  </h3>
                  <p className="text-sm leading-tight">
                    {car.brand} • {car.type}
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
