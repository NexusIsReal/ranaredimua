const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const apiRoutes = require('./api');

/**
 * Set up all routes for the Express app
 * @param {Object} app - Express app
 * @param {Object} client - Discord.js client
 */
function setupRoutes(app, client) {
  // Homepage route
  app.get('/', (req, res) => {
    // Generate bot invite link
    const inviteLink = client ? 
      `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands` : 
      '#';
    
    res.render('index', {
      title: 'Discord Moderation Bot',
      user: req.user,
      inviteLink: inviteLink
    });
  });
  
  // Set up authentication routes
  app.use('/auth', authRoutes);
  
  // Set up dashboard routes
  app.use('/dashboard', dashboardRoutes(client));
  
  // Set up API routes
  app.use('/api', apiRoutes(client));
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).render('error', {
      title: 'Page Not Found',
      error: 'The page you are looking for could not be found.',
      user: req.user
    });
  });
}

module.exports = { setupRoutes }; 