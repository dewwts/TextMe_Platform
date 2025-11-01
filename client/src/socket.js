import { io } from 'socket.io-client';

// ดึง Server URL จาก Environment Variable
// ถ้าไม่มี ให้ใช้ localhost สำหรับ Development
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3003';

// สร้าง Socket Connection
const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Log Connection Events
socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

export default socket;
