const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'stop',
  description: 'Shuts down MeadBot (administrators only).',
  async execute(message) {
    if (!message.member || !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return;
    }
    await message.channel.send('MeadBot shutting down.');
    process.exit(1);
  },
};
