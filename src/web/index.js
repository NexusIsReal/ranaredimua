const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session); // File-based session store
const passport = require('passport');
const path = require('path');
const morgan = require('morgan');
const flash = require('connect-flash');
const fs = require('fs');
const { setupAuth } = require('./auth');
const { setupMiddlewares } = require('./middlewares');
const { setupRoutes } = require('./routes');
const config = require('../config/config');

/**
 * Initialize the web panel
 * @param {Object} client - Discord.js client
 * @returns {Object} Express app and HTTP server
 */
async function initWeb(client) {
  try {
    // Create Express app
    const app = express();
    
    // Set the view engine
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    
    // Middleware
    app.use(morgan('dev')); // Logging
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Ensure session directory exists
    const sessionDir = path.join(config.database.dataDir, 'sessions');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Session setup with file-based sessions
    app.use(session({
      store: new FileStore({
        path: sessionDir,
        ttl: 60 * 60 * 24 * 7, // 1 week in seconds
        retries: 0
      }),
      secret: config.web.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week in milliseconds
      }
    }));
    
    // Flash messages
    app.use(flash());
    
    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Setup authentication
    setupAuth(passport);
    
    // Setup custom middlewares
    setupMiddlewares(app, client);
    
    // Setup routes
    setupRoutes(app, client);
    
    // Start the server
    const port = config.web.port;
    const server = app.listen(port, () => {
      console.log(`Web panel listening on port ${port}`);
    });
    
    return { app, server };
  } catch (error) {
    console.error('Failed to initialize web panel:', error);
    throw error;
  }
}

module.exports = { initWeb }; 