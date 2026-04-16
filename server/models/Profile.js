const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  name: { type: String, default: 'Developer Name' },
  siteName: { type: String, default: '' },
  logo: { type: String, default: '' },
  favicon: { type: String, default: '' },
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
  heroGreeting: { type: String, default: 'Welcome to my portfolio' },
  heroRoles: [{ type: String }],    // Typewriter cycling texts e.g. ['Full Stack Developer', 'AI Engineer']
  status: { type: String, default: 'Available for Work' },
  availability: { type: String, default: 'Available for Work' },
  heroDesignation: { type: String, default: 'Full Stack Software Developer' },
  heroAbout: { type: String, default: '' },
  cvPhoto: { type: String, default: '' },  // Separate headshot photo for CV (base64)
  aboutTimeline: [{
    year: String,
    title: String,
    description: String
  }],

  // ── Enriched Profile Fields (read by AI for matching & CV gen) ──
  experience: [{
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    duration: { type: String, default: '' },
    description: { type: String, default: '' }
  }],
  education: [{
    institution: { type: String, default: '' },
    degree: { type: String, default: '' },
    field: { type: String, default: '' },
    year: { type: String, default: '' }
  }],
  languages: [{
    name: { type: String, default: '' },
    level: { type: String, default: '' }   // 'Native', 'Fluent', 'C1', 'B2', 'A1' etc.
  }],
  preferredJobTypes: [String],      // ['full_time', 'part_time']
  preferredLocations: [String],     // ['Germany', 'Remote']
  preferredWorkModes: [String]      // ['remote', 'hybrid']
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);
