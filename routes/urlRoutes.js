const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../prisma/prisma');
const { verifyToken } = require('./userRoutes');
const jwt = require('jsonwebtoken');

// Generate short code
function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET all URLs (with optional user filter)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.query;
    
    // ถ้าไม่มี user_id ใน query ให้ดึงของ user ที่ login
    const whereClause = user_id 
      ? { user_id: parseInt(user_id) } 
      : { user_id: req.userId };
    
    const urls = await prisma.urls.findMany({
      where: whereClause,
      include: {
        url_analytics: true,
        users: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    res.status(200).json({ urls });
  } catch (error) {
    console.error('Error fetching URLs:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET URL by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const url = await prisma.urls.findUnique({
      where: { id: parseInt(id) },
      include: {
        url_analytics: true,
        users: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }
    
    res.status(200).json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET URL by short code (public - for redirect)
router.get('/s/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const url = await prisma.urls.findUnique({
      where: { short_code: shortCode },
      include: {
        url_analytics: true
      }
    });
    
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }
    
    if (!url.is_active) {
      return res.status(410).json({ message: 'URL is inactive' });
    }
    
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).json({ message: 'URL has expired' });
    }
    
    res.status(200).json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE short URL - รองรับทั้ง logged-in และ anonymous
router.post('/', async (req, res) => {
  try {
    const { original_url, custom_alias, title, expires_at } = req.body;
    
    if (!original_url) {
      return res.status(400).json({ message: 'Original URL is required' });
    }
    
    // Validate URL format
    try {
      new URL(original_url);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }
    
    let short_code = custom_alias || generateShortCode();
    
    // Check if short_code already exists
    const existing = await prisma.urls.findUnique({
      where: { short_code }
    });
    
    if (existing) {
      if (custom_alias) {
        return res.status(400).json({ message: 'Custom alias already exists' });
      }
      short_code = generateShortCode(8);
    }
    
    // ตรวจสอบว่ามี token หรือไม่ (logged in or not)
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decode = jwt.verify(token, process.env.JWT_KEY);
        userId = decode.userId;
      } catch (err) {
        // ถ้า token ไม่ valid ก็ให้เป็น anonymous
        userId = null;
      }
    }
    
    // Create URL
    const url = await prisma.urls.create({
      data: {
        user_id: userId,  // อาจเป็น null ถ้าไม่ได้ login
        original_url,
        short_code,
        custom_alias,
        title,
        expires_at: expires_at ? new Date(expires_at) : null
      }
    });
    
    // Create analytics record
    await prisma.url_analytics.create({
      data: {
        url_id: url.id
      }
    });
    
    // Fetch created URL with relations
    const createdUrl = await prisma.urls.findUnique({
      where: { id: url.id },
      include: {
        url_analytics: true
      }
    });
    
    res.status(201).json({ 
      message: 'URL created successfully',
      url: createdUrl 
    });
  } catch (error) {
    console.error('Error creating URL:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// UPDATE URL
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { original_url, title, is_active, expires_at } = req.body;
    
    // Check if URL exists and belongs to user
    const existingUrl = await prisma.urls.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingUrl) {
      return res.status(404).json({ message: 'URL not found' });
    }
    
    if (existingUrl.user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this URL' });
    }
    
    const url = await prisma.urls.update({
      where: { id: parseInt(id) },
      data: {
        original_url,
        title,
        is_active,
        expires_at: expires_at ? new Date(expires_at) : null,
        updated_at: new Date()
      },
      include: {
        url_analytics: true
      }
    });
    
    res.status(200).json({ 
      message: 'URL updated successfully',
      url 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE URL
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if URL exists and belongs to user
    const existingUrl = await prisma.urls.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingUrl) {
      return res.status(404).json({ message: 'URL not found' });
    }
    
    if (existingUrl.user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this URL' });
    }
    
    await prisma.urls.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// REDIRECT - Track click and redirect (public route)
router.get('/r/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers['referer'] || req.headers['referrer'];
    
    const url = await prisma.urls.findUnique({
      where: { short_code: shortCode }
    });
    
    if (!url || !url.is_active) {
      return res.status(404).json({ message: 'URL not found' });
    }
    
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).json({ message: 'URL has expired' });
    }
    
    // Detect device type
    let device_type = 'other';
    if (userAgent) {
      if (/mobile/i.test(userAgent)) device_type = 'mobile';
      else if (/tablet/i.test(userAgent)) device_type = 'tablet';
      else if (/desktop|windows|mac|linux/i.test(userAgent)) device_type = 'desktop';
    }
    
    // Track click
    await prisma.url_clicks.create({
      data: {
        url_id: url.id,
        ip_address: ip,
        user_agent: userAgent,
        referer: referer,
        device_type: device_type
      }
    });
    
    // Update analytics
    await prisma.url_analytics.update({
      where: { url_id: url.id },
      data: {
        total_clicks: { increment: 1 },
        last_clicked_at: new Date()
      }
    });
    
    res.redirect(url.original_url);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;