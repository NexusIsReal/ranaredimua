require('dotenv').config();
const path = require('path');

/**
 * Application configuration
 */
module.exports = {
  // Discord Bot Configuration
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    guildId: process.env.DISCORD_GUILD_ID, // For development & slash command registration
    ownerId: process.env.DISCORD_OWNER_ID, // Bot owner's Discord ID
    inviteUrl: process.env.DISCORD_BOT_INVITE_URL,
    defaultPrefix: '!'
  },
  
  // Web Panel Configuration
  web: {
    port: process.env.PORT || 3000,
    sessionSecret: process.env.SESSION_SECRET || 'keyboard cat',
    callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/callback',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  },
  
  // Database Configuration
  database: {
    dataDir: process.env.DATA_DIR || path.join(process.cwd(), 'data')
  },
  
  // Admin Users (Discord IDs)
  admins: (process.env.ADMIN_IDS || '').split(',').filter(Boolean)
}; 