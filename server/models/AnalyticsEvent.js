const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['page_view', 'section_view', 'project_click', 'contact_submit', 'resume_download'],
    required: true
  },
  target: { type: String, default: '' },
  sessionId: { type: String, required: true },
  ip: { type: String, default: '' },
  referrer: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  country: { type: String, default: '' },
  screenSize: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

// Indexes for efficient queries
analyticsEventSchema.index({ timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1 });
analyticsEventSchema.index({ type: 1 });
analyticsEventSchema.index({ target: 1 });
analyticsEventSchema.index({ country: 1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
