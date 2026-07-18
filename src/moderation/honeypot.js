const { PermissionFlagsBits } = require('discord.js');
const config = require('../config.js');
const { deleteOldMessagesByChannel } = require('../jobs/cleanup.js');
const notifyAdmin = require('../utils/notifyAdmin.js');

// bans anyone (without admin/exempt-role) who posts in the configured honeypot channel.
// returns true if the message was handled (caller should stop further processing).
async function handleHoneypot(message) {
  if (
    !config.channels.honeyPot ||
    message.channel.id !== config.channels.honeyPot ||
    message.guild == null ||
    message.author.bot
  ) {
    return false;
  }

  try {
    const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
    const isExempt = message.member.roles.cache.has(config.roles.honeyPotExempt);

    if (!isAdmin && !isExempt) {
      deleteOldMessagesByChannel(message.client, message.channel, 0, message.author.id).catch(() => {});

      try {
        await message.member.ban({ deleteMessageSeconds: 86400, reason: 'Posted in honeypot channel.' });
        await notifyAdmin(
          message.client,
          'Banned ' + message.author.toString() + ' for posting in ' + message.channel.toString()
        );
      } catch (e) {
        await notifyAdmin(message.client, 'Error banning ' + message.author.toString() + ': ' + e.message);
      }
    }
  } catch (e) {
    await notifyAdmin(message.client, 'Error processing honeypot message: ' + e.message);
  }

  return true;
}

module.exports = { handleHoneypot };
