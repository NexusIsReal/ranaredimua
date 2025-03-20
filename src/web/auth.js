const DiscordStrategy = require('passport-discord').Strategy;
const config = require('../config/config');
const User = require('../models/User');

/**
 * Setup authentication for the web panel
 * @param {Object} passport - Passport.js instance
 */
function setupAuth(passport) {
  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.discordId);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findOne({ discordId: id });
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Set up Discord strategy
  passport.use(new DiscordStrategy({
    clientID: config.discord.clientId,
    clientSecret: config.discord.clientSecret,
    callbackURL: config.web.callbackURL,
    scope: ['identify', 'email', 'guilds']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Format guilds data
      const authorizedGuilds = profile.guilds 
        ? profile.guilds
            .filter(guild => (guild.permissions & 0x20) === 0x20) // Check for MANAGE_SERVER permission
            .map(guild => ({
              guildId: guild.id,
              name: guild.name,
              icon: guild.icon,
              permissions: guild.permissions
            }))
        : [];
      
      // Check if user is admin
      const isAdmin = config.admins.includes(profile.id);
      
      // Build user data
      const userData = {
        discordId: profile.id,
        username: profile.username,
        discriminator: profile.discriminator || '0',
        avatar: profile.avatar,
        email: profile.email,
        accessToken,
        refreshToken,
        authorizedGuilds,
        isAdmin,
        lastLogin: new Date()
      };
      
      // Use findOrCreate helper
      const user = await User.findOrCreate(userData);
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

/**
 * Middleware to check if user is authenticated
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.redirect('/auth/login');
}

/**
 * Middleware to check if user is an admin
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  
  res.status(403).render('error', {
    title: 'Access Denied',
    error: 'You do not have permission to access this page.',
    user: req.user
  });
}

/**
 * Middleware to check if user has permission to manage a guild
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function hasGuildPermission(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/login');
  }
  
  const guildId = req.params.guildId || req.body.guildId;
  
  if (!guildId) {
    return res.status(400).render('error', {
      title: 'Error',
      error: 'No guild ID provided.',
      user: req.user
    });
  }
  
  // Check if user is admin (admins can access all guilds)
  if (req.user.isAdmin) {
    return next();
  }
  
  // Check if user has permission to manage this guild
  const hasPermission = req.user.authorizedGuilds.some(guild => guild.guildId === guildId);
  
  if (hasPermission) {
    return next();
  }
  
  res.status(403).render('error', {
    title: 'Access Denied',
    error: 'You do not have permission to manage this server.',
    user: req.user
  });
}

module.exports = {
  setupAuth,
  isAuthenticated,
  isAdmin,
  hasGuildPermission
}; 