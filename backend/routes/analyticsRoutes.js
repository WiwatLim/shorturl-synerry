const express = require('express');
const router = express.Router();
const prisma = require('../prisma/prisma');
const { verifyToken } = require('./userRoutes');

// GET analytics by URL ID
router.get('/url/:urlId', verifyToken, async (req, res) => {
  try {
    const { urlId } = req.params;
    
    // Check if URL belongs to user
    const url = await prisma.urls.findUnique({
      where: { id: parseInt(urlId) }
    });
    
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }
    
    if (url.user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this analytics' });
    }
    
    const analytics = await prisma.url_analytics.findUnique({
      where: { url_id: parseInt(urlId) },
      include: {
        urls: {
          select: {
            id: true,
            original_url: true,
            short_code: true,
            title: true,
            created_at: true
          }
        }
      }
    });
    
    if (!analytics) {
      return res.status(404).json({ message: 'Analytics not found' });
    }
    
    res.status(200).json({ analytics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET click history
router.get('/clicks/:urlId', verifyToken, async (req, res) => {
  try {
    const { urlId } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    // Check if URL belongs to user
    const url = await prisma.urls.findUnique({
      where: { id: parseInt(urlId) }
    });
    
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }
    
    if (url.user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this data' });
    }
    
    const clicks = await prisma.url_clicks.findMany({
      where: { url_id: parseInt(urlId) },
      orderBy: { clicked_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const total = await prisma.url_clicks.count({
      where: { url_id: parseInt(urlId) }
    });
    
    res.status(200).json({
      clicks,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET analytics summary
router.get('/summary/:urlId', verifyToken, async (req, res) => {
  try {
    const { urlId } = req.params;
    
    // Check if URL belongs to user
    const url = await prisma.urls.findUnique({
      where: { id: parseInt(urlId) }
    });
    
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }
    
    if (url.user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this data' });
    }
    
    const analytics = await prisma.url_analytics.findUnique({
      where: { url_id: parseInt(urlId) }
    });
    
    const deviceStats = await prisma.url_clicks.groupBy({
      by: ['device_type'],
      where: { url_id: parseInt(urlId) },
      _count: {
        device_type: true
      }
    });
    
    const countryStats = await prisma.url_clicks.groupBy({
      by: ['country'],
      where: { 
        url_id: parseInt(urlId),
        country: { not: null }
      },
      _count: {
        country: true
      },
      orderBy: {
        _count: {
          country: 'desc'
        }
      },
      take: 10
    });
    
    const cityStats = await prisma.url_clicks.groupBy({
      by: ['city'],
      where: { 
        url_id: parseInt(urlId),
        city: { not: null }
      },
      _count: {
        city: true
      },
      orderBy: {
        _count: {
          city: 'desc'
        }
      },
      take: 10
    });
    
    // Get clicks by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const clicksByDate = await prisma.$queryRaw`
      SELECT DATE(clicked_at) as date, COUNT(*) as count
      FROM url_clicks
      WHERE url_id = ${parseInt(urlId)} 
      AND clicked_at >= ${thirtyDaysAgo}
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC
    `;
    
    res.status(200).json({
      analytics,
      deviceStats,
      countryStats,
      cityStats,
      clicksByDate
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET dashboard stats (all URLs for user)
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get all URLs for user
    const urls = await prisma.urls.findMany({
      where: { user_id: userId },
      include: {
        url_analytics: true
      }
    });
    
    // Calculate total clicks
    const totalClicks = urls.reduce((sum, url) => 
      sum + (url.url_analytics?.total_clicks || 0), 0
    );
    
    // Get total URLs
    const totalUrls = urls.length;
    
    // Get active URLs
    const activeUrls = urls.filter(url => url.is_active).length;
    
    // Get recent clicks (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentClicks = await prisma.url_clicks.count({
      where: {
        urls: {
          user_id: userId
        },
        clicked_at: {
          gte: sevenDaysAgo
        }
      }
    });
    
    // Get top 5 URLs by clicks
    const topUrls = urls
      .sort((a, b) => 
        (b.url_analytics?.total_clicks || 0) - (a.url_analytics?.total_clicks || 0)
      )
      .slice(0, 5)
      .map(url => ({
        id: url.id,
        short_code: url.short_code,
        title: url.title,
        original_url: url.original_url,
        total_clicks: url.url_analytics?.total_clicks || 0
      }));
    
    res.status(200).json({
      totalUrls,
      activeUrls,
      totalClicks,
      recentClicks,
      topUrls
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;