// // components/CarCard.js
// import Image from "next/image";

// export default function CarCard({ name, brand, type, pricePerDay, image }) {
//   return (
//     <div className="bg-white text-black rounded-xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
//       {/* รูปแนวตั้ง */}
//       <div className="relative w-full aspect-[3/4] overflow-hidden rounded-t-xl">
//         <Image
//           src={image}
//           alt={name}
//           fill
//           className="object-cover"
//           sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
//         />
//       </div>

//       {/* ข้อมูลด้านล่าง (ตัวอักษรสีดำทั้งหมด) */}
//       <div className="p-3 space-y-1.5">
//         <h3 className="text-base font-semibold leading-snug">{name}</h3>
//         <p className="text-sm leading-tight">
//           {brand} • {type}
//         </p>
//         <p className="text-sm font-bold mt-1">
//           {pricePerDay.toLocaleString()} บาท/วัน
//         </p>
//       </div>
//     </div>
//   );
// }
