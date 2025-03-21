# Discord Moderation Bot with Web Panel

A powerful Discord moderation bot with a web-based configuration panel. This bot features comprehensive moderation commands, automod functionality, and a user-friendly web interface for server-specific configuration.

## Features

### Discord Bot
- Slash command-based interactions
- Moderation commands: ban, kick, mute, unmute, warn, clear
- Role management: addrole, removerole
- User history tracking and viewing
- Automated actions based on warning thresholds
- Clean, consistent embeds for all responses

### Automod
- Configurable word filter with regex support
- Anti-spam protection
- Mention spam detection
- Link filtering with domain whitelist

### Web Panel
- Secure authentication via Discord OAuth2
- Server-specific configurations
- Visual embed customization
- Command permission management
- Automod rule configuration
- Warning threshold setup

## Setup

### Prerequisites
- Node.js v16.9.0 or higher
- Discord Bot Token (with application commands scope)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Discord Bot Configuration
   DISCORD_BOT_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   DISCORD_GUILD_ID=your_discord_guild_id  # Optional, for development
   DISCORD_OWNER_ID=your_discord_owner_id  # Optional, bot owner's ID
   DISCORD_BOT_INVITE_URL=your_bot_invite_url  # Optional

   # Web Panel Configuration
   SESSION_SECRET=your_session_secret
   PORT=3000
   CALLBACK_URL=http://localhost:3000/auth/callback
   BASE_URL=http://localhost:3000

   # Database Configuration
   DATA_DIR=./data  # Optional: Custom path for data storage

   # Admin Users (comma-separated Discord IDs)
   ADMIN_IDS=123456789,987654321  # Optional: User IDs who have admin access
   ```

### Usage
1. Deploy slash commands:
   ```
   npm run deploy
   ```

2. Start the application:
   ```
   npm start
   ```

3. For development with automatic restarts:
   ```
   npm run dev
   ```

4. Access the web panel at http://localhost:3000 (or your configured port)

## Command Reference

### Moderation Commands
- `/ban [user] [reason] [delete-messages]` - Ban a user
- `/kick [user] [reason]` - Kick a user
- `/mute [user] [duration] [reason]` - Temporarily mute a user
- `/unmute [user] [reason]` - Remove a timeout from a user
- `/warn [user] [reason]` - Issue a warning to a user
- `/clear [amount] [user]` - Delete messages in a channel
- `/modlog [user]` - View a user's moderation history

### Role Management
- `/addrole [user] [role] [reason]` - Add a role to a user
- `/removerole [user] [role] [reason]` - Remove a role from a user

### Utility
- `/help [command]` - Get information about commands

## License
MIT "# ranaredimua" 
#   r a n a r e d i m u a  
 #   r a n a r e d i m u a  
 