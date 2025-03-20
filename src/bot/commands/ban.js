const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, ModerationService } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the ban')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('delete-messages')
        .setDescription('Delete recent messages from this user')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, serverConfig) {
    // Get options
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteMessages = interaction.options.getBoolean('delete-messages') || false;
    
    // Defer reply since this might take a moment
    await interaction.deferReply();
    
    try {
      // Check if the target is a guild member
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      
      // If the user is in the guild, check if they're bannable
      if (member) {
        // Check if the user is higher in the role hierarchy
        if (!member.bannable) {
          return await interaction.editReply({
            embeds: [errorEmbed(`I don't have permission to ban ${user.tag}. They may have a higher role than me.`)]
          });
        }
        
        // Check if the target has a higher role than the command user
        if (member.roles.highest.position >= interaction.member.roles.highest.position && 
            interaction.user.id !== interaction.guild.ownerId) {
          return await interaction.editReply({
            embeds: [errorEmbed(`You don't have permission to ban ${user.tag}. They have a higher or equal role.`)]
          });
        }
      }
      
      // Perform the ban
      const banOptions = { reason };
      if (deleteMessages) {
        // If true, delete the last 7 days of messages
        banOptions.deleteMessageSeconds = 7 * 24 * 60 * 60;
      }
      
      await interaction.guild.members.ban(user.id, banOptions);
      
      // Log the action
      await ModerationService.logAction({
        guildId: interaction.guild.id,
        target: user,
        moderator: interaction.user,
        type: 'ban',
        reason,
        client: interaction.client,
        serverConfig
      });
      
      // Send success message
      await interaction.editReply({
        embeds: [successEmbed(`Successfully banned ${user.tag}: ${reason}`)]
      });
    } catch (error) {
      console.error('Error executing ban command:', error);
      await interaction.editReply({
        embeds: [errorEmbed(`Failed to ban user: ${error.message}`)]
      });
    }
  },
}; 