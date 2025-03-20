const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get information about commands')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Get detailed information about a specific command')
        .setRequired(false)),

  async execute(interaction, serverConfig) {
    const commandName = interaction.options.getString('command');
    
    // If a specific command is requested
    if (commandName) {
      return await showCommandHelp(interaction, commandName, serverConfig);
    }
    
    // Otherwise, show all commands
    return await showAllCommands(interaction, serverConfig);
  },
};

/**
 * Show help for a specific command
 * @param {Object} interaction - The interaction object
 * @param {string} commandName - The name of the command
 * @param {Object} serverConfig - The server configuration
 */
async function showCommandHelp(interaction, commandName, serverConfig) {
  // Get the command
  const command = interaction.client.commands.get(commandName);
  
  if (!command) {
    const embed = createEmbed({
      title: 'Command Not Found',
      description: `The command \`/${commandName}\` does not exist.`,
      color: '#F04747',
      serverConfig
    });
    
    return await interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  // Get command description
  const description = command.data.description;
  
  // Get command options
  const options = command.data.options.map(option => {
    const required = option.required ? '(required)' : '(optional)';
    return `\`${option.name}\` - ${option.description} ${required}`;
  });
  
  const embed = createEmbed({
    title: `Command: /${commandName}`,
    description,
    fields: [
      {
        name: 'Options',
        value: options.length ? options.join('\n') : 'No options'
      }
    ],
    serverConfig
  });
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Show all available commands
 * @param {Object} interaction - The interaction object
 * @param {Object} serverConfig - The server configuration
 */
async function showAllCommands(interaction, serverConfig) {
  // Group commands by category
  const categories = {
    'Moderation': [],
    'Utility': [],
    'Configuration': []
  };
  
  // Map commands to their categories
  const commands = interaction.client.commands.map(cmd => {
    const name = cmd.data.name;
    
    // Categorize commands
    if (['ban', 'kick', 'mute', 'unmute', 'warn', 'clear', 'modlog', 'addrole', 'removerole'].includes(name)) {
      categories['Moderation'].push(name);
    } else if (['help'].includes(name)) {
      categories['Utility'].push(name);
    } else {
      categories['Configuration'].push(name);
    }
    
    return name;
  });
  
  // Create fields for each category
  const fields = [];
  
  for (const [category, cmds] of Object.entries(categories)) {
    if (cmds.length > 0) {
      fields.push({
        name: category,
        value: cmds.map(cmd => `\`/${cmd}\``).join(', ')
      });
    }
  }
  
  const embed = createEmbed({
    title: 'Available Commands',
    description: 'Here are all the commands available. Use `/help [command]` to get detailed information about a specific command.',
    fields,
    serverConfig
  });
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
} 