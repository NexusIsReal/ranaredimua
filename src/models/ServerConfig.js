const { db } = require('../database');

/**
 * ServerConfig class for interacting with the server configuration collection
 */
class ServerConfig {
  /**
   * Find a server configuration by guild ID
   * @param {Object} query - Query object
   * @returns {Promise<Object>} Server configuration
   */
  static findOne(query) {
    return new Promise((resolve, reject) => {
      db.serverConfig.findOne(query, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  }

  /**
   * Find server configurations based on a query
   * @param {Object} query - Query object
   * @returns {Promise<Array>} Array of server configurations
   */
  static find(query) {
    return new Promise((resolve, reject) => {
      db.serverConfig.find(query, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  }

  /**
   * Create a new server configuration
   * @param {Object} configData - Server configuration data
   */
  constructor(configData) {
    Object.assign(this, configData);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Save the server configuration to the database
   * @returns {Promise<Object>} Saved server configuration
   */
  save() {
    return new Promise((resolve, reject) => {
      this.updatedAt = new Date();
      
      // If this is a new record (no _id), insert it
      if (!this._id) {
        db.serverConfig.insert(this, (err, newDoc) => {
          if (err) return reject(err);
          Object.assign(this, newDoc);
          resolve(this);
        });
      } else {
        // Otherwise update the existing record
        const id = this._id;
        const updateData = { ...this };
        delete updateData._id; // Remove _id from the update data
        
        db.serverConfig.update({ _id: id }, updateData, {}, (err) => {
          if (err) return reject(err);
          this._id = id; // Restore the _id
          resolve(this);
        });
      }
    });
  }
}

module.exports = ServerConfig; 