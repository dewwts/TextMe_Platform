const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // ประเภทข้อความ: 'private' หรือ 'group'
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  senderUsername: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  receiverUsername: {
    type: String
  },

  groupName: {
    type: String
  },

  timestamp: {
    type: Date,
    default: Date.now
  },

  isRead: {
    type: Boolean,
    default: false
  },

  readAt: {
    type: Date
  },

  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ groupName: 1 });
messageSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
