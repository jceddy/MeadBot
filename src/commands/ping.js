module.exports = {
  name: 'ping',
  description: 'Replies with Pong and the bot latency.',
  execute(message) {
    message.reply(`Pong! Latency: ${Date.now() - message.createdTimestamp}ms`);
  },
};
