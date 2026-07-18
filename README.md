# MeadBot
Discord bot to help make Mead.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your bot token:
   ```
   cp .env.example .env
   ```
3. Start the bot:
   ```
   npm start
   ```

## Commands

MeadBot uses prefix commands (default prefix: `!`, configurable via `PREFIX` in `.env`).

- `!ping` - Replies with Pong and the bot latency.
- `!help` - Lists all available commands.

## Project structure

- `src/index.js` - Bot entry point, sets up the Discord client.
- `src/commands/` - One file per command, each exporting `{ name, description, execute(message, args, client) }`.
- `src/events/` - One file per Discord.js event, each exporting `{ name, once, execute(...args, client) }`.
- `src/handlers/` - Loads commands and events at startup.

### Adding a command

Add a new file to `src/commands/` exporting `{ name, description, execute(message, args, client) }`. It's picked up automatically on startup.

### Adding an event

Add a new file to `src/events/` exporting `{ name, once, execute(...args, client) }`. It's picked up automatically on startup.
