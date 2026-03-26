const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true },
  slug: { type: String },
  description: { type: String, required: [true, 'Description is required'] },
  longDescription: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  images: [{ type: String }],
  techStack: [{ type: String }],
  liveUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  category: {
    type: String,
    enum: ['web', 'mobile', 'ai', 'backend', 'other'],
    default: 'web'
  },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  views: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Auto-generate slug from title
projectSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
