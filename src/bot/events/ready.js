const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Bot is serving ${client.guilds.cache.size} guilds`);
    
    // Set bot status
    client.user.setActivity('/help', { type: 'LISTENING' });
  }
}; 