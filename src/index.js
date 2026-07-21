require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const loadCommands = require('./handlers/commandHandler');
const loadEvents = require('./handlers/eventHandler');
const { readVersion } = require('./version.js');
const { startVersionWatcher } = require('./jobs/versionWatcher.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  // Needed so messageReactionAdd still fires for reactions on messages/channels that have aged
  // out of the client's cache (e.g. after a redeploy restart) -- without these, Discord.js just
  // drops the event instead of emitting a partial structure for events/messageReactionAdd.js to
  // .fetch() itself.
  partials: [Partials.Message, Partials.Reaction, Partials.Channel],
});

client.commands = new Collection();
client.prefix = process.env.PREFIX || '!';
client.version = readVersion();

loadCommands(client);
loadEvents(client);
startVersionWatcher(client);

client.login(process.env.DISCORD_TOKEN);
