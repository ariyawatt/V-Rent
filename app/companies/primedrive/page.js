export default function PartnerIntroPrimeDrive() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-fuchsia-400 to-cyan-400 shadow-lg grid place-items-center font-black text-zinc-900">
              V
            </div>
            <div>
              <p className="font-semibold tracking-wide">V‑Rent</p>
              <p className="text-xs text-zinc-400">Partner Ecosystem</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
            <a href="#overview" className="hover:text-white">
              ภาพรวมพาร์ทเนอร์
            </a>
            <a href="#scope" className="hover:text-white">
              ขอบเขตความร่วมมือ
            </a>
            <a href="#benefits" className="hover:text-white">
              ประโยชน์
            </a>
            <a href="#fleet" className="hover:text-white">
              ฟลีทรถ
            </a>
            <a href="#sla" className="hover:text-white">
              SLA & Coverage
            </a>
            <a href="#contact" className="hover:text-white">
              ติดต่อ
            </a>
          </nav>
          <a
            href="#enable"
            className="px-4 py-2 rounded-xl bg-white text-zinc-900 font-medium hover:bg-zinc-200 transition"
          >
            เปิดใช้งานพาร์ทเนอร์
          </a>
        </div>
      </header>

      {/* Partner Hero: V‑Rent x PrimeDrive */}
      <section id="overview" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-25 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(217,70,239,0.35),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 py-16 grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-400">
              New Partner
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              แนะนำพาร์ทเนอร์ใหม่:{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                PrimeDrive
              </span>
            </h1>
            <p className="mt-4 text-zinc-300 md:text-lg">
              PrimeDrive เข้าร่วมเครือข่าย V‑Rent
              เพื่อยกระดับการให้บริการรถเช่ามาตรฐานองค์กร ครอบคลุมทั้ง{" "}
              <span className="font-semibold">ฟลีทมากกว่า 500 คัน</span>{" "}
              บริการซัพพอร์ต 24/7
              และระบบดิจิทัลที่เชื่อมต่อกับแพลตฟอร์มของเราแบบไร้รอยต่อ
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-2">
                <span className="text-xs text-zinc-400">สถานะ</span>
                <span className="text-xs rounded-lg bg-emerald-400/20 text-emerald-300 px-2 py-1">
                  Active
                </span>
              </div>
              <div className="text-sm text-zinc-400">
                เข้าร่วมเมื่อ • Sep 2025
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl border border-white/10 p-6 backdrop-blur bg-white/5">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1 text-center">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-white text-zinc-900 grid place-items-center font-black">
                    V
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">V‑Rent</p>
                </div>
                <div className="text-3xl font-black text-zinc-400">×</div>
                <div className="flex-1 text-center">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-400 text-zinc-900 grid place-items-center font-black">
                    P
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">PrimeDrive</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { k: "ฟลีทรถ", v: "500+ คัน" },
                  { k: "ประเภทรถ", v: "Sedan / SUV / Pickup" },
                  { k: "พื้นที่บริการ", v: "ทั่วไทย" },
                ].map((i, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 p-4"
                  >
                    <p className="text-xs text-zinc-400">{i.k}</p>
                    <p className="text-lg font-semibold">{i.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Scope */}
      <section id="scope" className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold">ขอบเขตความร่วมมือ</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[
            {
              t: "Inventory Sync",
              d: "ซิงก์สต็อกรถแบบเรียลไทม์ ระดับรุ่น/สี/ปี รองรับราคาแบบไดนามิก",
            },
            {
              t: "Unified Booking",
              d: "จองผ่าน V‑Rent แล้วกระจายออเดอร์ให้ PrimeDrive อัตโนมัติ พร้อม e‑contract",
            },
            {
              t: "Billing & SLA",
              d: "ออกใบกำกับ/วางบิลรวมรายเดือน พร้อม SLA การส่งมอบและรถสำรอง",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 p-6 hover:border-white/20 transition group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-fuchsia-400 to-cyan-400 mb-4 opacity-80 group-hover:opacity-100" />
              <h3 className="font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-zinc-300">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits for V‑Rent Customers */}
      <section id="benefits" className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              สิ่งที่ลูกค้า V‑Rent ได้รับ
            </h2>
            <ul className="mt-6 space-y-3 text-zinc-200">
              <li>• ตัวเลือกฟลีทเพิ่มขึ้น ครอบคลุมรถยอดนิยม</li>
              <li>• ราคาชัดเจน โปร่งใส พร้อมรวมประกันและบำรุงรักษา</li>
              <li>• เครือข่ายบริการฉุกเฉิน 24/7 และรถทดแทน</li>
              <li>• เอกสารภาษีครบ เครื่องมือรายงานค่าใช้จ่าย</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              {["Transparent Pricing", "24/7 Support", "Nationwide"].map(
                (b, i) => (
                  <span
                    key={i}
                    className="text-xs rounded-full border border-white/15 px-3 py-1 text-zinc-300"
                  >
                    {b}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-white/10">
            <img
              src="https://picsum.photos/1200/800?random=31"
              alt="benefits"
              className="w-full h-72 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Fleet highlight */}
      <section id="fleet" className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-bold">
            รถจาก PrimeDrive ที่พร้อมเชื่อมต่อ
          </h2>
          <a href="#" className="text-sm text-zinc-300 hover:text-white">
            ดูทั้งหมด
          </a>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              name: "Toyota Corolla Cross",
              tag: "SUV • 2023",
              img: "https://picsum.photos/800/500?random=41",
            },
            {
              name: "Honda City",
              tag: "Sedan • 2024",
              img: "https://picsum.photos/800/500?random=42",
            },
            {
              name: "Isuzu D‑MAX",
              tag: "Pickup • 2022",
              img: "https://picsum.photos/800/500?random=43",
            },
          ].map((car, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition"
            >
              <img
                src={car.img}
                alt={car.name}
                className="h-44 w-full object-cover"
              />
              <div className="p-4">
                <p className="font-semibold">{car.name}</p>
                <p className="text-xs text-zinc-400 mt-1">{car.tag}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SLA & Coverage */}
      <section id="sla" className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold">SLA & Coverage</h2>
        <div className="mt-6 grid md:grid-cols-4 gap-6">
          {[
            { k: "เวลาเฉลี่ยส่งมอบ", v: "24–48 ชม." },
            { k: "รถทดแทน", v: "ภายใน 6 ชม." },
            { k: "Maintenance", v: "ศูนย์บริการเครือข่าย" },
            { k: "พื้นที่บริการ", v: "77 จังหวัด" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/10 p-6">
              <p className="text-xs text-zinc-400">{s.k}</p>
              <p className="text-xl font-semibold mt-1">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Enable partner CTA */}
      <section id="enable" className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-3xl border border-white/10 p-8 bg-white/5">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <h3 className="text-xl md:text-2xl font-bold">
                เปิดใช้งาน PrimeDrive บน V‑Rent ของคุณ
              </h3>
              <p className="mt-2 text-zinc-300 text-sm">
                เชื่อมต่อพาร์ทเนอร์นี้เข้ากับสาขาหรือร้านของคุณ
                ตั้งค่าโซนให้บริการ เงื่อนไขราคา และเอกสารอัตโนมัติ
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="#"
                className="px-5 py-3 rounded-xl bg-white text-zinc-900 font-semibold"
              >
                Enable Now
              </a>
              <a
                href="#contact"
                className="px-5 py-3 rounded-xl border border-white/20"
              >
                คุยกับทีม
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 p-6">
            <p className="text-xs text-zinc-400">อีเมลสำหรับพาร์ทเนอร์</p>
            <p className="font-semibold">partners@v-rent.co</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-6">
            <p className="text-xs text-zinc-400">ไลน์ OA</p>
            <p className="font-semibold">@vrent-partners</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-6">
            <p className="text-xs text-zinc-400">ขอเอกสาร</p>
            <p className="font-semibold">Company profile, SLA, Rate card</p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} V‑Rent. All rights reserved.
        </p>
      </section>
    </div>
  );
}
