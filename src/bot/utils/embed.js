const { EmbedBuilder } = require('discord.js');

/**
 * Creates a styled embed with consistent formatting
 * @param {Object} options - Embed options
 * @param {string} options.title - Embed title
 * @param {string} options.description - Embed description
 * @param {Array} options.fields - Embed fields
 * @param {string} options.color - Embed color (hex)
 * @param {Object} options.footer - Embed footer
 * @param {Object} options.image - Embed image
 * @param {Object} options.thumbnail - Embed thumbnail
 * @param {Object} options.author - Embed author
 * @param {Object} options.serverConfig - Server config for customization
 * @returns {EmbedBuilder} - The created embed
 */
function createEmbed(options = {}) {
  const {
    title,
    description,
    fields = [],
    color = '#5865F2',
    footer,
    image,
    thumbnail,
    author,
    serverConfig = null
  } = options;

  const embed = new EmbedBuilder();

  // Apply server-specific styling if provided
  const embedColor = serverConfig?.embedConfig?.color || color;

  embed.setColor(embedColor);

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields.length > 0) embed.addFields(fields);
  if (image) embed.setImage(image);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (author) embed.setAuthor(author);

  // Set footer
  if (footer) {
    embed.setFooter(footer);
  } else if (serverConfig?.embedConfig?.footer?.text) {
    embed.setFooter({
      text: serverConfig.embedConfig.footer.text,
      iconURL: serverConfig.embedConfig.footer.iconUrl || null
    });
  }

  // Set timestamp
  embed.setTimestamp();

  return embed;
}

/**
 * Creates a success embed
 * @param {string} message - Success message
 * @param {Object} serverConfig - Server configuration
 * @returns {EmbedBuilder} - Success embed
 */
function successEmbed(message, serverConfig = null) {
  return createEmbed({
    description: `✅ ${message}`,
    color: '#43B581', // Discord green
    serverConfig
  });
}

/**
 * Creates an error embed
 * @param {string} message - Error message
 * @param {Object} serverConfig - Server configuration
 * @returns {EmbedBuilder} - Error embed
 */
function errorEmbed(message, serverConfig = null) {
  return createEmbed({
    description: `❌ ${message}`,
    color: '#F04747', // Discord red
    serverConfig
  });
}

/**
 * Creates a warning embed
 * @param {string} message - Warning message
 * @param {Object} serverConfig - Server configuration
 * @returns {EmbedBuilder} - Warning embed
 */
function warningEmbed(message, serverConfig = null) {
  return createEmbed({
    description: `⚠️ ${message}`,
    color: '#FAA61A', // Discord yellow
    serverConfig
  });
}

/**
 * Creates a moderation action embed for logging
 * @param {Object} options - Options for the moderation embed
 * @param {string} options.action - The action taken (e.g., 'Ban', 'Kick')
 * @param {Object} options.target - The target user
 * @param {Object} options.moderator - The moderator who took the action
 * @param {string} options.reason - The reason for the action
 * @param {string|null} options.duration - The duration for temporary actions
 * @param {Object} options.serverConfig - Server configuration
 * @returns {EmbedBuilder} - Moderation action embed
 */
function moderationEmbed(options) {
  const {
    action,
    target,
    moderator,
    reason = 'No reason provided',
    duration = null,
    serverConfig = null
  } = options;

  const actionColors = {
    ban: '#F04747', // Red
    kick: '#FAA61A', // Yellow
    mute: '#FAA61A', // Yellow
    warn: '#FAD61A', // Light yellow
    unmute: '#43B581', // Green
    unban: '#43B581' // Green
  };

  const color = actionColors[action.toLowerCase()] || '#5865F2';

  const fields = [
    { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
    { name: 'Moderator', value: `${moderator.tag}`, inline: true },
    { name: 'Reason', value: reason }
  ];

  if (duration) {
    fields.push({ name: 'Duration', value: duration, inline: true });
  }

  return createEmbed({
    title: `${action} | Moderation Action`,
    fields,
    color,
    thumbnail: target.displayAvatarURL ? { url: target.displayAvatarURL() } : null,
    serverConfig
  });
}

module.exports = {
  createEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed,
  moderationEmbed
}; 