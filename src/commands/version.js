module.exports = {
  name: 'version',
  description: 'Shows the currently running MeadBot version.',
  execute(message, args, client) {
    message.channel.send(`MeadBot v${client.version}`);
  },
};
