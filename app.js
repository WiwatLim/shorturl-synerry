require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./prisma/prisma'); // ✅ Import prisma
const userRouter = require('./routes/userRoutes');
const urlRouter = require('./routes/urlRoutes');
const analyticsRouter = require('./routes/analyticsRoutes');

const app = express();
const port = process.env.PORT || 3000;

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-app.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check - สำคัญมากสำหรับ Render!
app.get('/', (req, res) => {
  res.json({ 
    message: 'URL Shortener API is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ⭐ Redirect endpoint - ย้ายมาไว้ก่อน routes อื่นๆ
app.get("/r/:shortCode", async (req, res) => {
  const { shortCode } = req.params;

  try {
    // ❌ ลบบรรทัดนี้ออก - const { PrismaClient } = require('@prisma/client');
    // ❌ ลบบรรทัดนี้ออก - const prisma = new PrismaClient();
    
    // ✅ ใช้ prisma ที่ import มาด้านบนแทน
    const url = await prisma.urls.findUnique({
      where: { short_code: shortCode },
    });

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    if (!url.is_active) {
      return res.status(410).json({ message: "URL is inactive" });
    }

    // Check expiration
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).json({ message: 'URL has expired' });
    }

    // Track click
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    let device_type = 'other';
    if (userAgent) {
      if (/mobile/i.test(userAgent)) device_type = 'mobile';
      else if (/tablet/i.test(userAgent)) device_type = 'tablet';
      else if (/desktop|windows|mac|linux/i.test(userAgent)) device_type = 'desktop';
    }

    // Create click record
    await prisma.url_clicks.create({
      data: {
        url_id: url.id,
        ip_address: ip,
        user_agent: userAgent,
        device_type: device_type
      }
    });

    // Update analytics
    await prisma.url_analytics.updateMany({
      where: { url_id: url.id },
      data: {
        total_clicks: { increment: 1 },
        last_clicked_at: new Date()
      }
    });

    // Redirect to original URL
    return res.redirect(url.original_url);
    
  } catch (error) {
    console.error("Redirect error:", error);
    return res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Routes - อยู่หลัง redirect endpoint
app.use('/user', userRouter);
app.use('/url', urlRouter);
app.use('/analytics', analyticsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local: http://localhost:${port}`);
});

module.exports = app;