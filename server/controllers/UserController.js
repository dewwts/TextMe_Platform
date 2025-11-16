const jwt = require("jsonwebtoken")
const User = require("../models/User")

const CreateUser = async(req,res)=>{
try {
    const { username, email, password } = req.body;

    // ตรวจสอบว่ามี username หรือ email ซ้ำหรือไม่
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === username
          ? 'Username already exists'
          : 'Email already exists'
      });
    }

    // สร้าง User ใหม่
    const user = new User({
      username,
      email,
      password // จะถูก hash โดย pre-save hook
    });

    await user.save();

    // สร้าง JWT Token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }  
}

const SignInUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    // const users = req.app.get("users")
    // ค้นหา User
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    // let check = true
    // for (const [socket, userInfo] of users){
    //   if (userInfo.username == username){
    //     check = false
    //     break
    //   }      
    // }
    // if (!check){
    //   res.json({
    //     success: false,
    //     message: 'Login failed',
    //     user: {
    //     }
    //   });
    // }
    // สร้าง JWT Token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}
module.exports = {
  CreateUser,
  SignInUser,
  verifyToken,
};