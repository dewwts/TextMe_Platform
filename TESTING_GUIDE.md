# Testing Guide - Unread Messages Feature

## วิธีทดสอบฟีเจอร์ Unread Messages

### ขั้นตอนการทดสอบ

#### 1. เตรียมการ
```bash
# Terminal 1: Start Server
cd server
npm start

# Terminal 2: Start Client
cd client
npm run dev
```

#### 2. ทดสอบ Private Chat Unread

1. **เปิด Browser 2 หน้าต่าง**:
   - Browser 1: เข้าสู่ระบบเป็น User A
   - Browser 2: เข้าสู่ระบบเป็น User B

2. **ส่งข้อความจาก User A ไปหา User B**:
   - ใน Browser 1: คลิกชื่อ User B และส่งข้อความ
   - **Expected**: ใน Browser 2 ควรเห็น:
     - Badge สีแดงข้างชื่อ User A พร้อมจำนวน (1)
     - มีเสียง notification
     - มี Browser notification (ถ้าอนุญาต)

3. **เปิดแชทใน User B**:
   - คลิกชื่อ User A เพื่อเปิดแชท
   - **Expected**: Badge ควรหายทันที

4. **ตรวจสอบ Console Logs**:
   - **Server Console** ควรเห็น:
     ```
     [UNREAD_COUNTS] User <userId>: {"private":[...],"group":[]}
     [EMIT] Sending unread_counts to <username>: ...
     [MARK_READ] <username> marked messages from <otherUserId> as read
     ```

   - **Client Console (Browser)** ควรเห็น:
     ```
     [CLIENT] Received unread_counts: {private: Array(1), group: Array(0)}
     [BADGE] User: <username> Unread: 1
     ```

#### 3. ทดสอบ Group Chat Unread

1. **สร้างกลุ่ม**:
   - ใน Browser 1 (User A): สร้างกลุ่ม "TestGroup"

2. **User B เข้าร่วมกลุ่ม**:
   - ใน Browser 2: คลิกที่กลุ่ม "TestGroup" เพื่อ Join

3. **User A ส่งข้อความในกลุ่ม**:
   - ใน Browser 1: ส่งข้อความในกลุ่ม
   - **Expected**: ใน Browser 2 ควรเห็น:
     - Badge สีแดงข้างชื่อกลุ่ม "TestGroup"
     - มีเสียง notification (ถ้าไม่ได้เปิดหน้าต่างแชทกลุ่มอยู่)

4. **User B เปิดแชทกลุ่ม**:
   - คลิกที่กลุ่ม "TestGroup"
   - **Expected**: Badge ควรหายทันที

### ตรวจสอบข้อมูลใน MongoDB

```javascript
// เข้า MongoDB Compass หรือ MongoDB Shell

// ดูข้อความทั้งหมด
db.messages.find()

// ดูข้อความที่ยังไม่ได้อ่าน (Private)
db.messages.find({
  type: 'private',
  isRead: false
})

// ดูข้อความที่ยังไม่ได้อ่าน (Group)
db.messages.find({
  type: 'group',
  readBy: { $size: 0 }
})
```

### Debugging Checklist

- [ ] Server รันได้ไม่มี Error
- [ ] Client รันได้ไม่มี Error
- [ ] MongoDB เชื่อมต่อสำเร็จ (เห็น ✅ Connected to MongoDB)
- [ ] authenticate Event ทำงาน (เห็น log [AUTHENTICATE])
- [ ] unread_counts Event ถูกส่ง (เห็น log [EMIT])
- [ ] Client รับ unread_counts (เห็น log [CLIENT] Received)
- [ ] Badge แสดงผลใน UI
- [ ] คลิกเปิดแชทแล้ว Badge หาย
- [ ] ข้อความถูกบันทึกลง MongoDB
- [ ] isRead และ readBy ถูก update

### Common Issues

#### Badge ไม่แสดง
1. ตรวจสอบ Console Browser: มี log `[CLIENT] Received unread_counts` หรือไม่?
2. ตรวจสอบ Console Server: มี log `[EMIT] Sending unread_counts` หรือไม่?
3. ตรวจสอบว่า userId ใน unreadCounts.private match กับ otherUser.userId หรือไม่

#### Badge ไม่หาย
1. ตรวจสอบว่า mark_private_read/mark_group_read Event ถูกเรียกหรือไม่
2. ตรวจสอบใน MongoDB ว่า isRead/readBy ถูก update หรือไม่

#### Notification ไม่ทำงาน
1. ตรวจสอบว่า Browser ให้สิทธิ์ Notification หรือไม่
2. ตรวจสอบว่า activeChat state ถูกต้องหรือไม่
