const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Add a role to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to give the role to')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to give')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for adding the role')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction, serverConfig) {
    // Get options
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Defer reply since this might take a moment
    await interaction.deferReply();
    
    try {
      // Check if the role is manageable
      if (!role.editable) {
        return await interaction.editReply({
          embeds: [errorEmbed(`I don't have permission to assign the role ${role.name}. It may be higher than my highest role.`)]
        });
      }
      
      // Check if the role is higher than the command user's highest role
      if (role.position >= interaction.member.roles.highest.position && 
          interaction.user.id !== interaction.guild.ownerId) {
        return await interaction.editReply({
          embeds: [errorEmbed(`You cannot assign the role ${role.name} as it is higher than or equal to your highest role.`)]
        });
      }
      
      // Get member
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      
      if (!member) {
        return await interaction.editReply({
          embeds: [errorEmbed(`${user.tag} is not a member of this server.`)]
        });
      }
      
      // Check if member already has the role
      if (member.roles.cache.has(role.id)) {
        return await interaction.editReply({
          embeds: [errorEmbed(`${user.tag} already has the role ${role.name}.`)]
        });
      }
      
      // Add the role
      await member.roles.add(role, reason);
      
      // Send success message
      await interaction.editReply({
        embeds: [successEmbed(`Successfully added the role ${role.name} to ${user.tag}.`)]
      });
    } catch (error) {
      console.error('Error executing addrole command:', error);
      await interaction.editReply({
        embeds: [errorEmbed(`Failed to add role: ${error.message}`)]
      });
    }
  },
};