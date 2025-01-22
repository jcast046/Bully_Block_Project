const mongoose = require('mongoose');

const BullySchema = new mongoose.Schema({
  description: { type: String, required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  contentType: { type: String, enum: ['post', 'message', 'comment'], required: true }, // To track where the incident was found
  severityLevel: { type: String, enum: ['low', 'medium', 'high'], required: true },
  status: { type: String, enum: ['pending', 'resolved', 'ignored'], default: 'pending' }, // To track incident status
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference to the content that was flagged (post, message, or comment)
  alert: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }, // Link to any generated alert
});

module.exports = mongoose.model('Bully', BullySchema);
