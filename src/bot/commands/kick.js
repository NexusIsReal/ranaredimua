const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, ModerationService } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the kick')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

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
      
      // Check if the bot can kick the user
      if (!member.kickable) {
        return await interaction.editReply({
          embeds: [errorEmbed(`I don't have permission to kick ${user.tag}. They may have a higher role than me.`)]
        });
      }
      
      // Check if the target has a higher role than the command user
      if (member.roles.highest.position >= interaction.member.roles.highest.position && 
          interaction.user.id !== interaction.guild.ownerId) {
        return await interaction.editReply({
          embeds: [errorEmbed(`You don't have permission to kick ${user.tag}. They have a higher or equal role.`)]
        });
      }
      
      // Perform the kick
      await member.kick(reason);
      
      // Log the action
      await ModerationService.logAction({
        guildId: interaction.guild.id,
        target: user,
        moderator: interaction.user,
        type: 'kick',
        reason,
        client: interaction.client,
        serverConfig
      });
      
      // Send success message
      await interaction.editReply({
        embeds: [successEmbed(`Successfully kicked ${user.tag}: ${reason}`)]
      });
    } catch (error) {
      console.error('Error executing kick command:', error);
      await interaction.editReply({
        embeds: [errorEmbed(`Failed to kick user: ${error.message}`)]
      });
    }
  },
}; 