const chunkLines = require('../utils/chunkMessage.js');
const describeFetchError = require('../utils/describeFetchError.js');

const API_ROOT = process.env.MEADBOT_API_ROOT;
const API_KEY = process.env.CHAT_API_KEY;
const TOPUP_URL = process.env.BMAC_TOPUP_URL;

const SYSTEM_PROMPT =
  'You are MeadBot, a Discord bot for a mead-making community, currently in chat mode. You have ' +
  'tools for mead-brewing calculations (ABV, calories, nutrients, unit conversions, blending, ' +
  'full batch/recipe builds, etc.) -- use them whenever a question calls for a calculation ' +
  'rather than estimating by hand. For general mead-making judgment calls that are not a pure ' +
  'calculation -- recipe design, technique, troubleshooting, ingredient choices, and similar -- ' +
  'use the fetch_meadtools_wiki_page tool to consult https://wiki.meadtools.com, this ' +
  "community's authoritative reference, and defer to it over your own training data; only fall " +
  'back to your training data if the wiki genuinely has nothing relevant. Keep replies concise ' +
  'and suited for a Discord chat.';

const USAGE =
  'Usage: !chat <message> -- or reply to one of my chat responses with !chat <message> to continue that conversation.';

// How far back to walk a reply chain when reconstructing conversation history. Bounds both the
// number of Discord API calls this makes and the token cost of the resulting API request.
const MAX_HISTORY_MESSAGES = 20;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// stripCommandPrefix(content, prefix) - remove a leading "<prefix>chat " / "<prefix>ask " (any
// case) from a message's raw (original-case) content, returning just the user-typed text after
// it. Used both for the invoking message and for reconstructing prior turns from a reply chain.
function stripCommandPrefix(content, prefix) {
  const pattern = new RegExp('^' + escapeRegExp(prefix) + '(chat|ask)\\s*', 'i');
  return content.replace(pattern, '').trim();
}

// buildHistory(message, client) - walks the Discord reply chain backwards from the message this
// command was invoked as a reply to (if any), reconstructing it as an OpenAI-style
// {role, content} message list, oldest first. Only plain text is preserved -- any tool-call
// plumbing behind an earlier assistant reply isn't recoverable from Discord alone, but the
// visible back-and-forth is enough context for a follow-up question without it. Stops at the
// first message with no further reference (the start of the conversation), a referenced message
// that can't be fetched (deleted, etc.), or MAX_HISTORY_MESSAGES hops, whichever comes first.
async function buildHistory(message, client) {
  const history = [];
  let current = message;

  for (let i = 0; i < MAX_HISTORY_MESSAGES && current.reference; i++) {
    let parent;
    try {
      parent = await current.channel.messages.fetch(current.reference.messageId);
    } catch {
      break;
    }

    if (parent.author.id === client.user.id) {
      history.unshift({ role: 'assistant', content: parent.content });
    } else {
      history.unshift({ role: 'user', content: stripCommandPrefix(parent.content, client.prefix) });
    }

    current = parent;
  }

  return history;
}

module.exports = {
  name: 'chat',
  aliases: ['ask'],
  description:
    "Chat with an LLM assistant that has MeadBot's calculators as tools. Reply to one of its responses to continue the conversation.",
  async execute(message, args, client) {
    const userText = stripCommandPrefix(message.content, client.prefix);
    if (!userText) {
      await message.channel.send(USAGE);
      return;
    }

    if (!API_ROOT || !API_KEY) {
      await message.channel.send('Chat is not configured on this bot.');
      return;
    }

    let history;
    try {
      history = await buildHistory(message, client);
    } catch (error) {
      await message.channel.send('Failed to read the conversation history: ' + error.message);
      return;
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: userText }];

    await message.channel.sendTyping();

    let payload;
    try {
      const response = await fetch(`${API_ROOT}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': API_KEY,
          'X-User-Id': message.author.id,
        },
        body: JSON.stringify({ messages }),
        signal: AbortSignal.timeout(60000),
      });
      payload = await response.json();
    } catch (error) {
      await message.channel.send('Failed to reach the chat API: ' + describeFetchError(error));
      return;
    }

    if (payload.error) {
      let errorText = 'Chat error: ' + payload.errorMessage;
      if (payload.insufficientBalance && TOPUP_URL) {
        errorText += `\nThe AI usage budget is empty -- help top it up: ${TOPUP_URL}`;
      }
      await message.channel.send(errorText);
      return;
    }

    // Reply only to the first chunk, so a follow-up reply from the user has exactly one message
    // in the chain to anchor to per turn.
    const chunks = chunkLines(String(payload.reply).split('\n'));
    for (let i = 0; i < chunks.length; i++) {
      if (i === 0) {
        await message.reply(chunks[i]);
      } else {
        await message.channel.send(chunks[i]);
      }
    }
  },
};
