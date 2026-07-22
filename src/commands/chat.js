const chunkLines = require('../utils/chunkMessage.js');
const describeFetchError = require('../utils/describeFetchError.js');
const sanitizeMarkdownForDiscord = require('../utils/sanitizeMarkdownForDiscord.js');
const { buildChatHistory, stripCommandPrefix } = require('../utils/buildChatHistory.js');
const notifyOwner = require('../utils/notifyOwner.js');
const jumpLink = require('../utils/jumpLink.js');

const API_ROOT = process.env.MEADBOT_API_ROOT;
const API_KEY = process.env.CHAT_API_KEY;
const TOPUP_URL = process.env.BMAC_TOPUP_URL;

const SYSTEM_PROMPT =
  'You are MeadBot, a Discord bot for a mead-making community, currently in chat mode.\n\n' +
  'Tools available:\n' +
  '- Mead-brewing calculators (ABV, calories, nutrients/SNA schedules, unit conversions ' +
  '(volume, honey, temperature), blending, full batch/recipe builds, sugar-source and ' +
  'yeast-requirement lookups, date/hours-string helpers, etc.) -- see the MANDATORY ' +
  'CALCULATOR-FIRST RULE below.\n' +
  '- list_meadtools_wiki_pages -- returns an index of pages on https://wiki.meadtools.com, this ' +
  "community's authoritative mead-making reference. Each entry has a title, url, level (0 = " +
  'home, 1 = linked from home, 2 = linked from a level-1 page -- covers specific recipes and ' +
  'other deep pages too, not just top-level topics), category tags, a one-sentence summary, ' +
  'keywords, and related_pages (other page urls on the same topic).\n' +
  '- fetch_meadtools_wiki_page -- fetches one page from that wiki by url and returns its text ' +
  'plus links you can follow to other pages on it.\n\n' +
  'MANDATORY CALCULATOR-FIRST RULE: for any question involving a mead-making calculation -- ABV, ' +
  'calories, gravity/Brix/Delle conversions, volume/honey/temperature unit conversions, blending ' +
  'two liquids, or a nutrient/SNA schedule or full batch/recipe build -- you MUST call the ' +
  'matching calculator tool rather than computing or estimating it yourself, even if you are ' +
  'confident of the formula. Your own arithmetic is not reliable for this and has produced wrong ' +
  'answers before; the calculators are exact. This applies even inside an answer that is ' +
  'otherwise wiki-grounded -- use the wiki for judgment/technique and a calculator tool for any ' +
  "number in the same reply. If a calculator's required inputs are ambiguous or missing, ask the " +
  'user rather than guessing values to fill them in.\n\n' +
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
  'CITING SOURCES: when a claim in your answer comes from a page you fetched with ' +
  'fetch_meadtools_wiki_page, cite it inline right next to that claim -- e.g. "...three ' +
  'additions 24h apart (https://wiki.meadtools.com/en/process/nutrient_schedules)." -- rather ' +
  'than collecting every source into one "Sources:" list at the end of the reply. Use the bare ' +
  'url only -- Discord auto-links plain URLs in message content, but does NOT render [text](url) ' +
  'markdown link syntax as a clickable link there, so never use that syntax. Wrapping a url in ' +
  '<angle brackets> keeps Discord from showing a big preview card for it; do this if you can, ' +
  "but don't worry about it otherwise -- it happens automatically either way.\n\n" +
  'Keep replies concise and suited for a Discord chat.';

// Keys accepted by --model/-m, matching MeadBotAPI's Chat\ModelCatalog. The first is the default
// (used whenever the flag is omitted).
const MODEL_OPTIONS = [
  { key: 'gpt', label: 'gpt-oss-120b' },
  { key: 'ds', label: 'DeepSeek-V4-Flash' },
];
const MODEL_OPTIONS_TEXT = MODEL_OPTIONS.map(
  ({ key, label }, i) => `'${key}' (${label}${i === 0 ? ', default' : ''})`
).join(' or ');

const USAGE =
  'Usage: !chat [--model gpt|ds] <message> -- or reply to one of my chat responses with !chat <message> to continue ' +
  `that conversation. --model/-m picks the LLM: ${MODEL_OPTIONS_TEXT}.`;

// How often to re-send the "typing..." indicator while waiting on MeadBotAPI, so it stays visible
// for the whole wait instead of disappearing after Discord's ~10s timeout. Discord.js has no
// "start typing and leave it on" API -- sendTyping() must be called repeatedly.
const TYPING_REFRESH_INTERVAL_MS = 8000;

// parseModelArgs(rawText) - pulls a leading "--model <key>"/"-m <key>" flag (case-insensitive) off
// the raw (post-prefix) message text. Returns the resolved model key (null to use the default),
// the remaining text to treat as the actual question, and `error` (a user-facing message) when
// the flag is present but its value is missing or unrecognized.
function parseModelArgs(rawText) {
  const words = rawText.split(/\s+/);
  const flag = words[0].toLowerCase();
  if (flag !== '--model' && flag !== '-m') {
    return { modelKey: null, userText: rawText, error: null };
  }

  const value = words[1] ? words[1].toLowerCase() : null;
  if (value === null) {
    return { modelKey: null, userText: '', error: `Missing a model after ${words[0]} -- use ${MODEL_OPTIONS_TEXT}.` };
  }
  if (!MODEL_OPTIONS.some((option) => option.key === value)) {
    return { modelKey: null, userText: '', error: `Unknown model '${value}' -- use ${MODEL_OPTIONS_TEXT}.` };
  }

  return { modelKey: value, userText: words.slice(2).join(' '), error: null };
}

module.exports = {
  name: 'chat',
  aliases: ['ask'],
  description:
    "Chat with an LLM assistant that has MeadBot's calculators as tools. Reply to one of its responses to continue the conversation.",
  async execute(message, args, client) {
    const rawText = stripCommandPrefix(message.content, client.prefix);
    if (!rawText) {
      await message.channel.send(USAGE);
      return;
    }

    const { modelKey, userText, error: modelError } = parseModelArgs(rawText);
    if (modelError) {
      await message.channel.send(modelError);
      return;
    }
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
      ({ history } = await buildChatHistory(message, client));
    } catch (error) {
      await message.channel.send('Failed to read the conversation history: ' + error.message);
      return;
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: userText }];
    const body = modelKey ? { messages, model: modelKey } : { messages };

    await message.channel.sendTyping();
    const typingInterval = setInterval(() => {
      message.channel.sendTyping().catch(() => {});
    }, TYPING_REFRESH_INTERVAL_MS);

    let payload;
    try {
      const response = await fetch(`${API_ROOT}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': API_KEY,
          'X-User-Id': message.author.id,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
      payload = await response.json();
    } catch (error) {
      await message.channel.send('Failed to reach the chat API: ' + describeFetchError(error));
      return;
    } finally {
      clearInterval(typingInterval);
    }

    if (payload.error) {
      if (payload.exceededToolIterations) {
        await notifyOwner(
          client,
          message.guild,
          `!chat hit the tool-calling iteration cap for <@${message.author.id}>: ${jumpLink(message)}\nQuestion: ${userText}`
        );
        await message.reply(
          "I don't know the answer to that -- maybe try asking a different way, or a more specific question?"
        );
        return;
      }

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
