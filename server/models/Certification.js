const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true },
  issuer: { type: String, required: [true, 'Issuer is required'] },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  credentialUrl: { type: String, default: '' },
  badgeImage: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certification', certificationSchema);
