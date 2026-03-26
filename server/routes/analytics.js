const express = require('express');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const auth = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/analytics/event - Public: track event
router.post('/event', analyticsLimiter, async (req, res, next) => {
  try {
    const { type, target, sessionId, referrer, userAgent, screenSize, duration } = req.body;
    
    const event = new AnalyticsEvent({
      type,
      target,
      sessionId,
      ip: (req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '').split(',')[0].trim(),
      referrer: referrer || req.headers.referer || '',
      userAgent: userAgent || req.headers['user-agent'] || '',
      screenSize,
      duration
    });

    await event.save();
    res.status(201).json({ message: 'Event tracked.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/overview - Admin: aggregated stats
router.get('/overview', auth, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [totalViews, uniqueSessions, topProject, contactSubmissions, recentEvents] = await Promise.all([
      // Total page views
      AnalyticsEvent.countDocuments({
        type: 'page_view',
        timestamp: { $gte: startDate }
      }),
      // Unique sessions
      AnalyticsEvent.distinct('sessionId', {
        timestamp: { $gte: startDate }
      }).then(sessions => sessions.length),
      // Most viewed project
      AnalyticsEvent.aggregate([
        { $match: { type: 'project_click', timestamp: { $gte: startDate } } },
        { $group: { _id: '$target', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
      // Contact submissions
      AnalyticsEvent.countDocuments({
        type: 'contact_submit',
        timestamp: { $gte: startDate }
      }),
      // Recent events
      AnalyticsEvent.find()
        .sort({ timestamp: -1 })
        .limit(20)
        .lean()
    ]);

    res.json({
      totalViews,
      uniqueSessions,
      topProject: topProject[0] || null,
      contactSubmissions,
      recentEvents
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/visitors - Admin: visitor trends
router.get('/visitors', auth, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trends = await AnalyticsEvent.aggregate([
      { $match: { type: 'page_view', timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          views: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          views: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(trends);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/top-projects - Admin
router.get('/top-projects', auth, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const topProjects = await AnalyticsEvent.aggregate([
      { $match: { type: 'project_click', timestamp: { $gte: startDate } } },
      { $group: { _id: '$target', clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);

    res.json(topProjects);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/sections - Admin: section view breakdown
router.get('/sections', auth, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const sections = await AnalyticsEvent.aggregate([
      { $match: { type: 'section_view', timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$target',
          views: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      },
      { $sort: { views: -1 } }
    ]);

    res.json(sections);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
