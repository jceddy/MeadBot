const config = require('../config.js');

// DMs the bot owner, preferring a guild-member lookup (so it works even if the owner
// hasn't DM'd the bot before) and falling back to a direct user fetch
module.exports = async function notifyOwner(client, guild, messageText) {
  try {
    if (guild) {
      const members = await guild.members.fetch({ query: config.owner.searchQuery, limit: 1 });
      const member = members.first();
      if (member) {
        await member.send(messageText);
        return;
      }
    }
    const user = await client.users.fetch(config.owner.userId);
    await user.send(messageText);
  } catch (e) {
    console.error('Failed to notify bot owner:', e);
  }
};
