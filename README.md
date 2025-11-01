# Simple Chat Application with MongoDB Authentication

โปรเจกต์แชทแบบ Real-time ที่สร้างด้วย Socket.IO, React, Node.js และ MongoDB

## 🚀 Features

### Core Features
- ✅ **R1-R2**: Server-Client Architecture ด้วย Socket.IO
- ✅ **R3**: ระบบ Authentication (Sign in/Sign up) ด้วย JWT
- ✅ **R4**: แสดงรายชื่อ Active Users แบบ Real-time
- ✅ **R5**: เลือกผู้ใช้หรือกลุ่มเพื่อเปิดหน้าต่างแชท
- ✅ **R6**: Chat Window + Chat Box สำหรับส่งข้อความ
- ✅ **R7**: Private Messaging (1-on-1)
- ✅ **R8**: สร้างกลุ่มแชท (Create Group)
- ✅ **R9**: แสดงรายชื่อกลุ่มทั้งหมด
- ✅ **R10**: เข้าร่วมกลุ่ม (Join Group)
- ✅ **R11**: ส่งข้อความในกลุ่ม (Group Chat)

### Bonus Features
- 🔐 **Authentication**: Sign up/Login ด้วย JWT และ bcrypt
- 💾 **MongoDB**: บันทึกประวัติการแชทและข้อมูลผู้ใช้
- 📜 **Chat History**: โหลดประวัติการแชทแบบ Private และ Group
- 🎨 **Beautiful UI**: UI/UX ที่สวยงามด้วย Tailwind CSS
- 🟢 **Active Status**: แสดงสถานะออนไลน์แบบ Real-time
- ⏰ **Timestamps**: แสดงเวลาที่ส่งข้อความ
- 🔄 **Auto-reconnect**: เชื่อมต่อ Socket อัตโนมัติเมื่อหลุด

## 📁 Project Structure

```
chat-project/
├── server/
│   ├── package.json
│   ├── .env                    # MongoDB URI และ JWT Secret
│   ├── index.js                # Main Server File
│   ├── models/
│   │   ├── User.js            # User Schema
│   │   └── Message.js         # Message Schema
│   └── routes/
│       └── auth.js            # Authentication Routes
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx             # Main Application
        ├── index.css           # Tailwind CSS
        ├── socket.js           # Socket Connection
        ├── api/
        │   └── auth.js        # API Functions
        └── components/
            ├── Login.jsx       # Login Form
            ├── Register.jsx    # Register Form
            ├── Sidebar.jsx     # User List + Group List
            └── ChatWindow.jsx  # Chat Interface
```

## 🛠️ Tech Stack

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB (Mongoose)
- JWT (Authentication)
- bcryptjs (Password Hashing)

### Frontend
- React (Vite)
- Socket.IO Client
- Tailwind CSS
- Axios

## 📦 Installation

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd chat-project
```

### 2. ติดตั้ง Server Dependencies

```bash
cd server
npm install
```

### 3. ติดตั้ง Client Dependencies

```bash
cd ../client
npm install
```

### 4. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `server/`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/chat-app?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
```

**⚠️ หมายเหตุ**: แทนที่ `<username>` และ `<password>` ด้วยข้อมูล MongoDB ของคุณ

## 🚀 Running Locally

### 1. รัน Server (Terminal 1)

```bash
cd server
npm start
```

Server จะรันที่ `http://localhost:3001`

### 2. รัน Client (Terminal 2)

```bash
cd client
npm run dev
```

Client จะรันที่ `http://localhost:3000`

### 3. เปิดเบราว์เซอร์

เปิดไปที่ `http://localhost:3000`

1. **สมัครสมาชิก**: คลิก "Sign up" แล้วกรอกข้อมูล
2. **เข้าสู่ระบบ**: ใช้ username และ password ที่สมัครไว้
3. **เริ่มแชท**: เลือก User หรือ Group เพื่อเริ่มแชท

## 🌐 Deployment

### Deploy Backend to Render

1. สร้าง Web Service ใหม่บน [Render](https://render.com)
2. เชื่อมต่อกับ GitHub Repository ของคุณ
3. ตั้งค่า Build Command: `cd server && npm install`
4. ตั้งค่า Start Command: `cd server && npm start`
5. เพิ่ม Environment Variable:
   - `NODE_ENV=production`
6. Deploy!

คัดลอก URL ของ Backend (เช่น `https://your-app.onrender.com`)

### Deploy Frontend to Vercel

1. สร้างไฟล์ `.env` ในโฟลเดอร์ `client/`:
   ```
   VITE_SERVER_URL=https://your-app.onrender.com
   ```

2. Deploy ไปยัง [Vercel](https://vercel.com):
   ```bash
   cd client
   vercel
   ```

3. ตั้งค่า Environment Variables ใน Vercel Dashboard:
   - `VITE_SERVER_URL=https://your-app.onrender.com`

4. ตั้งค่า Root Directory เป็น `client`

## 💡 How to Use

### 1. Authentication
- **Sign Up**: สมัครสมาชิกด้วย username, email และ password
- **Login**: เข้าสู่ระบบด้วย username และ password
- **Auto Login**: ระบบจะจำ session อัตโนมัติ (ใช้ JWT Token)

### 2. Chat Features
- **Private Chat**: คลิกที่ชื่อผู้ใช้ใน "Active Users" เพื่อแชท 1-on-1
- **Group Chat**:
  - คลิก "+ Create" เพื่อสร้างกลุ่มใหม่
  - คลิกที่ชื่อกลุ่มเพื่อเข้าร่วมและแชท
- **Chat History**: ข้อความทั้งหมดถูกบันทึกใน MongoDB และจะโหลดอัตโนมัติเมื่อเปิดแชท
- **Logout**: คลิกปุ่ม "Logout" เพื่อออกจากระบบ

## 🎯 Requirements Checklist

- [x] **R1**: Client-Server Programming ด้วย Socket
- [x] **R2**: ใช้ Socket.IO Library
- [x] **R3**: ตั้งชื่อผู้ใช้
- [x] **R4**: แสดง Active Users
- [x] **R5**: เปิดหน้าต่างแชท (Open Chat Window)
- [x] **R6**: Chat Window + Chat Box
- [x] **R7**: Private Messaging
- [x] **R8**: Create Group
- [x] **R9**: แสดง Group List
- [x] **R10**: Join Group
- [x] **R11**: Group Chat

## 🎨 UI Features

- ✨ Modern และ Responsive Design
- 🎨 Tailwind CSS Styling
- 📱 Mobile-Friendly
- 🔔 Real-time Updates
- 🟢 Active Status Indicators
- 💬 Message Bubbles (แยกสีระหว่างผู้ส่งและผู้รับ)

## 📊 Database Schema

### User Schema
```javascript
{
  username: String (unique, 3-20 chars),
  email: String (unique),
  password: String (hashed with bcrypt),
  createdAt: Date
}
```

### Message Schema
```javascript
{
  type: 'private' | 'group',
  sender: ObjectId (ref: User),
  senderUsername: String,
  receiver: ObjectId (ref: User), // for private messages
  receiverUsername: String,
  groupName: String, // for group messages
  message: String,
  timestamp: Date
}
```

## 📝 Notes

- ข้อความจะถูกบันทึกใน MongoDB และสามารถโหลดกลับมาดูได้
- แต่ละแชทจะโหลดประวัติล่าสุด 100 ข้อความ
- JWT Token หมดอายุใน 7 วัน
- Password ต้องมีอย่างน้อย 6 ตัวอักษร
- Username ต้องมี 3-20 ตัวอักษร

## 🔧 Troubleshooting

### ปัญหา: MongoDB Connection Error

**แก้ไข**:
- ตรวจสอบ `MONGODB_URI` ใน `.env`
- ตรวจสอบว่า IP Address ได้รับอนุญาตใน MongoDB Atlas
- ตรวจสอบว่า username/password ถูกต้อง

### ปัญหา: Client เชื่อมต่อ Server ไม่ได้

**แก้ไข**:
- ตรวจสอบว่า Server กำลังรันอยู่
- ตรวจสอบ `VITE_SERVER_URL` ใน `.env` (Client)
- ตรวจสอบ CORS settings

### ปัญหา: ไม่สามารถ Login/Register ได้

**แก้ไข**:
- ตรวจสอบ Console logs ใน Browser Developer Tools
- ตรวจสอบ Server logs
- ลองล้าง localStorage และลองใหม่

## 📄 License

MIT License

## 👨‍💻 Author

Created for Socket Programming Project

---

**Happy Chatting! 💬**
