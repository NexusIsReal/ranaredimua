const { Events } = require('discord.js');
const { ServerConfigService, createEmbed } = require('../utils');

module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    try {
      // Create a new config for the guild
      const serverConfig = await ServerConfigService.getOrCreateConfig(
        guild.id,
        guild.name
      );
      
      // Cache the config
      guild.client.serverConfigs.set(guild.id, serverConfig);
      
      console.log(`Joined guild: ${guild.name} (${guild.id})`);
      
      // Try to find a system channel or default channel to send welcome message
      const channel = guild.systemChannel || 
                     (await guild.channels.fetch()).find(channel => 
                       channel.type === 0 && channel.permissionsFor(guild.client.user).has('SendMessages')
                     );
      
      if (channel) {
        const embed = createEmbed({
          title: 'Thanks for adding me to your server!',
          description: 'I am a moderation bot with powerful features. Here are some things to know:',
          fields: [
            { 
              name: 'Getting Started', 
              value: 'Use `/help` to see all available commands.' 
            },
            { 
              name: 'Moderation Features', 
              value: 'I have commands for kick, ban, mute, warn, and more.' 
            },
            { 
              name: 'Automod Features', 
              value: 'I can automatically moderate messages to keep your server safe.' 
            },
            { 
              name: 'Web Panel', 
              value: 'Server administrators can access my web panel to configure advanced settings.' 
            }
          ],
          color: '#5865F2'
        });
        
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(`Error handling guild join (${guild.id}):`, error);
    }
  }
}; 