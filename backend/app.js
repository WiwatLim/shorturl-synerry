const express = require('express');
const cors = require('cors');
const path = require('path');
const userRouter = require('./routes/userRoutes');
const urlRouter = require('./routes/urlRoutes');
const analyticsRouter = require('./routes/analyticsRoutes');

const app = express();
const port = 3000;

// CORS Configuration - ต้องอยู่ก่อน middleware อื่นๆ
app.use(cors({
  origin: 'http://localhost:5173', // อนุญาตให้ frontend เข้าถึง
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use routes
app.use('/user', userRouter);
app.use('/url', urlRouter);
app.use('/analytics', analyticsRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'URL Shortener API is running',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(port, () => { 
  console.log("server start at port", port);
});

app.get("/api/short/:shortCode", async (req, res) => {
  const { shortCode } = req.params;

  try {
    // 👇 ใช้ชื่อ field ให้ตรงกับ schema
    const url = await prisma.urls.findUnique({
      where: { short_code: shortCode },
    });

    if (!url) {
      return res.status(404).json({ message: "Not found" });
    }

    // เพิ่มจำนวนคลิก (optional)
    await prisma.url_analytics.updateMany({
      where: { url_id: url.id },
      data: { total_clicks: { increment: 1 } },
    });

    return res.json({ originalUrl: url.original_url });
  } catch (error) {
    console.error("Redirect error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


module.exports = app;