# Unread Messages Feature - Summary

## 🎯 Overview
ระบบนับและแสดงจำนวนข้อความที่ยังไม่ได้อ่าน (Unread Messages) สำหรับทั้ง Private Chat และ Group Chat

## 🔧 Changes Made

### Backend Changes

#### 1. Message Model (`server/models/Message.js`)
เพิ่ม fields:
- `isRead` (Boolean) - สถานะการอ่านสำหรับ Private Chat
- `readAt` (Date) - เวลาที่อ่าน
- `readBy` (Array of ObjectId) - รายชื่อผู้ที่อ่านแล้วสำหรับ Group Chat

#### 2. Server Logic (`server/index.js`)

**Helper Function:**
```javascript
getUnreadCounts(userId)
```
- นับข้อความ Private ที่ยังไม่ได้อ่าน (isRead: false)
- นับข้อความ Group ที่ user ยังไม่ได้อยู่ใน readBy array
- Return: `{ private: [...], group: [...] }`

**Socket Events:**

1. **`authenticate`** (existing, modified)
   - เพิ่ม: ส่ง `unread_counts` event กลับไปหา client

2. **`mark_private_read`** (new)
   - Input: `{ userId, otherUserId }`
   - Update ข้อความทั้งหมดจาก otherUserId ให้เป็น `isRead: true`
   - ส่ง updated `unread_counts` กลับ

3. **`mark_group_read`** (new)
   - Input: `{ userId, groupName }`
   - Add userId เข้า `readBy` array
   - ส่ง updated `unread_counts` กลับ

4. **`send_private_message`** (modified)
   - เพิ่ม: อัปเดต unread count ของผู้รับ

5. **`send_group_message`** (modified)
   - เพิ่ม: อัปเดต unread count ของสมาชิกในกลุ่ม (ยกเว้นผู้ส่ง)

### Frontend Changes

#### 1. Sidebar Component (`client/src/components/Sidebar.jsx`)

**State:**
```javascript
const [unreadCounts, setUnreadCounts] = useState({ private: [], group: [] });
```

**Socket Listener:**
- รับ `unread_counts` event จาก server
- อัปเดต state

**UI:**
- แสดง Badge สีแดงข้าง username (Private)
- แสดง Badge สีแดงข้าง group name (Group)
- แสดงจำนวนข้อความที่ยังไม่ได้อ่าน (หรือ "99+" ถ้ามากกว่า 99)

#### 2. ChatWindow Component (`client/src/components/ChatWindow.jsx`)

**Auto Mark as Read:**
- เมื่อเปิดหน้าต่างแชท → emit `mark_private_read` หรือ `mark_group_read`
- เมื่อรับข้อความใหม่ขณะเปิดหน้าต่างอยู่ → emit mark read event ทันที

#### 3. App Component (`client/src/App.jsx`)

**Notification System:**
- รับ `receive_message` event
- ตรวจสอบว่าข้อความมาหาเราหรือไม่ และเราไม่ได้เปิดหน้าต่างแชทนั้นอยู่
- เล่นเสียง notification
- แสดง Browser notification (ถ้าได้รับอนุญาต)

## 📊 Data Flow

### Unread Count Flow

```
1. User A ส่งข้อความไปหา User B
   └─> Server: บันทึกข้อความ (isRead: false)
   └─> Server: emit unread_counts ไปหา User B
   └─> Client B: รับ unread_counts
   └─> Client B: แสดง Badge (1)

2. User B เปิดแชทกับ User A
   └─> Client B: emit mark_private_read
   └─> Server: update messages (isRead: true)
   └─> Server: emit unread_counts ไปหา User B (updated)
   └─> Client B: Badge หาย
```

### Group Unread Flow

```
1. User A ส่งข้อความในกลุ่ม
   └─> Server: บันทึกข้อความ (readBy: [])
   └─> Server: emit unread_counts ไปหาสมาชิกทุกคน (ยกเว้น User A)
   └─> Client (สมาชิก): แสดง Badge

2. User B เปิดแชทกลุ่ม
   └─> Client B: emit mark_group_read
   └─> Server: update message (readBy: [User B])
   └─> Server: emit unread_counts ไปหา User B
   └─> Client B: Badge หาย
```

## 🔍 Debug Logs

### Server Logs
```
[UNREAD_COUNTS] User <userId>: {"private":[...],"group":[...]}
[EMIT] Sending unread_counts to <username>: ...
[MARK_READ] <username> marked messages from <otherUserId> as read
```

### Client Logs
```
[CLIENT] Received unread_counts: {private: Array(1), group: Array(0)}
[BADGE] User: <username> Unread: 1
```

## ✅ Testing

ดูรายละเอียดใน `TESTING_GUIDE.md`

## 🚀 Next Steps

ถ้า Badge ยังไม่แสดง:

1. เปิด Browser Console และ Server Console
2. ตรวจสอบ logs ตาม Debug Logs ด้านบน
3. ตรวจสอบว่า:
   - `unread_counts` event ถูกส่งจาก server หรือไม่
   - Client รับ event ได้หรือไม่
   - `userId` ใน unreadCounts match กับ `otherUser.userId` หรือไม่

## 📝 Known Issues & Solutions

### Issue: Badge ไม่แสดง
**Solution:**
- ตรวจสอบว่า userId type ตรงกันทั้ง server และ client
- ตรวจสอบว่า Socket event listener ทำงานถูกต้อง
- ลอง hard refresh browser (Ctrl+Shift+R)

### Issue: Badge ไม่หาย
**Solution:**
- ตรวจสอบว่า mark_read event ถูก emit
- ตรวจสอบใน MongoDB ว่า isRead/readBy ถูก update
- ตรวจสอบว่า unread_counts event ถูกส่งกลับมา

### Issue: Notification ไม่มีเสียง
**Solution:**
- ตรวจสอบว่า browser ไม่ได้ mute
- ลอง click ที่หน้าเว็บก่อน (บาง browser ต้อง user interaction ก่อนจะเล่นเสียงได้)
