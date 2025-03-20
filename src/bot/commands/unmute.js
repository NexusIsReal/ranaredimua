const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, ModerationService } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove a timeout from a member')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to unmute')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for removing the mute')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, serverConfig) {
    // Get options
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
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
      
      // Check if the member is timed out
      if (!member.communicationDisabledUntil) {
        return await interaction.editReply({
          embeds: [errorEmbed(`${user.tag} is not currently muted.`)]
        });
      }
      
      // Check if the bot can remove the timeout
      if (!member.moderatable) {
        return await interaction.editReply({
          embeds: [errorEmbed(`I don't have permission to unmute ${user.tag}. They may have a higher role than me.`)]
        });
      }
      
      // Check if the target has a higher role than the command user
      if (member.roles.highest.position >= interaction.member.roles.highest.position && 
          interaction.user.id !== interaction.guild.ownerId) {
        return await interaction.editReply({
          embeds: [errorEmbed(`You don't have permission to unmute ${user.tag}. They have a higher or equal role.`)]
        });
      }
      
      // Remove the timeout
      await member.timeout(null, reason);
      
      // Log the action
      await ModerationService.logAction({
        guildId: interaction.guild.id,
        target: user,
        moderator: interaction.user,
        type: 'unmute',
        reason,
        client: interaction.client,
        serverConfig
      });
      
      // Send success message
      await interaction.editReply({
        embeds: [successEmbed(`Successfully unmuted ${user.tag}: ${reason}`)]
      });
    } catch (error) {
      console.error('Error executing unmute command:', error);
      await interaction.editReply({
        embeds: [errorEmbed(`Failed to unmute user: ${error.message}`)]
      });
    }
  },
}; 