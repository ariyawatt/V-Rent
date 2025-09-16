// app/cars/page.js
// ไฟล์นี้เป็น Server Component โดยค่าเริ่มต้น

import { Suspense } from 'react';
import Headers from "@/Components/Header";
import Footer from "@/Components/Footer";
import CarsPageContent from './CarsPageContent'; // Import Client Component ที่สร้างใหม่

export default function CarsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Headers />
      <main className="flex-1">
        <section className="p-6 sm:p-8 lg:p-10 text-white bg-black">
          {/* ห่อ CarsPageContent ด้วย Suspense */}
          <Suspense fallback={<div>กำลังโหลดข้อมูล...</div>}>
            <CarsPageContent />
          </Suspense>
        </section>
      </main>
      <Footer />
    </div>
  );
}