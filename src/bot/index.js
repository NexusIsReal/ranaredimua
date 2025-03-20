const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { connectDatabase } = require('../database');
const { ServerConfigService } = require('./utils');

// Create a new client instance with minimal intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Create commands collection
client.commands = new Collection();
client.serverConfigs = new Map();

// Function to load commands
async function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    // Check if command has required properties
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Function to load events
function loadEvents() {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}

// Function to load server configurations
async function loadServerConfigs() {
  const guilds = client.guilds.cache;
  
  for (const [guildId, guild] of guilds) {
    try {
      const serverConfig = await ServerConfigService.getOrCreateConfig(guildId, guild.name);
      client.serverConfigs.set(guildId, serverConfig);
    } catch (error) {
      console.error(`Error loading config for guild ${guild.name} (${guildId}):`, error);
    }
  }
}

// Main function to initialize the bot
async function init() {
  try {
    // Connect to the database
    await connectDatabase();

    // Load commands and events
    await loadCommands();
    loadEvents();

    // Login to Discord
    await client.login(config.discord.token);
    
    // Load server configurations after the client is ready
    client.once('ready', async () => {
      await loadServerConfigs();
    });
  } catch (error) {
    console.error('Error initializing bot:', error);
    process.exit(1);
  }
}

// Export for use in Web API
module.exports = {
  client,
  init
};

// Run the bot if this file is executed directly
if (require.main === module) {
  init();
} 