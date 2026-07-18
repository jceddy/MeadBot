module.exports = {
  name: 'messageCreate',
  once: false,
  execute(message, client) {
    if (message.author.bot) return;
    if (!message.content.startsWith(client.prefix)) return;

    const args = message.content.slice(client.prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
      command.execute(message, args, client);
    } catch (error) {
      console.error(error);
      message.reply('There was an error executing that command.');
    }
  },
};
