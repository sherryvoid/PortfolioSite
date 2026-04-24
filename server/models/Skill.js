const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Skill name is required'], trim: true },
  icon: { type: String, default: '' },  // Devicon slug: "react", "nodejs", etc.
  category: {
    type: String,
    enum: ['frontend', 'backend', 'database', 'devops', 'tools', 'language', 'frameworks'],
    default: 'frontend'
  },
  proficiency: { type: Number, min: 0, max: 100, default: 50 },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Skill', skillSchema);
