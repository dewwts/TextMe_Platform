require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken');
const { connectDB } = require('./config/db')

// Import Models
const User = require('./models/User');
const Message = require('./models/Message');

// Import Routes
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const users = new Map(); // Map<socket.id, { username, userId }>
const groups = new Map(); // Map<groupName, Set<socket.id>>
app.set("users", users)
// API Routes
app.use('/api/auth', authRoutes);

const server = http.createServer(app);

// ตั้งค่า Socket.IO พร้อม CORS Configuration
const io = new Server(server, {
  cors: {
    origin: "*", // อนุญาตให้ทุก origin เชื่อมต่อได้ (สำหรับ Vercel/Render)
    methods: ["GET", "POST"]
  }
});

// เชื่อมต่อ MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('✅ Connected to MongoDB'))
//   .catch((err) => console.error('❌ MongoDB connection error:', err));
connectDB()

// เก็บข้อมูล Users และ Groups (In-memory for real-time tracking)

// Helper: ดึงรายชื่อ Active Users ทั้งหมด
function getActiveUsers() {
  const uniqueUsers = new Map(); // ใช้ Map เพื่อเก็บ userId ที่ไม่ซ้ำ
  
  users.forEach((userData, socketId) => {
    if (!uniqueUsers.has(userData.userId)) {
      uniqueUsers.set(userData.userId, {
      socketId, // ใช้ socketId ของ connection แรกที่เราเจอ
       username: userData.username,
      userId: userData.userId
    });
    }
  });
  return Array.from(uniqueUsers.values());
}

// Helper: ดึงรายชื่อ Groups พร้อมสมาชิก
function getGroupList() {
  const groupList = [];
  groups.forEach((members, groupName) => {
    const memberNames = Array.from(members).map(socketId => {
      const userData = users.get(socketId);
      return userData ? userData.username : 'Unknown';
    });
    groupList.push({ groupName, members: memberNames, memberCount: members.size });
  });
  return groupList;
}

// Helper: นับจำนวนข้อความที่ยังไม่ได้อ่าน
async function getUnreadCounts(userId,socketID) {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // นับข้อความ Private ที่ยังไม่ได้อ่าน (กลุ่มตาม sender)
    const privateUnread = await Message.aggregate([
      {
        $match: {
          type: 'private',
          receiver: userObjectId,
          isRead: false
        }
      },
      {
        $group: {
          _id: '$sender',
          count: { $sum: 1 },
          senderUsername: { $first: '$senderUsername' }
        }
      }
    ]);

    // นับข้อความ Group ที่ยังไม่ได้อ่าน (กลุ่มตาม groupName)
    // ต้องหาข้อความที่ sender ไม่ใช่ user และ user ยังไม่ได้อยู่ใน readBy array
    const groupUnread = await Message.aggregate([
      {
        $match: {
          type: 'group',
          sender: { $ne: userObjectId },
          readBy: { $nin: [userObjectId] }
        }
      },
      {
        $group: {
          _id: '$groupName',
          count: { $sum: 1 }
        }
      }
    ]);
    const filteredGroupUnread = groupUnread.filter(item =>{
      const groupName = item._id;
      return groups.has(groupName) && groups.get(groupName).has(socketID);
    });
    const result = {
      private: privateUnread.map(item => ({
        userId: item._id.toString(),
        username: item.senderUsername,
        count: item.count
      })),
      group: filteredGroupUnread.map(item => ({
        groupName: item._id,
        count: item.count
      }))
    };

    console.log(`[UNREAD_COUNTS] User ${userId}:`, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('[ERROR] Getting unread counts:', error);
    return { private: [], group: [] };
  }
}

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`[CONNECTION] User connected: ${socket.id}`);

  // Authentication: รับ userId และ username จาก Client
  socket.on('authenticate', async ({ userId, username }) => {
    users.set(socket.id, { username, userId });
    console.log(`[AUTHENTICATE] ${username} (${userId}) authenticated with socket ${socket.id}`);

    // Broadcast รายชื่อ Active Users
    io.emit('update_user_list', getActiveUsers());
    io.emit('update_group_list', getGroupList());
    // สามารถ emit group ทั้งหมดได้ตรงนี้
    // ส่งจำนวนข้อความที่ยังไม่ได้อ่านกลับไป
    const unreadCounts = await getUnreadCounts(userId,socket.id);
    console.log(`[EMIT] Sending unread_counts to ${username}:`, unreadCounts);
    socket.emit('unread_counts', unreadCounts);
  });

  // ดึงประวัติการแชทแบบ Private
  socket.on('load_private_history', async ({ userId, otherUserId }) => {
    try {
      // ดึงข้อความระหว่าง 2 คน (ทั้งที่ส่งและรับ)
      const messages = await Message.find({
        type: 'private',
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId }
        ]
      })
      .sort({ timestamp: 1 })
      .limit(100); // จำกัดแค่ 100 ข้อความล่าสุด

      socket.emit('private_history', {
        otherUserId,
        messages: messages.map(msg => ({
          message: msg.message,
          from: msg.senderUsername,
          fromUserId: msg.sender.toString(),
          toUserId: msg.receiver.toString(),
          timestamp: msg.timestamp,
          type: 'private'
        }))
      });
    } catch (error) {
      console.error('[ERROR] Loading private history:', error);
    }
  });

  // ดึงประวัติการแชทแบบ Group
  socket.on('load_group_history', async ({ groupName }) => {
    try {
      const messages = await Message.find({
        type: 'group',
        groupName
      })
      .sort({ timestamp: 1 })
      .limit(100); // จำกัดแค่ 100 ข้อความล่าสุด

      socket.emit('group_history', {
        groupName,
        messages: messages.map(msg => ({
          message: msg.message,
          from: msg.senderUsername,
          fromUserId: msg.sender.toString(),
          groupName: msg.groupName,
          timestamp: msg.timestamp,
          type: 'group'
        }))
      });
    } catch (error) {
      console.error('[ERROR] Loading group history:', error);
    }
  });

  // Mark Private Messages as Read
  socket.on('mark_private_read', async ({ userId, otherUserId }) => {
    try {
      const fromData = users.get(socket.id);
      if (!fromData) return;

      // อัปเดตข้อความทั้งหมดจาก otherUserId ให้เป็น isRead: true
      await Message.updateMany(
        {
          type: 'private',
          sender: otherUserId,
          receiver: userId,
          isRead: false
        },
        {
          $set: {
            isRead: true,
            readAt: new Date()
          }
        }
      );

      console.log(`[MARK_READ] ${fromData.username} marked messages from ${otherUserId} as read`);

      // ส่ง Unread Counts ที่อัปเดตกลับไป
      const unreadCounts = await getUnreadCounts(userId,socket.id);
      socket.emit('unread_counts', unreadCounts);

      // แจ้งผู้ส่งว่าข้อความถูกอ่านแล้ว (ถ้าออนไลน์)
      const senderSocketId = Array.from(users.entries())
        .find(([sid, data]) => data.userId === otherUserId)?.[0];

      if (senderSocketId) {
        io.to(senderSocketId).emit('messages_read', {
          byUserId: userId,
          byUsername: fromData.username
        });
      }
    } catch (error) {
      console.error('[ERROR] Marking private messages as read:', error);
    }
  });

  // Mark Group Messages as Read
  socket.on('mark_group_read', async ({ userId, groupName }) => {
    try {
      const fromData = users.get(socket.id);
      if (!fromData) return;

      // อัปเดตข้อความทั้งหมดในกลุ่มที่ยังไม่ได้อ่าน
      await Message.updateMany(
        {
          type: 'group',
          groupName,
          sender: { $ne: userId },
          readBy: { $ne: userId }
        },
        {
          $addToSet: { readBy: userId }
        }
      );

      console.log(`[MARK_READ] ${fromData.username} marked messages in ${groupName} as read`);

      // ส่ง Unread Counts ที่อัปเดตกลับไป
      const unreadCounts = await getUnreadCounts(userId,socket.id);
      socket.emit('unread_counts', unreadCounts);
    } catch (error) {
      console.error('[ERROR] Marking group messages as read:', error);
    }
  });

  // (R7) Private Message - ส่งข้อความส่วนตัว
  socket.on('send_private_message', async ({ toSocketId, toUserId, message }) => {
    try {
      const fromData = users.get(socket.id);
      const toData = users.get(toSocketId);

      if (!fromData) {
        console.error('[ERROR] Sender not authenticated');
        return;
      }

      const fromUsername = fromData.username;
      const toUsername = toData ? toData.username : 'Unknown';

      console.log(`[PRIVATE_MESSAGE] ${fromUsername} -> ${toUsername}: ${message}`);

      // บันทึกข้อความลง MongoDB
      const newMessage = new Message({
        type: 'private',
        sender: fromData.userId,
        senderUsername: fromUsername,
        receiver: toUserId,
        receiverUsername: toUsername,
        message
      });

      await newMessage.save();

      // ส่งข้อความไปหาผู้รับ
      io.to(toSocketId).emit('receive_message', {
        message,
        from: fromUsername,
        fromSocketId: socket.id,
        fromUserId: fromData.userId,
        toUserId,
        type: 'private',
        timestamp: newMessage.timestamp
      });

      // ส่งข้อความกลับไปหาผู้ส่ง
      socket.emit('receive_message', {
        message,
        from: 'You',
        fromSocketId: socket.id,
        fromUserId: fromData.userId,
        toSocketId: toSocketId,
        toUserId,
        type: 'private',
        timestamp: newMessage.timestamp
      });

      // อัปเดต Unread Count สำหรับผู้รับ
      if (toData) {
        const unreadCounts = await getUnreadCounts(toUserId,socket.id);
        io.to(toSocketId).emit('unread_counts', unreadCounts);
      }
    } catch (error) {
      console.error('[ERROR] Sending private message:', error);
    }
  });

  // (R8) Create Group - สร้างกลุ่มใหม่
  socket.on('create_group', (groupName) => {
    if (!groups.has(groupName)) {
      groups.set(groupName, new Set());
      console.log(`[CREATE_GROUP] Group created: ${groupName}`);
    }

    // ให้ผู้สร้างเข้าร่วมกลุ่มทันที
    groups.get(groupName).add(socket.id);
    socket.join(groupName);

    const userData = users.get(socket.id);
    console.log(`[JOIN_GROUP] ${userData?.username} joined ${groupName}`);

    // (R9) Broadcast รายชื่อกลุ่มทั้งหมด
    io.emit('update_group_list', getGroupList());
  });

  // (R10) Join Group - เข้าร่วมกลุ่ม
  socket.on('join_group', (groupName) => {
    if (!groups.has(groupName)) {
      groups.set(groupName, new Set());
    }

    groups.get(groupName).add(socket.id);
    socket.join(groupName);

    const userData = users.get(socket.id);
    console.log(`[JOIN_GROUP] ${userData?.username} joined ${groupName}`);

    // (R9) Broadcast รายชื่อกลุ่มที่อัปเดต
    io.emit('update_group_list', getGroupList());

    // แจ้ง Client ว่า Join สำเร็จ
    socket.emit('joined_group', { groupName });
  });

  // Typing indicator - practical approach with start/stop
  socket.on('typing_start', ({ targetId, chatType }) => {
    const fromData = users.get(socket.id);
    if (!fromData) return;

    if (chatType === 'private') {
      // Find the target user's socket
      const targetSocketId = Array.from(users.entries())
        .find(([sid, data]) => data.userId === targetId)?.[0];

      if (targetSocketId) {
        io.to(targetSocketId).emit('show_typing_bubble', {
          fromUsername: fromData.username,
          fromUserId: fromData.userId
        });
      }
    } else if (chatType === 'group') {
      // Broadcast to all members in the group except sender
      socket.to(targetId).emit('show_typing_bubble', {
        fromUsername: fromData.username,
        fromUserId: fromData.userId
      });
    }
  });

  socket.on('typing_stop', ({ targetId, chatType }) => {
    const fromData = users.get(socket.id);
    if (!fromData) return;

    if (chatType === 'private') {
      // Find the target user's socket
      const targetSocketId = Array.from(users.entries())
        .find(([sid, data]) => data.userId === targetId)?.[0];

      if (targetSocketId) {
        io.to(targetSocketId).emit('hide_typing_bubble', {
          fromUsername: fromData.username,
          fromUserId: fromData.userId
        });
      }
    } else if (chatType === 'group') {
      // Broadcast to all members in the group except sender
      socket.to(targetId).emit('hide_typing_bubble', {
        fromUsername: fromData.username,
        fromUserId: fromData.userId
      });
    }
  });

  // (R11) Group Message - ส่งข้อความในกลุ่ม
  socket.on('send_group_message', async ({ groupName, message }) => {
    try {
      const fromData = users.get(socket.id);

      if (!fromData) {
        console.error('[ERROR] Sender not authenticated');
        return;
      }

      const fromUsername = fromData.username;

      console.log(`[GROUP_MESSAGE] ${fromUsername} in ${groupName}: ${message}`);

      // บันทึกข้อความลง MongoDB
      const newMessage = new Message({
        type: 'group',
        sender: fromData.userId,
        senderUsername: fromUsername,
        groupName,
        message
      });

      await newMessage.save();

      // ส่งข้อความไปยังทุกคนในกลุ่ม (รวมผู้ส่ง)
      io.to(groupName).emit('receive_message', {
        message,
        from: fromUsername,
        fromSocketId: socket.id,
        fromUserId: fromData.userId,
        groupName: groupName,
        type: 'group',
        timestamp: newMessage.timestamp
      });

      // อัปเดต Unread Count สำหรับสมาชิกในกลุ่ม (ยกเว้นผู้ส่ง)
      const groupMembers = groups.get(groupName);
      if (groupMembers) {
        for (const memberSocketId of groupMembers) {
          const memberData = users.get(memberSocketId);
          if (memberData && memberData.userId !== fromData.userId) {
            const unreadCounts = await getUnreadCounts(memberData.userId, socket.id);
            io.to(memberSocketId).emit('unread_counts', unreadCounts);
          }
        }
      }
    } catch (error) {
      console.error('[ERROR] Sending group message:', error);
    }
  });

  // Disconnect Handler
  socket.on('disconnect', () => {
    const userData = users.get(socket.id);
    console.log(`[DISCONNECT] User disconnected: ${socket.id} (${userData?.username})`);

    // ลบ User ออกจาก Map
    users.delete(socket.id);

    // ลบ User ออกจากกลุ่มทั้งหมด
    groups.forEach((members, groupName) => {
      members.delete(socket.id);
    });

    // (R4) Broadcast รายชื่อ Active Users ที่อัปเดต
    io.emit('update_user_list', getActiveUsers());

    // (R9) Broadcast รายชื่อกลุ่มที่อัปเดต
    io.emit('update_group_list', getGroupList());
  });
});

// Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Chat Server is running',
    activeUsers: users.size,
    groups: groups.size,
    mongoDBConnected: mongoose.connection.readyState === 1
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
