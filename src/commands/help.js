const chunkLines = require('../utils/chunkMessage.js');

module.exports = {
  name: 'help',
  description: 'Lists all available commands.',
  async execute(message, args, client) {
    const uniqueCommands = [...new Set(client.commands.values())].sort((a, b) => a.name.localeCompare(b.name));
    const lines = uniqueCommands.map((cmd) => `**${client.prefix}${cmd.name}** - ${cmd.description}`);

    for (const chunk of chunkLines(lines)) {
      await message.reply(chunk);
    }
  },
};
