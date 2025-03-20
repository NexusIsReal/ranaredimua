const { db } = require('../database');

/**
 * User class for interacting with the users collection
 */
class User {
  /**
   * Find a user by Discord ID
   * @param {Object} query - Query object
   * @returns {Promise<Object>} User object
   */
  static findOne(query) {
    return new Promise((resolve, reject) => {
      db.user.findOne(query, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  }

  /**
   * Find users based on a query
   * @param {Object} query - Query object
   * @returns {Promise<Array>} Array of users
   */
  static find(query) {
    return new Promise((resolve, reject) => {
      db.user.find(query, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  }

  /**
   * Find a user by Discord ID or create if not exists
   * @param {Object} userData - User data
   * @returns {Promise<Object>} User object
   */
  static async findOrCreate(userData) {
    const { discordId } = userData;
    
    try {
      let user = await this.findOne({ discordId });
      
      if (!user) {
        // Insert new user
        user = await new Promise((resolve, reject) => {
          // Add creation timestamp
          const newUser = {
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          db.user.insert(newUser, (err, doc) => {
            if (err) return reject(err);
            resolve(doc);
          });
        });
      } else {
        // Update existing user with new data
        user = await new Promise((resolve, reject) => {
          const updateData = {
            ...userData,
            updatedAt: new Date()
          };
          
          db.user.update({ discordId }, { $set: updateData }, {}, (err) => {
            if (err) return reject(err);
            
            // Get the updated user
            db.user.findOne({ discordId }, (err, doc) => {
              if (err) return reject(err);
              resolve(doc);
            });
          });
        });
      }
      
      return user;
    } catch (error) {
      console.error('Error in findOrCreate:', error);
      throw error;
    }
  }
}

module.exports = User; 