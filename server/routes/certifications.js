const express = require('express');
const Certification = require('../models/Certification');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/certifications - Public
router.get('/', async (req, res, next) => {
  try {
    const certs = await Certification.find().sort({ order: 1, issueDate: -1 });
    res.json(certs);
  } catch (error) {
    next(error);
  }
});

// POST /api/certifications - Admin
router.post('/', auth, async (req, res, next) => {
  try {
    const cert = new Certification(req.body);
    await cert.save();
    res.status(201).json(cert);
  } catch (error) {
    next(error);
  }
});

// PUT /api/certifications/:id - Admin
router.put('/:id', auth, async (req, res, next) => {
  try {
    const cert = await Certification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!cert) {
      return res.status(404).json({ message: 'Certification not found.' });
    }
    res.json(cert);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/certifications/:id - Admin
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const cert = await Certification.findByIdAndDelete(req.params.id);
    if (!cert) {
      return res.status(404).json({ message: 'Certification not found.' });
    }
    res.json({ message: 'Certification deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
