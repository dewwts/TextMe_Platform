const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // ประเภทข้อความ: 'private' หรือ 'group'
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },

  // ผู้ส่ง (User ID)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ชื่อผู้ส่ง (เก็บไว้เพื่อความเร็วในการดึงข้อมูล)
  senderUsername: {
    type: String,
    required: true
  },

  // ข้อความ
  message: {
    type: String,
    required: true
  },

  // สำหรับ Private Chat: ผู้รับ
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // ชื่อผู้รับ
  receiverUsername: {
    type: String
  },

  // สำหรับ Group Chat: ชื่อกลุ่ม
  groupName: {
    type: String
  },

  // เวลาที่ส่ง
  timestamp: {
    type: Date,
    default: Date.now
  },

  // สถานะการอ่าน (สำหรับ Private Chat)
  isRead: {
    type: Boolean,
    default: false
  },

  // เวลาที่อ่าน
  readAt: {
    type: Date
  },

  // สำหรับ Group Chat: รายชื่อคนที่อ่านแล้ว
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Index สำหรับการค้นหาที่เร็วขึ้น
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ groupName: 1 });
messageSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
