const express = require('express');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

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

module.exports = router;
