// /data/cars.js
export const partners = [
  { name: "V-Rent Partner • PrimeDrive", slug: "primedrive" },
  { name: "V-Rent Partner • SpeedAuto", slug: "speedauto" },
];

export const cars = [
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
    company: partners[0], // PrimeDrive
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
    company: partners[1], // SpeedAuto
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
    company: partners[0], // PrimeDrive
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
    company: partners[1], // SpeedAuto
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
    company: partners[0], // PrimeDrive
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
    company: partners[1], // SpeedAuto
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
    company: partners[0], // PrimeDrive
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
    company: partners[1], // SpeedAuto
  },
];

export const getCarById = (id) => cars.find((c) => String(c.id) === String(id));
