const ModerationService = require('./moderationService');
const { errorEmbed } = require('./embed');

/**
 * Service for handling automoderation features
 */
class AutomodService {
  /**
   * Process a message for automod features
   * @param {Object} message - The Discord message
   * @param {Object} serverConfig - The server configuration
   * @param {Object} client - The Discord client
   * @returns {Promise<boolean>} - Whether any automod action was taken
   */
  static async processMessage(message, serverConfig, client) {
    // Skip if message is from a bot or automod is disabled
    if (message.author.bot || !serverConfig?.automodConfig?.enabled || 
        !serverConfig?.featureToggles?.automod) {
      return false;
    }

    // Check if automod should be applied in this channel
    // TODO: Implement channel whitelist/blacklist checks if needed

    // Apply automod checks in order
    try {
      // Check for banned words
      if (await this.checkBannedWords(message, serverConfig, client)) {
        return true;
      }
      
      // Check for spam
      if (await this.checkSpam(message, serverConfig, client)) {
        return true;
      }
      
      // Check for mention spam
      if (await this.checkMentionSpam(message, serverConfig, client)) {
        return true;
      }
      
      // Check for link spam
      if (await this.checkLinkSpam(message, serverConfig, client)) {
        return true;
      }
    } catch (error) {
      console.error('Automod processing error:', error);
    }
    
    return false;
  }

  /**
   * Check for banned words in a message
   * @param {Object} message - The Discord message
   * @param {Object} serverConfig - The server configuration
   * @param {Object} client - The Discord client
   * @returns {Promise<boolean>} - Whether action was taken
   */
  static async checkBannedWords(message, serverConfig, client) {
    const bannedWordsConfig = serverConfig?.automodConfig?.bannedWords;
    
    if (!bannedWordsConfig?.enabled) {
      return false;
    }
    
    const content = message.content.toLowerCase();
    let triggered = false;
    let matchedWord = null;
    
    // Check exact words
    if (bannedWordsConfig.words && bannedWordsConfig.words.length > 0) {
      for (const word of bannedWordsConfig.words) {
        const wordLower = word.toLowerCase();
        // Match if word is found with word boundaries (not as part of other words)
        if (content.includes(wordLower) && 
            (content === wordLower || 
             content.match(new RegExp(`\\b${this.escapeRegExp(wordLower)}\\b`, 'i')))) {
          triggered = true;
          matchedWord = word;
          break;
        }
      }
    }
    
    // Check regex patterns
    if (!triggered && bannedWordsConfig.regex && bannedWordsConfig.regex.length > 0) {
      for (const pattern of bannedWordsConfig.regex) {
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(content)) {
            triggered = true;
            matchedWord = pattern;
            break;
          }
        } catch (e) {
          console.error(`Invalid regex pattern in automod: ${pattern}`, e);
        }
      }
    }
    
    if (triggered) {
      return await this.applyAction({
        message, 
        action: bannedWordsConfig.action,
        trigger: 'banned-word',
        reason: `Message contained banned word/pattern: ${matchedWord}`,
        serverConfig,
        client
      });
    }
    
    return false;
  }

  /**
   * Check for spam messages
   * @param {Object} message - The Discord message
   * @param {Object} serverConfig - The server configuration
   * @param {Object} client - The Discord client
   * @returns {Promise<boolean>} - Whether action was taken
   */
  static async checkSpam(message, serverConfig, client) {
    const antiSpamConfig = serverConfig?.automodConfig?.antiSpam;
    
    if (!antiSpamConfig?.enabled) {
      return false;
    }

    const userId = message.author.id;
    const channelId = message.channel.id;
    
    // Create static cache if it doesn't exist
    if (!this.spamCache) {
      this.spamCache = new Map();
    }
    
    const key = `${userId}-${channelId}`;
    const now = Date.now();
    
    if (!this.spamCache.has(key)) {
      this.spamCache.set(key, {
        messages: [now],
        lastMessageContent: message.content
      });
      return false;
    }
    
    const userData = this.spamCache.get(key);
    const messageThreshold = antiSpamConfig.messageThreshold || 5;
    const timeThreshold = antiSpamConfig.timeThreshold || 5000; // 5 seconds
    
    // Add current message timestamp
    userData.messages.push(now);
    
    // Remove old timestamps outside our time window
    userData.messages = userData.messages.filter(timestamp => now - timestamp < timeThreshold);
    
    // Detect duplicate message spam
    const isDuplicateSpam = userData.lastMessageContent === message.content && 
                           userData.messages.length >= 3;
    
    // Update last message content
    userData.lastMessageContent = message.content;
    this.spamCache.set(key, userData);
    
    // Check if message count exceeds threshold or if duplicate spam
    if (userData.messages.length >= messageThreshold || isDuplicateSpam) {
      // Clear the user's spam cache after triggering
      this.spamCache.delete(key);
      
      return await this.applyAction({
        message, 
        action: antiSpamConfig.action,
        trigger: 'spam',
        reason: `User sent ${userData.messages.length} messages in ${timeThreshold/1000} seconds${isDuplicateSpam ? ' (duplicate content)' : ''}`,
        serverConfig,
        client
      });
    }
    
    return false;
  }

  /**
   * Check for mention spam in a message
   * @param {Object} message - The Discord message
   * @param {Object} serverConfig - The server configuration
   * @param {Object} client - The Discord client
   * @returns {Promise<boolean>} - Whether action was taken
   */
  static async checkMentionSpam(message, serverConfig, client) {
    const mentionSpamConfig = serverConfig?.automodConfig?.antimentionSpam;
    
    if (!mentionSpamConfig?.enabled) {
      return false;
    }
    
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    const mentionThreshold = mentionSpamConfig.mentionThreshold || 5;
    
    if (mentionCount >= mentionThreshold) {
      return await this.applyAction({
        message, 
        action: mentionSpamConfig.action,
        trigger: 'mention-spam',
        reason: `Message contained ${mentionCount} mentions (threshold: ${mentionThreshold})`,
        serverConfig,
        client
      });
    }
    
    return false;
  }

  /**
   * Check for link spam in a message
   * @param {Object} message - The Discord message
   * @param {Object} serverConfig - The server configuration
   * @param {Object} client - The Discord client
   * @returns {Promise<boolean>} - Whether action was taken
   */
  static async checkLinkSpam(message, serverConfig, client) {
    const linkSpamConfig = serverConfig?.automodConfig?.antiLinkSpam;
    
    if (!linkSpamConfig?.enabled) {
      return false;
    }
    
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = message.content.match(urlRegex);
    
    if (!matches || matches.length === 0) {
      return false;
    }
    
    // Check if any of the links are whitelisted
    if (linkSpamConfig.whitelistedDomains && linkSpamConfig.whitelistedDomains.length > 0) {
      let allLinksWhitelisted = true;
      
      for (const url of matches) {
        try {
          const domain = new URL(url).hostname;
          const isWhitelisted = linkSpamConfig.whitelistedDomains.some(whitelistedDomain => 
            domain === whitelistedDomain || domain.endsWith(`.${whitelistedDomain}`)
          );
          
          if (!isWhitelisted) {
            allLinksWhitelisted = false;
            break;
          }
        } catch (e) {
          // Invalid URL, continue checking
          allLinksWhitelisted = false;
          break;
        }
      }
      
      if (allLinksWhitelisted) {
        return false;
      }
    }
    
    return await this.applyAction({
      message, 
      action: linkSpamConfig.action,
      trigger: 'link-spam',
      reason: `Message contained ${matches.length} non-whitelisted links`,
      serverConfig,
      client
    });
  }

  /**
   * Apply an automod action to a message
   * @param {Object} options - The action options
   * @param {Object} options.message - The Discord message
   * @param {string} options.action - The action to take (delete, warn, mute, kick, ban)
   * @param {string} options.trigger - The automod trigger reason
   * @param {string} options.reason - The reason for the action
   * @param {Object} options.serverConfig - The server configuration
   * @param {Object} options.client - The Discord client
   * @returns {Promise<boolean>} - Whether the action was successfully applied
   */
  static async applyAction(options) {
    const { message, action, trigger, reason, serverConfig, client } = options;
    
    try {
      // Always delete the offending message
      if (message.deletable) {
        await message.delete();
      }
      
      if (action === 'delete') {
        // Just delete the message, no further action needed
        return true;
      }
      
      // Take appropriate moderation action
      const target = message.author;
      const moderator = client.user;
      const guildId = message.guild.id;
      
      switch (action) {
        case 'warn':
          // Log a warning in the database
          await ModerationService.logAction({
            guildId,
            target,
            moderator,
            type: 'warn',
            reason,
            isAutomod: true,
            automodTrigger: trigger,
            client,
            serverConfig
          });
          
          // Check if warning threshold has been reached
          await ModerationService.checkWarningThresholds({
            guildId,
            targetId: target.id,
            target,
            moderator,
            serverConfig,
            client,
            guild: message.guild
          });
          
          // Try to notify the user about the warning
          try {
            await message.author.send({
              embeds: [errorEmbed(`Your message was removed for violating server rules. Reason: ${reason}`)]
            });
          } catch (e) {
            // Couldn't DM the user, ignore
          }
          break;
          
        case 'mute':
          // Try to mute the user (timeout)
          try {
            const member = await message.guild.members.fetch(target.id);
            if (member && member.moderatable) {
              // Default timeout: 10 minutes
              await member.timeout(10 * 60 * 1000, reason);
              
              await ModerationService.logAction({
                guildId,
                target,
                moderator,
                type: 'mute',
                reason,
                duration: 10 * 60 * 1000,
                isAutomod: true,
                automodTrigger: trigger,
                client,
                serverConfig
              });
              
              // Try to notify the user
              try {
                await message.author.send({
                  embeds: [errorEmbed(`You have been muted for 10 minutes. Reason: ${reason}`)]
                });
              } catch (e) {
                // Couldn't DM the user, ignore
              }
            }
          } catch (e) {
            console.error('Error applying automod mute:', e);
          }
          break;
          
        case 'kick':
          // Try to kick the user
          try {
            const member = await message.guild.members.fetch(target.id);
            if (member && member.kickable) {
              // Try to notify the user before kicking
              try {
                await message.author.send({
                  embeds: [errorEmbed(`You have been kicked from the server. Reason: ${reason}`)]
                });
              } catch (e) {
                // Couldn't DM the user, ignore
              }
              
              await member.kick(reason);
              
              await ModerationService.logAction({
                guildId,
                target,
                moderator,
                type: 'kick',
                reason,
                isAutomod: true,
                automodTrigger: trigger,
                client,
                serverConfig
              });
            }
          } catch (e) {
            console.error('Error applying automod kick:', e);
          }
          break;
          
        case 'ban':
          // Try to ban the user
          try {
            // Try to notify the user before banning
            try {
              await message.author.send({
                embeds: [errorEmbed(`You have been banned from the server. Reason: ${reason}`)]
              });
            } catch (e) {
              // Couldn't DM the user, ignore
            }
            
            await message.guild.members.ban(target.id, { reason });
            
            await ModerationService.logAction({
              guildId,
              target,
              moderator,
              type: 'ban',
              reason,
              isAutomod: true,
              automodTrigger: trigger,
              client,
              serverConfig
            });
          } catch (e) {
            console.error('Error applying automod ban:', e);
          }
          break;
      }
      
      return true;
    } catch (error) {
      console.error('Error applying automod action:', error);
      return false;
    }
  }

  /**
   * Escape special characters in a string for use in a regular expression
   * @param {string} string - The string to escape
   * @returns {string} - The escaped string
   */
  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Initialize static properties
AutomodService.spamCache = new Map();

module.exports = AutomodService;