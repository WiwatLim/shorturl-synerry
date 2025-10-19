const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/prisma');

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(403).json({ message: "No token provided" });
    }
    const token = authHeader.split(' ')[1];
    if (!token || token === "null") {
      return res.status(403).json({ message: "No token provided" });
    }
    const decode = jwt.verify(token, process.env.JWT_KEY);
    req.userId = decode.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.userId }
    });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};


router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" });
    }
    
    const getUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });
    
    if (getUser) {
      return res.status(409).json({ message: "Username or Email already exists" });
    }
    
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.users.create({
      data: {
        username,
        email,
        password: hashPassword,
        full_name: full_name || null,
        role: 'user'
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        created_at: true
      }
    });
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: newUser 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    const getUser = await prisma.users.findFirst({
      where: { username: username }
    });
    
    if (!getUser) {
      return res.status(404).json({ message: "Unknown Username" });
    }
    
    if (!getUser.is_active) {
      return res.status(403).json({ message: "Account is inactive" });
    }
    
    const isMatch = await bcrypt.compare(password, getUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password Incorrect" });
    }
    
    // Update last_login
    await prisma.users.update({
      where: { id: getUser.id },
      data: { 
        last_login: new Date(),
        updated_at: new Date()
      }
    });
    
    const token = jwt.sign(
      { userId: getUser.id },
      process.env.JWT_KEY,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      message: "Login Success",
      token: token,
      user: {
        id: getUser.id,
        username: getUser.username,
        email: getUser.email,
        full_name: getUser.full_name,
        role: getUser.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/user-info', verifyToken, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true,
        last_login: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true,
        last_login: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put('/change-role', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    
    if (!userId || !newRole || !['admin', 'user'].includes(newRole)) {
      return res.status(400).json({ message: "Invalid input. Role must be 'admin' or 'user'" });
    }
    
    if (parseInt(userId) === req.userId) {
      return res.status(403).json({ message: "Cannot change your own role" });
    }
    
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(userId) },
      data: { 
        role: newRole,
        updated_at: new Date()
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true
      }
    });
    
    res.status(200).json({ 
      message: "Role updated successfully", 
      user: updatedUser 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put('/toggle-active', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    if (parseInt(userId) === req.userId) {
      return res.status(403).json({ message: "Cannot change your own status" });
    }
    
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(userId) },
      data: { 
        is_active: !user.is_active,
        updated_at: new Date()
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true
      }
    });
    
    res.status(200).json({ 
      message: "User status updated successfully", 
      user: updatedUser 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;
module.exports.verifyAdmin = verifyAdmin;