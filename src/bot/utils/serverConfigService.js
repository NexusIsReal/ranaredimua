const { db } = require('../../database');

/**
 * Service for managing server configurations
 */
class ServerConfigService {
  /**
   * Get a server's configuration, creating a default one if it doesn't exist
   * @param {string} guildId - The guild ID
   * @param {string} guildName - The guild name
   * @returns {Promise<Object>} - The server configuration
   */
  static async getOrCreateConfig(guildId, guildName) {
    try {
      // Find existing server config
      const serverConfig = await new Promise((resolve, reject) => {
        db.serverConfig.findOne({ guildId }, (err, doc) => {
          if (err) return reject(err);
          resolve(doc);
        });
      });
      
      // Return existing config if found
      if (serverConfig) {
        return serverConfig;
      }
      
      // Create default configuration
      const newConfig = {
        guildId,
        guildName,
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
        },
        featureToggles: {
          moderationCommands: true,
          automod: true,
          logging: true,
          customResponses: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Insert the new configuration
      const createdConfig = await new Promise((resolve, reject) => {
        db.serverConfig.insert(newConfig, (err, doc) => {
          if (err) return reject(err);
          resolve(doc);
        });
      });
      
      console.log(`Created default configuration for guild: ${guildName} (${guildId})`);
      return createdConfig;
    } catch (error) {
      console.error(`Error in getOrCreateConfig for guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Update a server's configuration
   * @param {string} guildId - The guild ID
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Object>} - The updated server configuration
   */
  static async updateConfig(guildId, updates) {
    try {
      // First make sure the config exists
      const existingConfig = await this.getOrCreateConfig(guildId);
      
      // Prepare update data with timestamp
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      // Update the configuration
      await new Promise((resolve, reject) => {
        db.serverConfig.update(
          { guildId }, 
          { $set: updateData }, 
          {}, 
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });
      
      // Get the updated config
      const updatedConfig = await this.getOrCreateConfig(guildId);
      return updatedConfig;
    } catch (error) {
      console.error(`Error in updateConfig for guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Toggle feature on/off
   * @param {string} guildId - The guild ID
   * @param {string} feature - The feature to toggle (moderationCommands, automod, logging, customResponses)
   * @param {boolean} enabled - Whether to enable or disable the feature
   * @returns {Promise<Object>} - The updated server configuration
   */
  static async toggleFeature(guildId, feature, enabled) {
    try {
      // Get current config
      const serverConfig = await this.getOrCreateConfig(guildId);
      
      // Initialize featureToggles if it doesn't exist
      const featureToggles = serverConfig.featureToggles || {
        moderationCommands: true,
        automod: true,
        logging: true,
        customResponses: true
      };
      
      // Update the specified feature toggle
      featureToggles[feature] = enabled;
      
      // Update the configuration
      return await this.updateConfig(guildId, { featureToggles });
    } catch (error) {
      console.error(`Error in toggleFeature for guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Set command permissions for a guild
   * @param {string} guildId - The guild ID
   * @param {string} command - The command name
   * @param {Array<string>} roleIds - Array of role IDs allowed to use the command
   * @returns {Promise<Object>} - The updated server configuration
   */
  static async setCommandPermissions(guildId, command, roleIds) {
    try {
      // First ensure the config exists
      await this.getOrCreateConfig(guildId);
      
      // Get current configuration
      const serverConfig = await new Promise((resolve, reject) => {
        db.serverConfig.findOne({ guildId }, (err, doc) => {
          if (err) return reject(err);
          resolve(doc || {});
        });
      });
      
      // Create commandConfig and permissions if they don't exist
      if (!serverConfig.commandConfig) {
        serverConfig.commandConfig = {};
      }
      
      if (!serverConfig.commandConfig.permissions) {
        serverConfig.commandConfig.permissions = {};
      }
      
      // Use a plain object instead of Map
      serverConfig.commandConfig.permissions[command] = roleIds;
      
      // Update the configuration
      const updateData = {
        commandConfig: serverConfig.commandConfig,
        updatedAt: new Date()
      };
      
      await new Promise((resolve, reject) => {
        db.serverConfig.update(
          { guildId }, 
          { $set: updateData }, 
          {}, 
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });
      
      // Return the updated configuration
      return await this.getOrCreateConfig(guildId);
    } catch (error) {
      console.error(`Error in setCommandPermissions for guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Setup logging for a guild
   * @param {string} guildId - The guild ID
   * @param {string} logType - The type of log (moderation, message, voice, etc.)
   * @param {string} channelId - The channel ID for logs
   * @returns {Promise<Object>} - The updated server configuration
   */
  static async setLogChannel(guildId, logType, channelId) {
    try {
      // Get current config
      const serverConfig = await this.getOrCreateConfig(guildId);
      
      // Initialize loggingConfig if it doesn't exist
      let loggingConfig = serverConfig.loggingConfig || { enabled: true, channels: {} };
      
      // Set the channel for the specified log type
      loggingConfig.channels[logType] = channelId;
      
      // Update the configuration
      return await this.updateConfig(guildId, { loggingConfig });
    } catch (error) {
      console.error(`Error in setLogChannel for guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Set the auto-moderation configuration
   * @param {string} guildId - The guild ID
   * @param {Object} automodSettings - The automod settings to apply
   * @returns {Promise<Object>} - The updated server configuration
   */
  static async setAutomodConfig(guildId, automodSettings) {
    try {
      // Get current config
      const serverConfig = await this.getOrCreateConfig(guildId);
      
      // Prepare automod config with existing settings or defaults
      const automodConfig = {
        ...(serverConfig.automodConfig || {}),
        ...automodSettings
      };
      
      // Update the configuration
      return await this.updateConfig(guildId, { automodConfig });
    } catch (error) {
      console.error(`Error in setAutomodConfig for guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Get the warning threshold action for a specific warning count
   * @param {string} guildId - The guild ID
   * @param {number} warningCount - The current warning count
   * @returns {Promise<Object|null>} - The threshold action or null
   */
  static async getWarningThresholdAction(guildId, warningCount) {
    try {
      // Get current config
      const serverConfig = await this.getOrCreateConfig(guildId);
      
      // Check if moderation config and thresholds exist
      if (!serverConfig.moderationConfig || 
          !serverConfig.moderationConfig.warningThresholds || 
          !serverConfig.moderationConfig.warningThresholds.length) {
        return null;
      }
      
      // Find the highest threshold that is less than or equal to the current warning count
      const thresholds = serverConfig.moderationConfig.warningThresholds;
      let applicableThreshold = null;
      
      // Sort thresholds in descending order to find the highest applicable threshold
      const sortedThresholds = [...thresholds].sort((a, b) => b.count - a.count);
      
      for (const threshold of sortedThresholds) {
        if (warningCount >= threshold.count) {
          applicableThreshold = threshold;
          break;
        }
      }
      
      return applicableThreshold;
    } catch (error) {
      console.error(`Error in getWarningThresholdAction for guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Get a list of all server configurations
   * @returns {Promise<Array>} - Array of server configurations
   */
  static async getAllConfigs() {
    try {
      return await new Promise((resolve, reject) => {
        db.serverConfig.find({}, (err, docs) => {
          if (err) return reject(err);
          resolve(docs || []);
        });
      });
    } catch (error) {
      console.error('Error in getAllConfigs:', error);
      throw error;
    }
  }

  /**
   * Get activity metrics for a guild
   * @param {string} guildId - The guild ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} - Activity metrics
   */
  static async getActivityMetrics(guildId, days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // In a real implementation, we would query activity logs
      // For this example, we'll return mock data
      return {
        messageCount: 250,
        activeUsers: 45,
        commandsUsed: 30,
        moderationActions: 12
      };
    } catch (error) {
      console.error(`Error in getActivityMetrics for guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a server configuration
   * @param {string} guildId - The guild ID
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  static async deleteConfig(guildId) {
    try {
      return await new Promise((resolve, reject) => {
        db.serverConfig.remove({ guildId }, {}, (err, numRemoved) => {
          if (err) return reject(err);
          resolve(numRemoved > 0);
        });
      });
    } catch (error) {
      console.error(`Error in deleteConfig for guild ${guildId}:`, error);
      throw error;
    }
  }
}

module.exports = ServerConfigService; 