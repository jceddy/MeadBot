const config = require('../config.js');
const { handleHoneypot } = require('../moderation/honeypot.js');
const { handlePassiveReactions } = require('../reactions/passiveReactions.js');
const notifyOwner = require('../utils/notifyOwner.js');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;

    if (await handleHoneypot(message)) {
      return;
    }

    const messageLower = message.content.toLowerCase().replace(/ {2,}/g, ' ');

    if (!messageLower.startsWith(client.prefix)) {
      try {
        await handlePassiveReactions(message);
      } catch (error) {
        console.error(error);
      }
      return;
    }

    // special-cased full-phrase commands, checked before generic single-token dispatch
    if (messageLower.startsWith(client.prefix + 'which beans in chili')) {
      await message.channel.send('NONE');
      if (message.guild != null) {
        const trollRole = message.guild.roles.cache.find((r) => r.name === config.roles.trollRoleName);
        if (trollRole) {
          await message.member.roles.add(trollRole);
        }
      }
      return;
    }
    if (messageLower.startsWith(client.prefix + 'beans in chili')) {
      await message.channel.send('NO!');
      return;
    }

    const rawArgs = message.content.slice(client.prefix.length).trim().split(/\s+/);
    const commandName = rawArgs.shift().toLowerCase();
    const args = rawArgs.map((arg) => arg.toLowerCase());

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(error);
      message.reply('There was an error executing that command.');
      notifyOwner(client, message.guild, error.message).catch(() => {});
    }
  },
};
