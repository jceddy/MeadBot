require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
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
  ],
});

client.commands = new Collection();
client.prefix = process.env.PREFIX || '!';
client.version = readVersion();

loadCommands(client);
loadEvents(client);
startVersionWatcher(client);

client.login(process.env.DISCORD_TOKEN);
