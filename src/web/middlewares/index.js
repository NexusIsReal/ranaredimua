const { ServerConfigService } = require('../../bot/utils');

/**
 * Add bot, guild, and server configs to the response locals
 * @param {Object} client - Discord.js client
 */
function createLocalsMiddleware(client) {
  return async (req, res, next) => {
    // Add user to res.locals
    res.locals.user = req.user || null;
    
    // Add bot client to res.locals
    res.locals.bot = {
      user: client.user,
      status: client.ws.status,
      guildCount: client.guilds.cache.size
    };
    
    // If user is authenticated, add their authorized guilds
    if (req.user) {
      // Get only the guilds where the bot is present
      const authorizedGuildIds = req.user.authorizedGuilds.map(g => g.guildId);
      const mutualGuilds = client.guilds.cache
        .filter(guild => authorizedGuildIds.includes(guild.id))
        .map(guild => ({
          id: guild.id,
          name: guild.name,
          iconURL: guild.iconURL() || null,
          memberCount: guild.memberCount
        }));
      
      res.locals.mutualGuilds = mutualGuilds;
    }
    
    // If there's a guildId parameter, add server config
    if (req.params.guildId && req.user) {
      try {
        const serverConfig = await ServerConfigService.getOrCreateConfig(
          req.params.guildId,
          client.guilds.cache.get(req.params.guildId)?.name || 'Unknown Server'
        );
        
        res.locals.serverConfig = serverConfig;
        
        // Also add the guild object if available
        const guild = client.guilds.cache.get(req.params.guildId);
        if (guild) {
          res.locals.currentGuild = {
            id: guild.id,
            name: guild.name,
            iconURL: guild.iconURL() || null,
            memberCount: guild.memberCount,
            roles: guild.roles.cache
              .filter(role => role.id !== guild.id) // Filter out @everyone
              .sort((a, b) => b.position - a.position) // Sort by position
              .map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor,
                position: role.position
              })),
            channels: guild.channels.cache
              .filter(channel => channel.type === 0) // Text channels only
              .sort((a, b) => a.position - b.position) // Sort by position
              .map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type
              }))
          };
        }
      } catch (err) {
        console.error(`Error fetching server config for ${req.params.guildId}:`, err);
      }
    }
    
    next();
  };
}

/**
 * Set up all middlewares for the Express app
 * @param {Object} app - Express app
 * @param {Object} client - Discord.js client
 */
function setupMiddlewares(app, client) {
  // Add locals middleware
  app.use(createLocalsMiddleware(client));
  
  // Add CSRF protection (optional)
  // app.use(csrfProtection);
  
  // Add flash messages middleware (optional)
  // app.use(flash());
}

module.exports = {
  setupMiddlewares
}; 