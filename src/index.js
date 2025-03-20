const { init: initBot, client } = require('./bot');
const { initWeb } = require('./web');
const { connectDatabase } = require('./database');

// Main function to initialize the application
async function init() {
  try {
    // Connect to the database
    await connectDatabase();
    
    // Initialize the Discord bot
    await initBot();
    
    // Initialize the web panel with the Discord bot client
    await initWeb(client);
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    process.exit(1);
  }
}

// Start the application
init(); 