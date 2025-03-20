const mongoose = require('mongoose');

const ServerConfigSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  guildName: {
    type: String,
    required: true
  },
  moderationConfig: {
    logChannelId: {
      type: String,
      default: null
    },
    warningThresholds: [{
      count: Number,
      action: {
        type: String,
        enum: ['mute', 'kick', 'ban'],
        required: true
      },
      duration: {
        type: Number, // Duration in minutes for mutes
        default: 0
      }
    }]
  },
  automodConfig: {
    enabled: {
      type: Boolean,
      default: true
    },
    bannedWords: {
      enabled: {
        type: Boolean,
        default: false
      },
      words: [{
        type: String
      }],
      regex: [{
        type: String
      }],
      action: {
        type: String,
        enum: ['delete', 'warn', 'mute', 'kick', 'ban'],
        default: 'delete'
      }
    },
    antiSpam: {
      enabled: {
        type: Boolean,
        default: false
      },
      messageThreshold: {
        type: Number,
        default: 5
      },
      timeThreshold: {
        type: Number,
        default: 5000 // ms
      },
      action: {
        type: String,
        enum: ['delete', 'warn', 'mute', 'kick', 'ban'],
        default: 'delete'
      }
    },
    antimentionSpam: {
      enabled: {
        type: Boolean,
        default: false
      },
      mentionThreshold: {
        type: Number,
        default: 5
      },
      action: {
        type: String,
        enum: ['delete', 'warn', 'mute', 'kick', 'ban'],
        default: 'delete'
      }
    },
    antiLinkSpam: {
      enabled: {
        type: Boolean,
        default: false
      },
      whitelistedDomains: [{
        type: String
      }],
      action: {
        type: String,
        enum: ['delete', 'warn', 'mute', 'kick', 'ban'],
        default: 'delete'
      }
    }
  },
  commandConfig: {
    // Map command names to role IDs that can use them
    permissions: {
      type: Map,
      of: [{
        type: String, // Role IDs
      }],
      default: new Map()
    }
  },
  embedConfig: {
    color: {
      type: String,
      default: '#5865F2' // Discord blue
    },
    footer: {
      text: {
        type: String,
        default: ''
      },
      iconUrl: {
        type: String,
        default: ''
      }
    }
  },
  customResponses: [{
    trigger: {
      type: String,
      required: true
    },
    response: {
      type: String,
      required: true
    },
    isEmbed: {
      type: Boolean,
      default: false
    }
  }],
  featureToggles: {
    moderationCommands: {
      type: Boolean,
      default: true
    },
    automod: {
      type: Boolean,
      default: true
    },
    logging: {
      type: Boolean,
      default: true
    },
    customResponses: {
      type: Boolean,
      default: true
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('ServerConfig', ServerConfigSchema); 