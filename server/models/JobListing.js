const mongoose = require('mongoose');

const jobListingSchema = new mongoose.Schema({
  apiId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  country: { type: String, default: '' },       // e.g., 'Germany', 'USA', 'Anywhere'
  workMode: { type: String, default: '' },       // 'remote', 'hybrid', 'onsite'
  jobType: { type: String, default: '' },        // 'full_time', 'part_time', 'contract', 'mini_job'
  language: { type: String, default: '' },       // 'english', 'deutsch', etc.
  salary: { type: String },
  description: { type: String },
  url: { type: String, required: true },
  tags: [String],
  source: { type: String, required: true },      // 'remotive', 'arbeitnow', 'jobicy'
  publishedAt: { type: Date },

  // AI fields
  isAnalyzed: { type: Boolean, default: false },
  matchScore: { type: Number, min: 0, max: 100 },
  aiRecommendation: { type: String },

  // Application tracking (future)
  hasApplied: { type: Boolean, default: false },
  appliedAt: { type: Date },

  createdAt: { type: Date, default: Date.now }
});

jobListingSchema.index({ publishedAt: -1 });
jobListingSchema.index({ source: 1 });
jobListingSchema.index({ country: 1 });
jobListingSchema.index({ workMode: 1 });

module.exports = mongoose.model('JobListing', jobListingSchema);
