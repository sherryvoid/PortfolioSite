const express = require('express');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Skill = require('../models/Skill');
const Certification = require('../models/Certification');

const router = express.Router();

// GET /api/profile - Public
router.get('/', async (req, res, next) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create({});
    }
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// PUT /api/profile - Admin: update profile
router.put('/', auth, async (req, res, next) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = new Profile(req.body);
    } else {
      Object.assign(profile, req.body);
    }
    await profile.save();
    res.json(profile);
  } catch (error) {
    next(error);
  }
});
// POST /api/profile/snapshot - Admin: Generate AI Knowledge Vector
router.post('/snapshot', auth, async (req, res, next) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) profile = new Profile({});
    
    // Fetch all other core components
    const projects = await Project.find({}).lean();
    const skills = await Skill.find({}).lean();
    const certifications = await Certification.find({}).lean();

    // Map into a huge unified JSON data structure
    const compiledVector = {
      name: profile.name,
      title: profile.title,
      bio: profile.bio,
      email: profile.email,
      stats: profile.stats,
      experience: profile.experience,
      education: profile.education,
      languages: profile.languages,
      preferredJobTypes: profile.preferredJobTypes,
      preferredLocations: profile.preferredLocations,
      preferredWorkModes: profile.preferredWorkModes,
      skills: skills.map(s => ({ category: s.category, name: s.name, level: s.level })),
      projects: projects.map(p => ({ title: p.title, tools: p.techStack, description: p.description })),
      certifications: certifications.map(c => ({ title: c.title, issuer: c.issuer, date: c.date }))
    };

    profile.aiVector = JSON.stringify(compiledVector);
    await profile.save();
    
    res.json({ message: 'AI Snapshot Vector successfully generated', aiVector: profile.aiVector });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
