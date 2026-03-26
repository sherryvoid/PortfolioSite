const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 200,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  message: { message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const analyticsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 500 : 120,
  message: { message: 'Too many analytics events.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { generalLimiter, authLimiter, analyticsLimiter };
