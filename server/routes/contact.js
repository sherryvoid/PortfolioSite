const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// POST /api/contact - Public: submit message
router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    const contactMessage = new ContactMessage({ name, email, subject, message });
    await contactMessage.save();

    // Send email alert natively if SMTP is configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      emailService.sendEmail({
        to: process.env.SMTP_USER, // Send alert to the configured email
        replyTo: email,
        subject: `New Portfolio Message: ${subject}`,
        body: `You received a new message from your portfolio website!\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        fromName: name
      });
    }

    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (error) {
    next(error);
  }
});

// GET /api/contact - Admin: list all messages
router.get('/', auth, async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/contact/:id/read - Admin: toggle read
router.patch('/:id/read', auth, async (req, res, next) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found.' });
    }
    msg.isRead = !msg.isRead;
    await msg.save();
    res.json(msg);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/contact/:id - Admin: delete message
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found.' });
    }
    res.json({ message: 'Message deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
