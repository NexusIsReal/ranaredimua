const express = require('express');
const { isAuthenticated, hasGuildPermission } = require('../auth');
const ServerConfigService = require('../../services/ServerConfigService');
const Infraction = require('../../models/Infraction');

module.exports = (client) => {
  const router = express.Router();
  
  // Secure all API routes
  router.use(isAuthenticated);
  
  // Update moderation settings
  router.post('/server/:guildId/moderation', hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    const { 
      moderationRoleId, 
      modLogChannelId, 
      muteRoleId,
      autoMuteThreshold,
      autoKickThreshold,
      autoBanThreshold
    } = req.body;
    
    try {
      const config = await ServerConfigService.updateConfig(guildId, {
        moderationRoleId,
        modLogChannelId,
        muteRoleId,
        warnThresholds: {
          muteThreshold: autoMuteThreshold ? parseInt(autoMuteThreshold) : null,
          kickThreshold: autoKickThreshold ? parseInt(autoKickThreshold) : null,
          banThreshold: autoBanThreshold ? parseInt(autoBanThreshold) : null
        }
      });
      
      res.json({
        success: true,
        message: 'Moderation settings updated successfully',
        config
      });
    } catch (error) {
      console.error('Error updating moderation settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update moderation settings',
        error: error.message
      });
    }
  });
  
  // Update automod settings
  router.post('/server/:guildId/automod', hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    const {
      enabled,
      filterProfanity,
      filterInvites,
      filterLinks,
      filterSpam,
      profanityList,
      allowedLinks,
      ignoredChannels,
      ignoredRoles
    } = req.body;
    
    try {
      const automodSettings = {
        enabled: enabled === 'true',
        filters: {
          profanity: filterProfanity === 'true',
          invites: filterInvites === 'true',
          links: filterLinks === 'true',
          spam: filterSpam === 'true'
        },
        profanityList: profanityList ? profanityList.split(',').map(word => word.trim()) : [],
        allowedLinks: allowedLinks ? allowedLinks.split(',').map(link => link.trim()) : [],
        ignoredChannels: ignoredChannels || [],
        ignoredRoles: ignoredRoles || []
      };
      
      const config = await ServerConfigService.updateAutoModConfig(guildId, automodSettings);
      
      res.json({
        success: true,
        message: 'AutoMod settings updated successfully',
        config
      });
    } catch (error) {
      console.error('Error updating automod settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update AutoMod settings',
        error: error.message
      });
    }
  });
  
  // Update logging settings
  router.post('/server/:guildId/logs', hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    const {
      logChannelId,
      logEvents
    } = req.body;
    
    try {
      const loggingSettings = {
        logChannelId,
        enabledEvents: logEvents || []
      };
      
      const config = await ServerConfigService.updateLoggingConfig(guildId, loggingSettings);
      
      res.json({
        success: true,
        message: 'Logging settings updated successfully',
        config
      });
    } catch (error) {
      console.error('Error updating logging settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update logging settings',
        error: error.message
      });
    }
  });
  
  // Get server config
  router.get('/server/:guildId/config', hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    
    try {
      const config = await ServerConfigService.getOrCreateConfig(guildId);
      
      res.json({
        success: true,
        config
      });
    } catch (error) {
      console.error('Error fetching server config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch server configuration',
        error: error.message
      });
    }
  });
  
  // Get user infractions
  router.get('/server/:guildId/infractions/:userId', hasGuildPermission, async (req, res) => {
    const { guildId, userId } = req.params;
    
    try {
      const infractions = await ServerConfigService.getUserInfractions(guildId, userId);
      
      res.json({
        success: true,
        infractions
      });
    } catch (error) {
      console.error('Error fetching user infractions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user infractions',
        error: error.message
      });
    }
  });

  // Get total number of infractions in a server
  router.get('/server/:guildId/infractions/count', hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    
    try {
      const count = await ServerConfigService.getTotalInfractions(guildId);
      
      res.json({
        success: true,
        count
      });
    } catch (error) {
      console.error('Error fetching infraction count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch infraction count',
        error: error.message
      });
    }
  });
  
  // Get recent activity for a server
  router.get('/server/:guildId/activity', hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    try {
      const activity = await ServerConfigService.getRecentActivity(guildId, limit);
      
      res.json({
        success: true,
        activity
      });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent activity',
        error: error.message
      });
    }
  });

  // Get server stats (warning count, etc.)
  router.get('/server/:guildId/stats', hasGuildPermission, async (req, res) => {
    const { guildId } = req.params;
    
    try {
      // Get warning count from infractions
      const warnings = await Infraction.find({ 
        guildId: guildId,
        type: 'warning'
      });
      
      // Get other stats as needed
      const stats = {
        warningCount: warnings.length,
        // Add additional stats here as needed
      };
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error fetching server stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch server stats',
        error: error.message
      });
    }
  });

  return router;
}; 