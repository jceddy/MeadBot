module.exports = {
  name: 'help',
  description: 'Lists all available commands.',
  execute(message, args, client) {
    const commandList = [...client.commands.values()]
      .map((cmd) => `**${client.prefix}${cmd.name}** - ${cmd.description}`)
      .join('\n');
    message.reply(`Available commands:\n${commandList}`);
  },
};
