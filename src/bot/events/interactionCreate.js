const { Events } = require('discord.js');
const { ServerConfigService, hasCommandPermission, errorEmbed } = require('../utils');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Only handle command interactions
    if (!interaction.isChatInputCommand()) return;

    // Get the command
    const command = interaction.client.commands.get(interaction.commandName);

    // Command does not exist
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      // Get server config for the guild
      let serverConfig = interaction.client.serverConfigs.get(interaction.guildId);
      
      // Create or fetch config if not cached
      if (!serverConfig) {
        serverConfig = await ServerConfigService.getOrCreateConfig(
          interaction.guildId,
          interaction.guild.name
        );
        interaction.client.serverConfigs.set(interaction.guildId, serverConfig);
      }

      // Initialize default properties if they don't exist
      if (!serverConfig.featureToggles) {
        // Create the default feature toggles
        const defaultToggles = {
          moderationCommands: true,
          automod: true,
          logging: true,
          customResponses: true
        };
        
        // Update the server config in the database
        serverConfig = await ServerConfigService.updateConfig(
          interaction.guildId, 
          { featureToggles: defaultToggles }
        );
        
        // Update cache
        interaction.client.serverConfigs.set(interaction.guildId, serverConfig);
      }

      // Check if user has permission to use the command
      if (!hasCommandPermission(interaction.member, interaction.commandName, serverConfig)) {
        await interaction.reply({
          embeds: [errorEmbed('You do not have permission to use this command.')],
          ephemeral: true
        });
        return;
      }

      // Check if feature is enabled for this server
      const isModCommand = ['ban', 'kick', 'mute', 'unmute', 'warn', 'clear', 'addrole', 'removerole', 'modlog'].includes(interaction.commandName);
      if (isModCommand && serverConfig.featureToggles && !serverConfig.featureToggles.moderationCommands) {
        await interaction.reply({
          embeds: [errorEmbed('Moderation commands are disabled in this server.')],
          ephemeral: true
        });
        return;
      }

      // Execute the command
      await command.execute(interaction, serverConfig);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}`);
      console.error(error);
      
      // Send error message if the interaction can be replied to
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          embeds: [errorEmbed('There was an error while executing this command!')],
          ephemeral: true
        });
      } else {
        await interaction.reply({
          embeds: [errorEmbed('There was an error while executing this command!')],
          ephemeral: true
        });
      }
    }
  }
}; 