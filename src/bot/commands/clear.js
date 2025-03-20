const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Delete a specified number of messages in a channel')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('The number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, serverConfig) {
    // Get options
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');
    
    // Defer reply (ephemeral to keep the channel clean)
    await interaction.deferReply({ ephemeral: true });
    
    try {
      // Fetch messages
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      
      // Filter messages based on criteria
      let messagesToDelete = messages.filter(msg => {
        // Messages must be less than 14 days old (Discord limitation)
        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const isRecent = msg.createdTimestamp > twoWeeksAgo;
        
        // Filter by user if specified
        const isFromUser = user ? msg.author.id === user.id : true;
        
        return isRecent && isFromUser;
      });
      
      // Limit to the specified amount
      messagesToDelete = messagesToDelete.first(amount);
      
      // Check if there are any messages to delete
      if (messagesToDelete.length === 0) {
        return await interaction.editReply({
          embeds: [errorEmbed(`No recent messages${user ? ` from ${user.tag}` : ''} found to delete.`)]
        });
      }
      
      // Perform the deletion
      const deletedCount = await interaction.channel.bulkDelete(messagesToDelete, true)
        .then(deleted => deleted.size);
      
      // Build success message
      let successMessage = `Successfully deleted ${deletedCount} message${deletedCount !== 1 ? 's' : ''}`;
      if (user) {
        successMessage += ` from ${user.tag}`;
      }
      
      await interaction.editReply({
        embeds: [successEmbed(successMessage)]
      });
    } catch (error) {
      console.error('Error executing clear command:', error);
      
      // Handle specific errors
      if (error.code === 10008) {
        // Unknown Message error - probably due to race condition
        await interaction.editReply({
          embeds: [errorEmbed('An error occurred. Some messages may have been deleted.')]
        });
      } else {
        await interaction.editReply({
          embeds: [errorEmbed(`Error: ${error.message}`)]
        });
      }
    }
  },
}; 