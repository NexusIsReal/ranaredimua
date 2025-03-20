const { db } = require('../../database');
const { moderationEmbed } = require('./embed');

/**
 * Service for handling moderation actions
 */
class ModerationService {
  /**
   * Logs a moderation action to the database and logs channel
   * @param {Object} options - The action options
   * @param {string} options.guildId - The guild ID
   * @param {Object} options.target - The target user
   * @param {Object} options.moderator - The moderator
   * @param {string} options.type - The action type (warn, mute, kick, ban, unmute, unban)
   * @param {string} options.reason - The reason for the action
   * @param {number} options.duration - The duration in milliseconds (for temporary actions)
   * @param {boolean} options.isAutomod - Whether this was triggered by automod
   * @param {string} options.automodTrigger - The automod trigger reason
   * @param {Object} options.client - The Discord client
   * @param {Object} options.serverConfig - The server config
   * @returns {Promise<Object>} - The created moderation action
   */
  static async logAction(options) {
    const {
      guildId,
      target,
      moderator,
      type,
      reason = 'No reason provided',
      duration = null,
      isAutomod = false,
      automodTrigger = null,
      client,
      serverConfig
    } = options;

    // Calculate expiration time for temporary actions
    let expiresAt = null;
    if (duration && ['mute', 'ban'].includes(type)) {
      expiresAt = new Date(Date.now() + duration);
    }

    // Create infraction object
    const infraction = {
      guildId,
      targetUserId: target.id,
      targetUsername: target.tag || `${target.username}${target.discriminator ? `#${target.discriminator}` : ''}`,
      moderatorId: moderator.id,
      moderatorUsername: moderator.tag || `${moderator.username}${moderator.discriminator ? `#${moderator.discriminator}` : ''}`,
      type,
      reason,
      duration,
      expiresAt,
      isAutomod,
      automodTrigger,
      isActive: true,
      createdAt: new Date()
    };

    // Save to database using NeDB
    const action = await new Promise((resolve, reject) => {
      db.infraction.insert(infraction, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });

    // Log to channel if configured
    const logChannelId = serverConfig?.moderationConfig?.logChannelId;
    if (logChannelId && client) {
      try {
        const logChannel = await client.channels.fetch(logChannelId);
        if (logChannel) {
          // Format duration for display
          let formattedDuration = null;
          if (duration) {
            const minutes = Math.floor(duration / 60000);
            if (minutes < 60) {
              formattedDuration = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
            } else if (minutes < 1440) {
              const hours = Math.floor(minutes / 60);
              formattedDuration = `${hours} hour${hours !== 1 ? 's' : ''}`;
            } else {
              const days = Math.floor(minutes / 1440);
              formattedDuration = `${days} day${days !== 1 ? 's' : ''}`;
            }
          }

          // Create and send embed
          const embed = moderationEmbed({
            action: type.charAt(0).toUpperCase() + type.slice(1),
            target,
            moderator,
            reason: isAutomod ? `[Automod: ${automodTrigger}] ${reason}` : reason,
            duration: formattedDuration,
            serverConfig
          });

          await logChannel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error('Error logging moderation action to channel:', error);
      }
    }

    return action;
  }

  /**
   * Gets a user's warning count in a guild
   * @param {string} guildId - The guild ID
   * @param {string} userId - The user ID
   * @returns {Promise<number>} - The warning count
   */
  static async getWarningCount(guildId, userId) {
    return new Promise((resolve, reject) => {
      db.infraction.count({
        guildId,
        targetUserId: userId,
        type: 'warn',
        isActive: true
      }, (err, count) => {
        if (err) return reject(err);
        resolve(count);
      });
    });
  }

  /**
   * Gets a user's moderation history in a guild
   * @param {string} guildId - The guild ID
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - The moderation history
   */
  static async getUserHistory(guildId, userId) {
    return new Promise((resolve, reject) => {
      db.infraction.find({
        guildId,
        targetUserId: userId
      })
      .sort({ createdAt: -1 })
      .exec((err, docs) => {
        if (err) return reject(err);
        resolve(docs || []);
      });
    });
  }

  /**
   * Checks if a warning threshold has been reached and applies the penalty
   * @param {Object} options - The options
   * @param {string} options.guildId - The guild ID
   * @param {string} options.targetId - The target user ID
   * @param {Object} options.target - The target user
   * @param {Object} options.moderator - The moderator (or client user for automod)
   * @param {Object} options.serverConfig - The server config
   * @param {Object} options.client - The Discord client
   * @param {Object} options.guild - The guild object
   * @returns {Promise<Object|null>} - The applied penalty action or null
   */
  static async checkWarningThresholds(options) {
    const {
      guildId,
      targetId,
      target,
      moderator,
      serverConfig,
      client,
      guild
    } = options;

    if (!serverConfig?.moderationConfig?.warningThresholds?.length) {
      return null;
    }

    const warningCount = await this.getWarningCount(guildId, targetId);
    
    // Find the highest threshold that has been reached
    const thresholds = serverConfig.moderationConfig.warningThresholds
      .filter(t => t.count <= warningCount)
      .sort((a, b) => b.count - a.count);

    if (thresholds.length === 0) {
      return null;
    }

    const threshold = thresholds[0];
    const reason = `Automatic action after reaching ${threshold.count} warnings`;

    let actionResult = null;

    try {
      // Attempt to find the member
      const member = await guild.members.fetch(targetId);

      // Apply the penalty based on the action type
      switch (threshold.action) {
        case 'mute':
          if (threshold.duration && member) {
            await member.timeout(threshold.duration * 60 * 1000, reason);
            actionResult = await this.logAction({
              guildId,
              target,
              moderator,
              type: 'mute',
              reason,
              duration: threshold.duration * 60 * 1000,
              client,
              serverConfig
            });
          }
          break;
          
        case 'kick':
          if (member) {
            await member.kick(reason);
            actionResult = await this.logAction({
              guildId,
              target,
              moderator,
              type: 'kick',
              reason,
              client,
              serverConfig
            });
          }
          break;
          
        case 'ban':
          await guild.members.ban(targetId, { reason });
          actionResult = await this.logAction({
            guildId,
            target,
            moderator,
            type: 'ban',
            reason,
            client,
            serverConfig
          });
          break;
      }
    } catch (error) {
      console.error(`Error applying warning threshold penalty: ${error.message}`);
    }

    return actionResult;
  }
}

module.exports = ModerationService; 