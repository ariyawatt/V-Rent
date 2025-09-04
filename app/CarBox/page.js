import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
import Image from "next/image";
import Link from "next/link";
import { cars } from "@/data/cars"; // <<< ใช้จากไฟล์กลาง

export default function CarBox() {
  return (
    <div>
      <Headers />
      <section className="p-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {cars.map((car) => (
            <Link key={car.id} href={`/cars/${car.id}`} className="block">
              <div className="bg-white text-black rounded-xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
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
                    {car.company.name}
                  </span>
                </div>
                <div className="p-3 space-y-1.5">
                  <h3 className="text-base font-semibold leading-snug">
                    {car.name}
                  </h3>
                  <p className="text-sm leading-tight">
                    {car.brand} • {car.type}
                  </p>
                  <p className="text-xs text-gray-600">
                    บริษัทให้เช่า: {car.company.name}
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
