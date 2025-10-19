# 🔗 ShortURL System - Synerry Developer Test

ระบบย่อ URL พร้อมระบบจัดการและวิเคราะห์สถิติ

---

## 🛠 เทคโนโลยีที่ใช้

**Backend:** Node.js + Express + Prisma + MySQL (Aiven)  
**Frontend:** React + Vite + Tailwind CSS  
**Deploy:** Render (Backend) + Vercel (Frontend)

---

## ✨ ฟีเจอร์หลัก

✅ สร้าง Short URL + Custom Alias  
✅ สร้าง QR Code อัตโนมัติ  
✅ ติดตาม Analytics (คลิก, อุปกรณ์, IP)  
✅ Dashboard สรุปสถิติ  
✅ จัดการ URLs (แก้ไข, ลบ, เปิด/ปิด)  
✅ Authentication (Register/Login)

---

## 🚀 การติดตั้งและใช้งาน

### 📥 1. Clone Repository

```bash
git clone https://github.com/WiwatLim/shorturl-synerry.git
cd shorturl-synerry
```

---

### 🔧 2. Backend Setup

```bash
# เข้าไปยัง backend directory
cd backend

# ติดตั้ง dependencies
npm install

# สร้างไฟล์ .env
nano .env
```

**ใส่ค่าใน `.env`:**
```env
DATABASE_URL="mysql://avnadmin:PASSWORD@host:port/defaultdb?ssl-mode=REQUIRED"
JWT_KEY="your-secret-key-at-least-32-characters-long"
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

```bash
# Generate Prisma และ Run Migrations
npx prisma generate
npx prisma migrate deploy

# เริ่มต้น server
npm start
```

✅ Backend รันที่: `http://localhost:3000`

---

### 🎨 3. Frontend Setup

**เปิด Terminal ใหม่:**

```bash
# เข้าไปยัง frontend directory
cd frontend/shorturl

# ติดตั้ง dependencies
npm install

# สร้างไฟล์ .env.local
nano .env.local
```

**ใส่ค่าใน `.env.local`:**
```env
VITE_API_URL=http://localhost:3000
```

```bash
# เริ่มต้น development server
npm run dev
```

✅ Frontend รันที่: `http://localhost:5173`

---

## 🌐 Demo URLs (Production)

| Service | URL |
|---------|-----|
| **Frontend** | https://shorturl-synerry.vercel.app |
| **Backend API** | https://shorturl-backend.onrender.com |

**Test Account:**
```
Username: testuser
Password: test123456
```

---

## 📚 ตัวอย่างการใช้งาน API

### 1. Register
```bash
curl -X POST http://localhost:3000/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 3. สร้าง Short URL
```bash
curl -X POST http://localhost:3000/url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "original_url": "https://www.synerry.com",
    "custom_alias": "synerry",
    "title": "Synerry Website"
  }'
```

### 4. Redirect (ไม่ต้องใช้ Token)
```
GET http://localhost:3000/r/synerry
→ Redirect ไปยัง https://www.synerry.com
```

---

## 📊 Database Schema

```
users (id, username, email, password, role)
  ↓ 1:N
urls (id, user_id, original_url, short_code, title, is_active)
  ↓ 1:1
url_analytics (url_id, total_clicks, unique_clicks)
  ↓ 1:N
url_clicks (url_id, ip_address, device_type, clicked_at)
```

---

## 🐛 Troubleshooting

**Backend ไม่ทำงาน:**
```bash
# ตรวจสอบ DATABASE_URL
# ลอง run migrations ใหม่
npx prisma migrate deploy
```

**Frontend เรียก API ไม่ได้:**
```bash
# ตรวจสอบ VITE_API_URL ใน .env.local
# ตรวจสอบว่า Backend รันอยู่
```

---

## 📞 Contact

**Repository:** https://github.com/WiwatLim/shorturl-synerry  
**Developer:** Wiwat Lim

---

**Developed for Synerry Corporation Developer Test - January 2025**
