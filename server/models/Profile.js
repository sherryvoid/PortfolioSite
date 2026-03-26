const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  name: { type: String, default: 'Developer Name' },
  title: { type: String, default: 'Full Stack Developer' },
  bio: { type: String, default: '' },
  photo: { type: String, default: '' },
  resume: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  social: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  stats: {
    yearsExperience: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 },
    happyClients: { type: Number, default: 0 }
  },
  heroSubtitle: { type: String, default: 'Software Developer · Problem Solver · Creator' },
  aboutTimeline: [{
    year: String,
    title: String,
    description: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);
