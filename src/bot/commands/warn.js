const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, warningEmbed, ModerationService } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a warning to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the warning')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, serverConfig) {
    // Get options
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Cannot warn bots
    if (user.bot) {
      return await interaction.reply({
        embeds: [errorEmbed('You cannot warn bots.')],
        ephemeral: true
      });
    }
    
    // Cannot warn yourself
    if (user.id === interaction.user.id) {
      return await interaction.reply({
        embeds: [errorEmbed('You cannot warn yourself.')],
        ephemeral: true
      });
    }
    
    // Defer reply since this might take a moment
    await interaction.deferReply();
    
    try {
      // Check if the user is a member of the guild
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      
      // If user is in guild, check permissions
      if (member) {
        // Check if the target has a higher role than the command user
        if (member.roles.highest.position >= interaction.member.roles.highest.position && 
            interaction.user.id !== interaction.guild.ownerId) {
          return await interaction.editReply({
            embeds: [errorEmbed(`You don't have permission to warn ${user.tag}. They have a higher or equal role.`)]
          });
        }
      }
      
      // Log the warning
      await ModerationService.logAction({
        guildId: interaction.guild.id,
        target: user,
        moderator: interaction.user,
        type: 'warn',
        reason,
        client: interaction.client,
        serverConfig
      });
      
      // Get the user's warning count
      const warningCount = await ModerationService.getWarningCount(interaction.guild.id, user.id);
      
      // Check if warning threshold is reached and automatic action should be taken
      const thresholdAction = await ModerationService.checkWarningThresholds({
        guildId: interaction.guild.id,
        targetId: user.id,
        target: user,
        moderator: interaction.user,
        serverConfig,
        client: interaction.client,
        guild: interaction.guild
      });
      
      // Send warning message to user
      if (member) {
        try {
          await user.send({
            embeds: [warningEmbed(`You have received a warning in **${interaction.guild.name}**.\nReason: ${reason}\nWarning count: ${warningCount}`)]
          });
        } catch (dmError) {
          console.log(`Could not send DM to ${user.tag}`);
        }
      }
      
      // Send success message
      let successMessage = `Successfully warned ${user.tag}: ${reason} (Warning #${warningCount})`;
      
      // If an automatic action was taken due to warning threshold
      if (thresholdAction) {
        successMessage += `\nWarning threshold reached! Automatic ${thresholdAction.type} has been applied.`;
      }
      
      await interaction.editReply({
        embeds: [successEmbed(successMessage)]
      });
    } catch (error) {
      console.error('Error executing warn command:', error);
      await interaction.editReply({
        embeds: [errorEmbed(`Failed to warn user: ${error.message}`)]
      });
    }
  },
}; 