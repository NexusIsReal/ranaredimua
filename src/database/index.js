const path = require('path');
const fs = require('fs');
const Datastore = require('nedb');
const config = require('../config/config');

// Ensure the data directory exists
const dataDir = config.database.dataDir;
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database collections
const db = {
  serverConfig: new Datastore({ 
    filename: path.join(dataDir, 'server-config.db'), 
    autoload: true 
  }),
  infraction: new Datastore({ 
    filename: path.join(dataDir, 'infractions.db'), 
    autoload: true 
  }),
  user: new Datastore({ 
    filename: path.join(dataDir, 'users.db'), 
    autoload: true 
  })
};

// Create indexes
db.serverConfig.ensureIndex({ fieldName: 'guildId', unique: true });
db.infraction.ensureIndex({ fieldName: 'guildId' });
db.infraction.ensureIndex({ fieldName: 'userId' });
db.infraction.ensureIndex({ fieldName: 'type' });
db.user.ensureIndex({ fieldName: 'discordId', unique: true });

/**
 * Connect to the database
 * @returns {Promise<Object>} Database object
 */
async function connectDatabase() {
  try {
    console.log(`Connected to NeDB database files in ${dataDir}`);
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

/**
 * Disconnect from the database
 * @returns {Promise<boolean>} Success status
 */
async function disconnectDatabase() {
  try {
    console.log('Disconnected from NeDB database');
    return true;
  } catch (error) {
    console.error('Database disconnect error:', error);
    throw error;
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  db
}; 