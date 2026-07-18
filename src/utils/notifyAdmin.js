const config = require('../config.js');

// posts a status/error message to the admin-bot-spam channel
module.exports = async function notifyAdmin(client, messageText) {
  const channel = client.channels.cache.get(config.channels.adminBotSpam);
  if (!channel) {
    console.error('adminBotSpam channel not found; message was:', messageText);
    return;
  }
  try {
    await channel.send(messageText);
  } catch (e) {
    console.error('Failed to notify admin channel:', e);
  }
};
