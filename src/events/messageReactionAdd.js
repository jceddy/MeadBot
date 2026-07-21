const describeFetchError = require('../utils/describeFetchError.js');
const { buildChatHistory, looksLikeChatInvocation } = require('../utils/buildChatHistory.js');
const notifyOwner = require('../utils/notifyOwner.js');
const jumpLink = require('../utils/jumpLink.js');

const API_ROOT = process.env.MEADBOT_API_ROOT;
const API_KEY = process.env.CHAT_API_KEY;

const THUMBS_DOWN = '👎';

// postFeedback(messages, user, message) - records negative feedback via MeadBotAPI's
// POST /chat/feedback, returning a short human-readable outcome for the owner DM. Never throws --
// any failure (not configured, network, API error) is folded into the returned text instead, so a
// feedback-recording failure never stops the owner from at least being notified that the 👎
// happened.
async function postFeedback(messages, user, message) {
  if (!API_ROOT || !API_KEY) {
    return 'Not persisted -- chat is not configured on this bot.';
  }

  try {
    const response = await fetch(`${API_ROOT}/api/v1/chat/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
      body: JSON.stringify({
        discordUserId: user.id,
        discordMessageId: message.id,
        discordChannelId: message.channelId,
        discordGuildId: message.guildId,
        messages,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json();
    return payload.error
      ? `Failed to persist feedback: ${payload.errorMessage}`
      : 'Persisted to the feedback database.';
  } catch (error) {
    return 'Failed to reach the chat API: ' + describeFetchError(error);
  }
}

module.exports = {
  name: 'messageReactionAdd',
  once: false,
  async execute(reaction, user, client) {
    if (user.bot) return;

    try {
      if (reaction.partial) {
        await reaction.fetch();
      }
    } catch (error) {
      console.error('Failed to fetch a partial reaction:', error);
      return;
    }

    if (reaction.emoji.name !== THUMBS_DOWN) return;

    const message = reaction.message;
    try {
      if (message.partial) {
        await message.fetch();
      }
    } catch (error) {
      console.error('Failed to fetch a partial message for a reaction:', error);
      return;
    }

    // Only messages MeadBot itself sent as a reply are candidates -- every !chat/!ask response
    // takes that shape (see commands/chat.js), but so do a couple of others (!help, the generic
    // command-error reply), so this alone isn't proof. Confirmed below by walking the reply chain
    // back to its root and checking that it actually started from a !chat/!ask invocation.
    if (message.author.id !== client.user.id || !message.reference) {
      return;
    }

    let history;
    let root;
    try {
      ({ history, root } = await buildChatHistory(message, client));
    } catch (error) {
      console.error('Failed to reconstruct history for negative chat feedback:', error);
      return;
    }

    if (!looksLikeChatInvocation(root.content, client.prefix)) {
      return;
    }

    const messages = [...history, { role: 'assistant', content: message.content }];

    const persistedNote = await postFeedback(messages, user, message);

    await notifyOwner(
      client,
      message.guild,
      `${THUMBS_DOWN} Negative feedback on a !chat reply from <@${user.id}>: ${jumpLink(message)}\n${persistedNote}`
    );
  },
};
