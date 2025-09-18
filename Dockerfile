# Stage 1: Build แอปพลิเคชัน
FROM node:20-alpine AS builder

# ตั้งค่า working directory ใน container
WORKDIR /app

# คัดลอก dependencies และติดตั้ง
COPY package.json package-lock.json ./
RUN npm install

# คัดลอก source code ทั้งหมด
COPY . .

# สร้างโปรดักชัน build
RUN npm run build

# Stage 2: Production Image
FROM node:20-alpine AS runner

# ตั้งค่า working directory ใน container
WORKDIR /app

# ตั้งค่า Environment Variable สำหรับ Port ที่ Cloud Run จะใช้
ENV PORT=3000

# คัดลอกไฟล์ที่จำเป็นสำหรับการรัน production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# คำสั่งเริ่มต้นสำหรับรันแอปพลิเคชัน
CMD ["npm", "start"]