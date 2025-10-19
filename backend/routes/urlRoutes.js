const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../prisma/prisma');
const { verifyToken } = require('./userRoutes');

// Generate short code
function generateShortCode(length = 6) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, length);
}

// GET all URLs (with optional user filter)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.query;
    
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
    console.error(error);
    res.status(500).json({ message: "Server error" });
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

// ที่บรรทัด CREATE short URL - ลบ verifyToken ออก
router.post('/', async (req, res) => {  // ← ลบ verifyToken ออก
  try {
    const { original_url, custom_alias, title, expires_at } = req.body;
    
    if (!original_url) {
      return res.status(400).json({ message: 'Original URL is required' });
    }
    
    try {
      new URL(original_url);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }
    
    let short_code = custom_alias || generateShortCode();
    
    const existing = await prisma.urls.findUnique({
      where: { short_code }
    });
    
    if (existing) {
      if (custom_alias) {
        return res.status(400).json({ message: 'Custom alias already exists' });
      }
      short_code = generateShortCode(8);
    }
    
    const url = await prisma.urls.create({
      data: {
        user_id: null,  // ← ไม่ต้องมี user_id
        original_url,
        short_code,
        custom_alias,
        title,
        expires_at: expires_at ? new Date(expires_at) : null
      }
    });
    
    await prisma.url_analytics.create({
      data: {
        url_id: url.id
      }
    });
    
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
    console.error(error);
    res.status(500).json({ message: "Server error" });
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