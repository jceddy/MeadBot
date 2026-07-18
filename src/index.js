require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const loadCommands = require('./handlers/commandHandler');
const loadEvents = require('./handlers/eventHandler');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.commands = new Collection();
client.prefix = process.env.PREFIX || '!';

loadCommands(client);
loadEvents(client);

client.login(process.env.DISCORD_TOKEN);
