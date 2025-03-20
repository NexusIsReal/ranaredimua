const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  discriminator: {
    type: String
  },
  email: {
    type: String
  },
  avatar: {
    type: String
  },
  accessToken: {
    type: String
  },
  refreshToken: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  // List of guild IDs where this user has permission to manage the bot
  authorizedGuilds: [{
    guildId: {
      type: String,
      required: true
    },
    guildName: {
      type: String
    },
    // User's permissions in the guild
    permissions: {
      type: String // Bitfield as a string
    }
  }],
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema); 