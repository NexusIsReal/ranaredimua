const { db } = require('../database');

/**
 * Infraction class for interacting with the infractions collection
 */
class Infraction {
  /**
   * Find infractions based on a query
   * @param {Object} query - Query object
   * @returns {Promise<Array>} Array of infractions
   */
  static find(query) {
    return new Promise((resolve, reject) => {
      db.infraction.find(query, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  }

  /**
   * Find and sort infractions
   * @param {Object} query - Query object
   * @returns {Object} Sortable cursor
   */
  static sort(sortOptions) {
    return {
      limit: function(limit) {
        return {
          exec: function() {
            return new Promise((resolve, reject) => {
              db.infraction.find({})
                .sort(sortOptions)
                .limit(limit)
                .exec((err, docs) => {
                  if (err) return reject(err);
                  resolve(docs);
                });
            });
          }
        };
      },
      exec: function() {
        return new Promise((resolve, reject) => {
          db.infraction.find({})
            .sort(sortOptions)
            .exec((err, docs) => {
              if (err) return reject(err);
              resolve(docs);
            });
        });
      }
    };
  }

  /**
   * Count documents matching a query
   * @param {Object} query - Query object
   * @returns {Promise<number>} Count of matching documents
   */
  static countDocuments(query) {
    return new Promise((resolve, reject) => {
      db.infraction.count(query, (err, count) => {
        if (err) return reject(err);
        resolve(count);
      });
    });
  }

  /**
   * Create a new infraction
   * @param {Object} infractionData - Infraction data
   */
  constructor(infractionData) {
    Object.assign(this, infractionData);
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // Default values
    this.active = this.active !== undefined ? this.active : true;
    this.reason = this.reason || 'No reason provided';
    this.duration = this.duration || null;
    this.expiresAt = this.expiresAt || null;
  }

  /**
   * Save the infraction to the database
   * @returns {Promise<Object>} Saved infraction
   */
  save() {
    return new Promise((resolve, reject) => {
      this.updatedAt = new Date();
      
      // If this is a new record (no _id), insert it
      if (!this._id) {
        db.infraction.insert(this, (err, newDoc) => {
          if (err) return reject(err);
          Object.assign(this, newDoc);
          resolve(this);
        });
      } else {
        // Otherwise update the existing record
        const id = this._id;
        const updateData = { ...this };
        delete updateData._id; // Remove _id from the update data
        
        db.infraction.update({ _id: id }, updateData, {}, (err) => {
          if (err) return reject(err);
          this._id = id; // Restore the _id
          resolve(this);
        });
      }
    });
  }
}

module.exports = Infraction; 