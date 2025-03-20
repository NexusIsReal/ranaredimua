const ServerConfig = require('../models/ServerConfig');
const Infraction = require('../models/Infraction');

/**
 * Service for managing server configurations
 */
class ServerConfigService {
  /**
   * Get or create a server configuration
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<Object>} Server configuration
   */
  static async getOrCreateConfig(guildId) {
    try {
      let config = await ServerConfig.findOne({ guildId });
      
      if (!config) {
        // Create new default config
        config = new ServerConfig({
          guildId,
          prefix: '!',
          moderationRoleId: null,
          modLogChannelId: null,
          muteRoleId: null,
          warnThresholds: {
            muteThreshold: null,
            kickThreshold: null,
            banThreshold: null
          },
          automod: {
            enabled: false,
            filters: {
              profanity: false,
              invites: false,
              links: false,
              spam: false
            },
            profanityList: [],
            allowedLinks: [],
            ignoredChannels: [],
            ignoredRoles: []
          },
          logging: {
            logChannelId: null,
            enabledEvents: []
          }
        });
        
        await config.save();
      }
      
      return config;
    } catch (error) {
      console.error('Error in getOrCreateConfig:', error);
      throw error;
    }
  }
  
  /**
   * Update server configuration
   * @param {string} guildId - Discord guild ID
   * @param {Object} updatedConfig - Updated configuration
   * @returns {Promise<Object>} Updated server configuration
   */
  static async updateConfig(guildId, updatedConfig) {
    try {
      const config = await this.getOrCreateConfig(guildId);
      
      // Update properties
      Object.keys(updatedConfig).forEach(key => {
        if (key === 'warnThresholds') {
          config.warnThresholds = {
            ...config.warnThresholds,
            ...updatedConfig.warnThresholds
          };
        } else {
          config[key] = updatedConfig[key];
        }
      });
      
      await config.save();
      return config;
    } catch (error) {
      console.error('Error in updateConfig:', error);
      throw error;
    }
  }
  
  /**
   * Update automod configuration
   * @param {string} guildId - Discord guild ID
   * @param {Object} automodSettings - AutoMod settings
   * @returns {Promise<Object>} Updated server configuration
   */
  static async updateAutoModConfig(guildId, automodSettings) {
    try {
      const config = await this.getOrCreateConfig(guildId);
      
      config.automod = {
        ...config.automod,
        ...automodSettings
      };
      
      await config.save();
      return config;
    } catch (error) {
      console.error('Error in updateAutoModConfig:', error);
      throw error;
    }
  }
  
  /**
   * Update logging configuration
   * @param {string} guildId - Discord guild ID
   * @param {Object} loggingSettings - Logging settings
   * @returns {Promise<Object>} Updated server configuration
   */
  static async updateLoggingConfig(guildId, loggingSettings) {
    try {
      const config = await this.getOrCreateConfig(guildId);
      
      config.logging = {
        ...config.logging,
        ...loggingSettings
      };
      
      await config.save();
      return config;
    } catch (error) {
      console.error('Error in updateLoggingConfig:', error);
      throw error;
    }
  }
  
  /**
   * Get user infractions for a server
   * @param {string} guildId - Discord guild ID
   * @param {string} userId - Discord user ID
   * @returns {Promise<Array>} User infractions
   */
  static async getUserInfractions(guildId, userId) {
    try {
      const infractions = await Infraction.find({ guildId, userId });
      // Sort manually since we're using NeDB
      return infractions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error in getUserInfractions:', error);
      throw error;
    }
  }
  
  /**
   * Add an infraction for a user
   * @param {Object} infraction - Infraction details
   * @returns {Promise<Object>} Created infraction
   */
  static async addInfraction(infraction) {
    try {
      const newInfraction = new Infraction(infraction);
      await newInfraction.save();
      
      return newInfraction;
    } catch (error) {
      console.error('Error in addInfraction:', error);
      throw error;
    }
  }
  
  /**
   * Get total number of warnings for a user in a guild
   * @param {string} guildId - Discord guild ID
   * @param {string} userId - Discord user ID
   * @returns {Promise<number>} Warning count
   */
  static async getWarningCount(guildId, userId) {
    try {
      const count = await Infraction.countDocuments({
        guildId,
        userId,
        type: 'warning'
      });
      
      return count;
    } catch (error) {
      console.error('Error in getWarningCount:', error);
      throw error;
    }
  }
  
  /**
   * Get total number of infractions in a guild
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<number>} Total infraction count
   */
  static async getTotalInfractions(guildId) {
    try {
      const count = await Infraction.countDocuments({ guildId });
      return count;
    } catch (error) {
      console.error('Error in getTotalInfractions:', error);
      throw error;
    }
  }
  
  /**
   * Get recent activity (infractions) for a guild
   * @param {string} guildId - Discord guild ID
   * @param {number} limit - Maximum number of entries to return
   * @returns {Promise<Array>} Recent activity
   */
  static async getRecentActivity(guildId, limit = 10) {
    try {
      const allActivity = await Infraction.find({ guildId });
      // Sort manually and limit the results
      const sortedActivity = allActivity
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);

      // Format activity data for the dashboard
      return sortedActivity.map(item => ({
        type: item.type,
        timestamp: item.createdAt,
        message: `${item.type.charAt(0).toUpperCase() + item.type.slice(1)}: ${item.targetUsername} - ${item.reason}`
      }));
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      throw error;
    }
  }
  
  /**
   * Get server prefix
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<string>} Server prefix
   */
  static async getPrefix(guildId) {
    try {
      const config = await this.getOrCreateConfig(guildId);
      return config.prefix;
    } catch (error) {
      console.error('Error in getPrefix:', error);
      // Return default prefix if error
      return '!';
    }
  }
}

module.exports = ServerConfigService; 