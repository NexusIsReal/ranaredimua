const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { ModerationService, errorEmbed } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlog')
    .setDescription('View a user\'s moderation history')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, serverConfig) {
    // Get options
    const user = interaction.options.getUser('user');
    
    // Defer reply since this might take a moment
    await interaction.deferReply();
    
    try {
      // Get the user's moderation history
      const history = await ModerationService.getUserHistory(interaction.guild.id, user.id);
      
      if (history.length === 0) {
        return await interaction.editReply({
          embeds: [errorEmbed(`${user.tag} has no moderation history.`)]
        });
      }
      
      // Create embed for moderation history
      const embed = new EmbedBuilder()
        .setTitle(`Moderation History for ${user.tag}`)
        .setColor(serverConfig?.embedConfig?.color || '#5865F2')
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: `User ID: ${user.id}` })
        .setTimestamp();
      
      // Recent warnings count
      const activeWarnings = history.filter(action => 
        action.type === 'warn' && action.isActive
      ).length;
      
      embed.addFields({ name: 'Active Warnings', value: activeWarnings.toString(), inline: true });
      embed.addFields({ name: 'Total Infractions', value: history.length.toString(), inline: true });
      
      // Add the 10 most recent actions
      const recentActions = history.slice(0, 10);
      let historyText = '';
      
      for (const action of recentActions) {
        const actionDate = new Date(action.createdAt).toLocaleDateString();
        const actionType = action.type.charAt(0).toUpperCase() + action.type.slice(1);
        const modName = action.moderatorUsername;
        
        let actionEntry = `**${actionType}** | ${actionDate} | By: ${modName}\n`;
        actionEntry += `Reason: ${action.reason}\n`;
        
        if (action.duration) {
          const minutes = Math.floor(action.duration / 60000);
          let duration = '';
          
          if (minutes < 60) {
            duration = `${minutes}m`;
          } else if (minutes < 1440) {
            duration = `${Math.floor(minutes / 60)}h`;
          } else {
            duration = `${Math.floor(minutes / 1440)}d`;
          }
          
          actionEntry += `Duration: ${duration}\n`;
        }
        
        if (historyText.length + actionEntry.length > 1000) {
          historyText += `\n*...and ${history.length - recentActions.length} more actions...*`;
          break;
        }
        
        historyText += actionEntry + '\n';
      }
      
      embed.setDescription(historyText || 'No recent actions');
      
      // Send the embed
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing modlog command:', error);
      await interaction.editReply({
        embeds: [errorEmbed(`Failed to fetch moderation history: ${error.message}`)]
      });
    }
  },
}; 