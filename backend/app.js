const express = require('express');
const cors = require('cors');
const path = require('path');
const prisma = require('./prisma/prisma');
const userRouter = require('./routes/userRoutes');
const urlRouter = require('./routes/urlRoutes');
const analyticsRouter = require('./routes/analyticsRoutes');

const app = express();
const port = 3000;

// CORS Configuration - ต้องอยู่ก่อน middleware อื่นๆ
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⚠️ CRITICAL: Redirect route ต้องอยู่ก่อน API routes อื่นๆทั้งหมด
// และต้องอยู่ก่อน middleware อื่นๆ เพื่อให้ทำงานได้
app.get('/r/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    console.log(`[REDIRECT] Attempting to redirect: ${shortCode}`);
    
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referer = req.headers['referer'] || req.headers['referrer'];
    
    const url = await prisma.urls.findUnique({
      where: { short_code: shortCode }
    });
    
    if (!url) {
      console.log(`[REDIRECT] URL not found: ${shortCode}`);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Not Found</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 2rem;
            }
            .error-container {
              text-align: center;
              color: white;
              max-width: 600px;
            }
            .error-icon {
              font-size: 5rem;
              margin-bottom: 1.5rem;
              animation: fadeIn 0.5s ease-out;
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 1rem;
              font-weight: 700;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
              animation: fadeIn 0.6s ease-out;
            }
            p {
              font-size: 1.25rem;
              opacity: 0.95;
              margin-bottom: 2rem;
              line-height: 1.6;
              animation: fadeIn 0.7s ease-out;
            }
            a {
              display: inline-block;
              padding: 1rem 2.5rem;
              background: white;
              color: #667eea;
              text-decoration: none;
              border-radius: 3rem;
              font-weight: 700;
              font-size: 1.1rem;
              transition: all 0.3s;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              animation: fadeIn 0.8s ease-out;
            }
            a:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <div class="error-icon">❌</div>
            <h1>Link Not Found</h1>
            <p>The link you're looking for doesn't exist or has been removed.</p>
            <a href="http://localhost:5173">Go to Homepage</a>
          </div>
        </body>
        </html>
      `);
    }
    
    if (!url.is_active) {
      console.log(`[REDIRECT] URL is inactive: ${shortCode}`);
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Disabled</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 2rem;
            }
            .error-container {
              text-align: center;
              color: white;
              max-width: 600px;
            }
            .error-icon {
              font-size: 5rem;
              margin-bottom: 1.5rem;
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 1rem;
              font-weight: 700;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            p {
              font-size: 1.25rem;
              opacity: 0.95;
              margin-bottom: 2rem;
              line-height: 1.6;
            }
            a {
              display: inline-block;
              padding: 1rem 2.5rem;
              background: white;
              color: #667eea;
              text-decoration: none;
              border-radius: 3rem;
              font-weight: 700;
              font-size: 1.1rem;
              transition: all 0.3s;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            a:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <div class="error-icon">🚫</div>
            <h1>Link Disabled</h1>
            <p>This link has been disabled by its owner.</p>
            <a href="http://localhost:5173">Go to Homepage</a>
          </div>
        </body>
        </html>
      `);
    }
    
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      console.log(`[REDIRECT] URL has expired: ${shortCode}`);
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Expired</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 2rem;
            }
            .error-container {
              text-align: center;
              color: white;
              max-width: 600px;
            }
            .error-icon {
              font-size: 5rem;
              margin-bottom: 1.5rem;
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 1rem;
              font-weight: 700;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            p {
              font-size: 1.25rem;
              opacity: 0.95;
              margin-bottom: 2rem;
              line-height: 1.6;
            }
            a {
              display: inline-block;
              padding: 1rem 2.5rem;
              background: white;
              color: #667eea;
              text-decoration: none;
              border-radius: 3rem;
              font-weight: 700;
              font-size: 1.1rem;
              transition: all 0.3s;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            a:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <div class="error-icon">⏰</div>
            <h1>Link Expired</h1>
            <p>This link has expired and is no longer available.</p>
            <a href="http://localhost:5173">Go to Homepage</a>
          </div>
        </body>
        </html>
      `);
    }
    
    // Detect device type
    let device_type = 'other';
    if (userAgent) {
      if (/mobile/i.test(userAgent)) device_type = 'mobile';
      else if (/tablet/i.test(userAgent)) device_type = 'tablet';
      else if (/desktop|windows|mac|linux/i.test(userAgent)) device_type = 'desktop';
    }
    
    // Track click asynchronously (don't wait for it)
    prisma.url_clicks.create({
      data: {
        url_id: url.id,
        ip_address: ip,
        user_agent: userAgent,
        referer: referer,
        device_type: device_type
      }
    }).catch(err => console.error('[REDIRECT] Error tracking click:', err));
    
    // Update analytics asynchronously
    prisma.url_analytics.update({
      where: { url_id: url.id },
      data: {
        total_clicks: { increment: 1 },
        last_clicked_at: new Date()
      }
    }).catch(err => console.error('[REDIRECT] Error updating analytics:', err));
    
    // Log successful redirect
    console.log(`[REDIRECT] Success! Redirecting to: ${url.original_url}`);
    
    // Perform the redirect
    return res.redirect(301, url.original_url);
  } catch (error) {
    console.error('[REDIRECT] Server error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server Error</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem;
          }
          .error-container {
            text-align: center;
            color: white;
            max-width: 600px;
          }
          .error-icon {
            font-size: 5rem;
            margin-bottom: 1.5rem;
          }
          h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          p {
            font-size: 1.25rem;
            opacity: 0.95;
            margin-bottom: 2rem;
            line-height: 1.6;
          }
          a {
            display: inline-block;
            padding: 1rem 2.5rem;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 3rem;
            font-weight: 700;
            font-size: 1.1rem;
            transition: all 0.3s;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          a:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h1>Server Error</h1>
          <p>Something went wrong. Please try again later.</p>
          <a href="http://localhost:5173">Go to Homepage</a>
        </div>
      </body>
      </html>
    `);
  }
});

// API Routes - ต้องอยู่หลัง redirect route
app.use('/user', userRouter);
app.use('/url', urlRouter);
app.use('/analytics', analyticsRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'URL Shortener API is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    routes: {
      redirect: 'GET /r/:shortCode',
      users: '/user/*',
      urls: '/url/*',
      analytics: '/analytics/*'
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => { 
  console.log(`
╔════════════════════════════════════════════════╗
║   URL Shortener API Server Started!           ║
╠════════════════════════════════════════════════╣
║   Port: ${port}                                    ║
║   Redirect URL: http://localhost:${port}/r/:code  ║
║   Health Check: http://localhost:${port}/          ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;