const { Events } = require('discord.js');
const { AutomodService, ServerConfigService } = require('../utils');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore DMs, system messages, webhooks, and bot messages
    if (!message.guild || message.system || message.webhookId || message.author.bot) {
      return;
    }

    try {
      // Get server config for the guild
      let serverConfig = message.client.serverConfigs.get(message.guild.id);
      
      // Create or fetch config if not cached
      if (!serverConfig) {
        serverConfig = await ServerConfigService.getOrCreateConfig(
          message.guild.id,
          message.guild.name
        );
        message.client.serverConfigs.set(message.guild.id, serverConfig);
      }

      // Process the message through automod
      await AutomodService.processMessage(message, serverConfig, message.client);
    } catch (error) {
      console.error('Error processing message for automod:', error);
    }
  }
}; 