const express = require('express');
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/skills - Public: list all skills
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;

    const skills = await Skill.find(filter).sort({ order: 1 });
    res.json(skills);
  } catch (error) {
    next(error);
  }
});

// POST /api/skills - Admin: create skill
router.post('/', auth, async (req, res, next) => {
  try {
    const skill = new Skill(req.body);
    await skill.save();
    res.status(201).json(skill);
  } catch (error) {
    next(error);
  }
});

// PUT /api/skills/:id - Admin: update skill
router.put('/:id', auth, async (req, res, next) => {
  try {
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found.' });
    }
    res.json(skill);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/skills/:id - Admin: delete skill
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found.' });
    }
    res.json({ message: 'Skill deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
