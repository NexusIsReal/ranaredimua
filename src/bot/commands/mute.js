const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, ModerationService } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Temporarily mute a member')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to mute')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('The duration of the mute (1m, 1h, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the mute')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, serverConfig) {
    // Get options
    const user = interaction.options.getUser('user');
    const durationInput = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Parse duration
    const duration = parseDuration(durationInput);
    
    if (!duration) {
      return await interaction.reply({
        embeds: [errorEmbed(`Invalid duration format. Please use a valid format like "1m", "1h", or "1d".`)],
        ephemeral: true
      });
    }
    
    // Maximum timeout duration is 28 days
    if (duration > 28 * 24 * 60 * 60 * 1000) {
      return await interaction.reply({
        embeds: [errorEmbed(`Timeout duration cannot exceed 28 days.`)],
        ephemeral: true
      });
    }
    
    // Defer reply since this might take a moment
    await interaction.deferReply();
    
    try {
      // Check if the user is a member of the guild
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      
      if (!member) {
        return await interaction.editReply({
          embeds: [errorEmbed(`${user.tag} is not a member of this server.`)]
        });
      }
      
      // Check if the bot can timeout the user
      if (!member.moderatable) {
        return await interaction.editReply({
          embeds: [errorEmbed(`I don't have permission to mute ${user.tag}. They may have a higher role than me.`)]
        });
      }
      
      // Check if the target has a higher role than the command user
      if (member.roles.highest.position >= interaction.member.roles.highest.position && 
          interaction.user.id !== interaction.guild.ownerId) {
        return await interaction.editReply({
          embeds: [errorEmbed(`You don't have permission to mute ${user.tag}. They have a higher or equal role.`)]
        });
      }
      
      // Apply the timeout
      await member.timeout(duration, reason);
      
      // Format duration for display
      const formattedDuration = formatDuration(duration);
      
      // Log the action
      await ModerationService.logAction({
        guildId: interaction.guild.id,
        target: user,
        moderator: interaction.user,
        type: 'mute',
        reason,
        duration,
        client: interaction.client,
        serverConfig
      });
      
      // Send success message
      await interaction.editReply({
        embeds: [successEmbed(`Successfully muted ${user.tag} for ${formattedDuration}: ${reason}`)]
      });
    } catch (error) {
      console.error('Error executing mute command:', error);
      await interaction.editReply({
        embeds: [errorEmbed(`Failed to mute user: ${error.message}`)]
      });
    }
  },
};

/**
 * Parse a duration string into milliseconds
 * @param {string} durationString - Duration string (e.g., "1m", "1h", "1d")
 * @returns {number|null} - Duration in milliseconds or null if invalid
 */
function parseDuration(durationString) {
  const match = durationString.match(/^(\d+)([mhd])$/);
  
  if (!match) {
    return null;
  }
  
  const [, amount, unit] = match;
  const value = parseInt(amount, 10);
  
  switch (unit) {
    case 'm': return value * 60 * 1000; // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    default: return null;
  }
}

/**
 * Format a duration in milliseconds to a human-readable string
 * @param {number} duration - Duration in milliseconds
 * @returns {string} - Formatted duration string
 */
function formatDuration(duration) {
  const minutes = Math.floor(duration / (60 * 1000));
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
} 