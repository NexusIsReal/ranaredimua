const mongoose = require('mongoose');

const ModerationActionSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    index: true
  },
  targetUserId: {
    type: String,
    required: true,
    index: true
  },
  targetUsername: {
    type: String,
    required: true
  },
  moderatorId: {
    type: String,
    required: true
  },
  moderatorUsername: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['warn', 'mute', 'kick', 'ban', 'unmute', 'unban'],
    required: true
  },
  reason: {
    type: String,
    default: 'No reason provided'
  },
  duration: {
    type: Number, // Duration in milliseconds for temporary actions
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // For automod actions
  isAutomod: {
    type: Boolean,
    default: false
  },
  automodTrigger: {
    type: String,
    enum: ['spam', 'banned-word', 'mention-spam', 'link-spam', null],
    default: null
  }
}, { timestamps: true });

// Create indexes for efficient querying
ModerationActionSchema.index({ guildId: 1, targetUserId: 1 });
ModerationActionSchema.index({ guildId: 1, type: 1 });
ModerationActionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ModerationAction', ModerationActionSchema); 