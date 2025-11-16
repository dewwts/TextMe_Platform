const express = require('express');
const { CreateUser, SignInUser, verifyToken } = require('../controllers/UserController')

const router = express.Router();

// Register - สมัครสมาชิก
router.post('/register', CreateUser);

// Login - เข้าสู่ระบบ
router.post('/login', SignInUser);

// Verify Token - ตรวจสอบ Token
router.get('/verify', verifyToken);

module.exports = router;
