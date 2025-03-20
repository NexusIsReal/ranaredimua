const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

async function deployCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" property.`);
    }
  }
  
  const rest = new REST().setToken(config.discord.token);
  
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    
    let data;
    
    if (config.discord.guildId) {
      // Guild commands (for testing/development)
      data = await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands }
      );
      console.log(`Successfully reloaded ${data.length} guild (/) commands for guild ID: ${config.discord.guildId}.`);
    } else {
      // Global commands (for production)
      data = await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commands }
      );
      console.log(`Successfully reloaded ${data.length} global application (/) commands.`);
    }
  } catch (error) {
    console.error('Failed to deploy commands:', error);
  }
}

// Execute command deployment if this file is run directly
if (require.main === module) {
  deployCommands();
}

module.exports = deployCommands; 