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
   By default, MeadBot's moderation and passive-reaction features (see below) are configured
   for its original home server. Set `HONEYPOT_CHANNEL_ID` to enable the honeypot moderation
   feature (it's disabled by default), and override the other IDs in `.env` to run on a
   different server. See `.env.example` for the full list.

   In the [Discord Developer Portal](https://discord.com/developers/applications), enable the
   **Server Members Intent** and **Message Content Intent** for your bot application — MeadBot
   needs both.
3. Start the bot:
   ```
   npm start
   ```

## Commands

MeadBot uses prefix commands (default prefix: `!`, configurable via `PREFIX` in `.env`). Run
`!help` in a channel MeadBot can see for the full, current list — it's generated from the
loaded commands, so it's always accurate. Highlights:

- Mead-brewing calculators: `!abv`, `!calories`, `!delle`, `!build-batch`, `!calculate-nutrients`,
  `!potential-alcohol`, `!calculate-blend`, `!calculate-mead`, `!sugar`, `!convert-volume`,
  `!convert-honey-units`, `!convert-temp`, `!gallon`, `!liter`, `!list-volume-units`,
  `!list-yeast-requirements`.
- Community/fun: `!cat`, `!dog`, `!slug`, `!quip`, `!suggest`, and a handful of image/link
  commands (`!kahm`, `!yeet`, `!closure`, `!bees`, `!taco`, etc).
- Info: `!wiki`, `!doc`, `!recipes`, `!mmm`, `!eligibility`.
- Admin: `!stop`.

Each calculator command supports `-h`/`--help` (optionally `-h all` for the full usage string).

### Moderation and passive reactions

Beyond commands, MeadBot also (both configurable/disableable via `.env`, see above):

- Auto-bans anyone who posts in a configured "honeypot" channel (unless they're an admin or
  hold an exempt role) — set `HONEYPOT_CHANNEL_ID` to enable.
- Runs a daily job that deletes old messages from its own admin/spam channels.
- Reacts or replies to certain keywords/phrases in messages (scoped to the configured guild
  where noted in `src/reactions/passiveReactions.js`).

## Project structure

- `src/index.js` - Bot entry point, sets up the Discord client.
- `src/config.js` - Discord IDs (channels/guild/roles/users) and content links, sourced from
  `.env` with defaults matching MeadBot's original home server.
- `src/commands/` - One file per command, each exporting
  `{ name, aliases?, description, execute(message, args, client) }`.
- `src/events/` - One file per Discord.js event, each exporting `{ name, once, execute(...args, client) }`.
- `src/handlers/` - Loads commands (including aliases) and events at startup.
- `src/calculator/` - Mead-brewing calculator functions and constants (unit conversions, ABV,
  calories, Delle number, nutrient-schedule math, blending math), independent of Discord.js.
- `src/data/` - Static content (facts, chef quips, presence activities).
- `src/jobs/` - Background work: the old-message cleanup job and the contest-eligibility
  message-counting helper.
- `src/moderation/` - The honeypot-channel auto-ban logic.
- `src/reactions/` - Passive (non-command) keyword-triggered reactions.
- `src/utils/` - Small shared helpers (media file paths, message chunking, DM/notify helpers).
- `test/` - Unit tests, run with `npm test`.

### Adding a command

Add a new file to `src/commands/` exporting `{ name, aliases?, description, execute(message, args, client) }`.
It's picked up automatically on startup, including any aliases.

### Adding an event

Add a new file to `src/events/` exporting `{ name, once, execute(...args, client) }`. It's picked up automatically on startup.

## Development

- `npm test` - Run the unit test suite (Node's built-in test runner).
- `npm run lint` - Check for lint errors.
- `npm run lint:fix` - Auto-fix lint errors where possible.
- `npm run format` - Format the codebase with Prettier.
