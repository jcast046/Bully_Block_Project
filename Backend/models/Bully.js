const mongoose = require('mongoose');

// Define the schema for reported bullying incidents
const BullySchema = new mongoose.Schema({
  // Description of the incident
  description: {
    type: String,
    required: true,
  },
  
  // User who reported the incident
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Date the incident was reported
  date: {
    type: Date,
    default: Date.now,
  },
  
  // Type of content where the incident occurred
  contentType: {
    type: String,
    enum: ['post', 'message', 'comment'],
    required: true,
  },
  
  // Severity level of the incident
  severityLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
  },
  
  // Status of the incident
  status: {
    type: String,
    enum: ['pending', 'resolved', 'ignored'],
    default: 'pending',
  },
  
  // Reference to the flagged content (post, message, or comment)
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
  },
  
  // Link to any generated alert
  alert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
  },
}, {
  // Automatically track when records are created or updated
  timestamps: true,
});

module.exports = mongoose.model('Bully', BullySchema);
