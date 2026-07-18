const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const config = require('../config.js');
const notifyAdmin = require('../utils/notifyAdmin.js');

// deletes messages older than `days` in `channel` (optionally only from `userId`),
// paging back through history; reports progress/errors to the admin channel
async function deleteOldMessagesByChannel(client, channel, days, userId) {
  if (!channel) {
    return;
  }

  const checkDate = new Date();
  const isOld = (m) =>
    CalculatorAPI.GetDaysBetween(m.createdAt, checkDate) > days && (userId == null || m.author.id === userId);

  let lastId;
  try {
    for (;;) {
      const options = { limit: 100 };
      if (lastId) {
        options.before = lastId;
      }

      const messages = await channel.messages.fetch(options);
      const messageCount = messages.size;

      if (messageCount === 0) {
        await notifyAdmin(client, 'Done cleaning up ' + channel.toString());
        return;
      }

      const messagesToDelete = [...messages.filter(isOld).values()];
      if (messagesToDelete.length > 0) {
        for (const msg of messagesToDelete) {
          try {
            await msg.delete();
          } catch (e) {
            await notifyAdmin(client, 'Error cleaning up ' + channel.toString() + ': ' + e.message);
            return;
          }
        }
        // re-scan from the same boundary now that this page's matches are gone
        continue;
      }

      if (messageCount === 100) {
        lastId = messages.last().id;
        continue;
      }

      await notifyAdmin(client, 'Done cleaning up ' + channel.toString());
      return;
    }
  } catch (e) {
    await notifyAdmin(client, 'Error cleaning up ' + channel.toString() + ': ' + e.message);
  }
}

function runCleanup(client) {
  const adminChannel = client.channels.cache.get(config.channels.adminBotSpam);
  if (adminChannel) {
    adminChannel.send('Cleaning up old messages.').catch((e) => console.error(e));
  }
  deleteOldMessagesByChannel(client, adminChannel, 31).catch((e) => console.error(e));
  deleteOldMessagesByChannel(client, client.channels.cache.get(config.channels.botSpam), 31).catch((e) =>
    console.error(e)
  );
}

function scheduleCleanup(client) {
  runCleanup(client);
  setTimeout(() => scheduleCleanup(client), config.moderation.cleanupIntervalMs);
}

module.exports = { deleteOldMessagesByChannel, scheduleCleanup };
