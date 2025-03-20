const { PermissionFlagsBits } = require('discord.js');

/**
 * Checks if a user has administrator permissions in a guild
 * @param {Object} member - Guild member
 * @returns {boolean} - Whether the user has admin permissions
 */
function isAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Checks if a user has moderator permissions in a guild
 * @param {Object} member - Guild member
 * @returns {boolean} - Whether the user has mod permissions
 */
function isModerator(member) {
  return member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
         member.permissions.has(PermissionFlagsBits.KickMembers) ||
         member.permissions.has(PermissionFlagsBits.BanMembers) ||
         isAdmin(member);
}

/**
 * Checks if a user has permission to use a specific command based on server config
 * @param {Object} member - Guild member
 * @param {string} commandName - The command name to check permissions for
 * @param {Object} serverConfig - Server configuration
 * @returns {boolean} - Whether the user has permission to use the command
 */
function hasCommandPermission(member, commandName, serverConfig) {
  // Admins always have permission
  if (isAdmin(member)) {
    return true;
  }
  
  // Check if command has specific role requirements
  // Safely access nested properties in case they're undefined
  let commandPermissions = [];
  if (serverConfig && 
      serverConfig.commandConfig && 
      serverConfig.commandConfig.permissions) {
    // Access permissions as an object property instead of using Map.get()
    commandPermissions = serverConfig.commandConfig.permissions[commandName] || [];
  }
  
  if (!commandPermissions || commandPermissions.length === 0) {
    // If no specific permissions are set, default to moderator permissions for moderation commands
    const moderationCommands = ['ban', 'kick', 'mute', 'unmute', 'warn', 'clear', 'addrole', 'removerole'];
    
    if (moderationCommands.includes(commandName)) {
      return isModerator(member);
    }
    
    // Otherwise, everyone can use the command
    return true;
  }
  
  // Check if the user has any of the required roles
  return member.roles.cache.some(role => commandPermissions.includes(role.id));
}

module.exports = {
  isAdmin,
  isModerator,
  hasCommandPermission
}; 