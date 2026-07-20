const chunkLines = require('../utils/chunkMessage.js');
const describeFetchError = require('../utils/describeFetchError.js');

const API_ROOT = process.env.MEADBOT_API_ROOT;
const API_KEY = process.env.CHAT_API_KEY;

function formatUsd(amount) {
  const value = Number(amount);
  return value < 0 ? `-$${(-value).toFixed(2)}` : `$${value.toFixed(2)}`;
}

function formatRow(row) {
  const who = row.userId ? `<@${row.userId}>` : '(no X-User-Id)';
  const requests = `${row.requestCount} request${row.requestCount === 1 ? '' : 's'}`;
  return `${who} -- ${requests}, ${formatUsd(row.totalUsageUsd)}, ${row.totalTokens} tokens, last used ${row.lastUsedAt}`;
}

module.exports = {
  name: 'chat-usage-by-user',
  description: 'Reports !chat usage broken down per user, ordered by cost.',
  async execute(message) {
    if (!API_ROOT || !API_KEY) {
      await message.channel.send('Chat is not configured on this bot.');
      return;
    }

    await message.channel.sendTyping();

    let payload;
    try {
      const response = await fetch(`${API_ROOT}/api/v1/balance/usage-by-user`, {
        headers: { 'X-Api-Key': API_KEY },
        signal: AbortSignal.timeout(15000),
      });
      payload = await response.json();
    } catch (error) {
      await message.channel.send('Failed to reach the chat API: ' + describeFetchError(error));
      return;
    }

    if (payload.error) {
      await message.channel.send('Chat usage error: ' + payload.errorMessage);
      return;
    }

    const rows = payload.usageByUser || [];
    if (rows.length === 0) {
      await message.channel.send('No chat usage recorded yet.');
      return;
    }

    // Mentions are suppressed (allowedMentions.parse: []) so posting this report doesn't ping
    // every user in it -- <@id> still renders as a normal clickable mention, just silently.
    const chunks = chunkLines(rows.map(formatRow));
    for (const chunk of chunks) {
      await message.channel.send({ content: chunk, allowedMentions: { parse: [] } });
    }
  },
};
