const express = require('express');
const { isAuthenticated, hasGuildPermission } = require('../auth');
const { ServerConfigService } = require('../../bot/utils');

/**
 * Prepare guild data for templates
 * @param {Object} guild - Discord.js guild object
 * @param {Object} currentGuild - Existing currentGuild from locals, if any
 * @returns {Object} Formatted guild data
 */
function prepareGuildData(guild, currentGuild) {
  return currentGuild || {
    id: guild.id,
    name: guild.name,
    iconURL: guild.iconURL() || null,
    memberCount: guild.memberCount,
    roles: guild.roles.cache
      .filter(role => role.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor,
        position: role.position
      })),
    channels: guild.channels.cache
      .filter(channel => channel.type === 0)
      .sort((a, b) => a.position - b.position)
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type
      }))
  };
}

module.exports = (client) => {
  const router = express.Router();
  
  // Secure all dashboard routes
  router.use(isAuthenticated);

  // Main dashboard page - show list of user's servers
  router.get('/', (req, res) => {
    console.log('User authorized guilds:', req.user.authorizedGuilds);
    console.log('Mutual guilds from locals:', res.locals.mutualGuilds);
    console.log('Bot guilds:', client.guilds.cache.map(g => ({ id: g.id, name: g.name })));
    
    res.render('dashboard/index', {
      title: 'Dashboard',
      mutualGuilds: res.locals.mutualGuilds || []
    });
  });

  // Server-specific dashboard
  router.get('/server/:guildId', hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    
    try {
      // Check if the server exists in the bot's cache
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        return res.render('error', {
          title: 'Server Not Found',
          error: 'The bot is not in this server. Please invite the bot first.'
        });
      }
      
      // Prepare guild data
      const guildData = prepareGuildData(guild, res.locals.currentGuild);
      
      // Get server config if not already in locals
      const serverConfig = res.locals.serverConfig || 
        await ServerConfigService.getOrCreateConfig(guildId, guild.name);
      
      res.render('dashboard/server', {
        title: `${guild.name} Dashboard`,
        guild: guildData,
        config: serverConfig
      });
    } catch (error) {
      console.error('Error fetching server dashboard:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'An error occurred while loading the server dashboard.'
      });
    }
  });

  // Moderation settings
  router.get('/server/:guildId/moderation', hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    
    try {
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        return res.render('error', {
          title: 'Server Not Found',
          error: 'The bot is not in this server. Please invite the bot first.'
        });
      }
      
      // Prepare guild data
      const guildData = prepareGuildData(guild, res.locals.currentGuild);
      
      // Get server config if not already in locals
      const serverConfig = res.locals.serverConfig || 
        await ServerConfigService.getOrCreateConfig(guildId, guild.name);
      
      res.render('dashboard/moderation', {
        title: `${guild.name} - Moderation Settings`,
        guild: guildData,
        config: serverConfig
      });
    } catch (error) {
      console.error('Error fetching moderation settings:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'An error occurred while loading the moderation settings.'
      });
    }
  });

  // Automod settings
  router.get('/server/:guildId/automod', hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    
    try {
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        return res.render('error', {
          title: 'Server Not Found',
          error: 'The bot is not in this server. Please invite the bot first.'
        });
      }
      
      // Prepare guild data
      const guildData = prepareGuildData(guild, res.locals.currentGuild);
      
      // Get server config if not already in locals
      const serverConfig = res.locals.serverConfig || 
        await ServerConfigService.getOrCreateConfig(guildId, guild.name);
      
      res.render('dashboard/automod', {
        title: `${guild.name} - AutoMod Settings`,
        guild: guildData,
        config: serverConfig
      });
    } catch (error) {
      console.error('Error fetching automod settings:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'An error occurred while loading the automod settings.'
      });
    }
  });

  // Logs settings
  router.get('/server/:guildId/logs', hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    
    try {
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        return res.render('error', {
          title: 'Server Not Found',
          error: 'The bot is not in this server. Please invite the bot first.'
        });
      }
      
      // Prepare guild data
      const guildData = prepareGuildData(guild, res.locals.currentGuild);
      
      // Get server config if not already in locals
      const serverConfig = res.locals.serverConfig || 
        await ServerConfigService.getOrCreateConfig(guildId, guild.name);
      
      res.render('dashboard/logs', {
        title: `${guild.name} - Logs Settings`,
        guild: guildData,
        config: serverConfig
      });
    } catch (error) {
      console.error('Error fetching logs settings:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'An error occurred while loading the logs settings.'
      });
    }
  });

  return router;
}; 