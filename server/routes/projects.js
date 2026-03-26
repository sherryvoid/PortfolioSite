const express = require('express');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/projects - Public: list all projects
router.get('/', async (req, res, next) => {
  try {
    const { category, featured } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.featured = true;

    const projects = await Project.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Public: single project
router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    // Increment views
    project.views += 1;
    await project.save();
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Admin: create project
router.post('/', auth, async (req, res, next) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id - Admin: update project
router.put('/:id', auth, async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Admin: delete project
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    res.json({ message: 'Project deleted.' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/reorder - Admin: reorder projects
router.patch('/reorder', auth, async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index }
      }
    }));
    await Project.bulkWrite(bulkOps);
    res.json({ message: 'Projects reordered.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
