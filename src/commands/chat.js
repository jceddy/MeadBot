const chunkLines = require('../utils/chunkMessage.js');
const describeFetchError = require('../utils/describeFetchError.js');
const sanitizeMarkdownForDiscord = require('../utils/sanitizeMarkdownForDiscord.js');

const API_ROOT = process.env.MEADBOT_API_ROOT;
const API_KEY = process.env.CHAT_API_KEY;
const TOPUP_URL = process.env.BMAC_TOPUP_URL;

const SYSTEM_PROMPT =
  'You are MeadBot, a Discord bot for a mead-making community, currently in chat mode.\n\n' +
  'Tools available:\n' +
  '- Mead-brewing calculators (ABV, calories, nutrients, unit conversions, blending, full ' +
  'batch/recipe builds, etc.) -- use them whenever a question calls for a calculation rather ' +
  'than estimating by hand.\n' +
  '- list_meadtools_wiki_pages -- returns an index of pages on https://wiki.meadtools.com, this ' +
  "community's authoritative mead-making reference. Each entry has a title, url, level (0 = " +
  'home, 1 = linked from home, 2 = linked from a level-1 page -- covers specific recipes and ' +
  'other deep pages too, not just top-level topics), category tags, a one-sentence summary, ' +
  'keywords, and related_pages (other page urls on the same topic).\n' +
  '- fetch_meadtools_wiki_page -- fetches one page from that wiki by url and returns its text ' +
  'plus links you can follow to other pages on it.\n\n' +
  'MANDATORY WIKI-FIRST RULE: for any question involving mead-making judgment -- recipe design, ' +
  'technique, troubleshooting, ingredient choices, yeast/nutrient selection, timing, and ' +
  'anything similar that is not a pure calculation -- you MUST consult the wiki before ' +
  'answering, even if you think you already know the answer. Do this efficiently: call ' +
  "list_meadtools_wiki_pages FIRST. Use each entry's summary as your primary signal for " +
  'relevance (it says what the page actually covers, unlike keywords alone), and category/ ' +
  'keywords to narrow among close matches. Then call fetch_meadtools_wiki_page with the ' +
  'matching url(s) directly -- also fetch any related_pages that look relevant to the question, ' +
  'rather than waiting to discover them by reading the first page. Do NOT start by fetching the ' +
  'home page and clicking through links one at a time, that wastes tool calls and you have a ' +
  'limited number per question. Only fetch the home page and follow links from there if the ' +
  'index genuinely has nothing relevant. Base your answer on what the wiki says, not on your ' +
  'own training data -- your training data on mead-making is known to be unreliable and has ' +
  'produced bad advice before. Only answer from your own knowledge if you have actually checked ' +
  'the wiki first and it genuinely has nothing relevant, and if so say so explicitly rather than ' +
  'presenting the answer as if it came from the wiki.\n\n' +
  'DISCORD FORMATTING RULES: Discord message content does not render markdown tables, LaTeX/math ' +
  'notation (e.g. \\text{...}, \\times), or raw HTML tags (e.g. <br>, <table>) -- they show up as ' +
  'literal characters, not formatting, and look broken. Never use any of those. Use plain prose ' +
  'and bullet lists ("- item") instead of tables, **bold**/*italic* for emphasis, plain line ' +
  'breaks instead of <br>, and write formulas out in plain text (e.g. "ABV = (OG - FG) x 131.25") ' +
  'instead of LaTeX.\n\n' +
  'CITING SOURCES: when your answer draws on a page you fetched with fetch_meadtools_wiki_page, ' +
  'end your reply with a "Sources:" section listing each page\'s title and its bare url on its ' +
  'own line, e.g. "Process Summary: https://wiki.meadtools.com/en/process/process_summary". Use ' +
  'the bare url only -- Discord auto-links plain URLs in message content, but does NOT render ' +
  '[text](url) markdown link syntax as a clickable link there, so never use that syntax.\n\n' +
  'Keep replies concise and suited for a Discord chat.';

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
    const replyText = sanitizeMarkdownForDiscord(String(payload.reply));
    const chunks = chunkLines(replyText.split('\n'));
    for (let i = 0; i < chunks.length; i++) {
      if (i === 0) {
        await message.reply(chunks[i]);
      } else {
        await message.channel.send(chunks[i]);
      }
    }
  },
};
