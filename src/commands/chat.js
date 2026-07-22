const { EmbedBuilder } = require('discord.js');
const chunkLines = require('../utils/chunkMessage.js');
const describeFetchError = require('../utils/describeFetchError.js');
const sanitizeMarkdownForDiscord = require('../utils/sanitizeMarkdownForDiscord.js');
const parseTableSegments = require('../utils/parseTableSegments.js');
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
  'NUMERIC CONSISTENCY RULE: when you add prose around a calculated number -- step-by-step ' +
  'instructions, a comparison ("that\'s more than X"), a caveat ("not your full Y"), etc. -- only ' +
  'state it if you have actually checked it against the numbers a calculator just returned. Do ' +
  'not add a qualifier, comparison, or practical aside you have not verified is numerically ' +
  'consistent with those numbers -- this has produced backwards or nonsensical statements before ' +
  '(e.g. describing a smaller quantity as more than a larger one). If you are not sure a comparison ' +
  'holds, state the calculated number plainly instead of editorializing around it.\n\n' +
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
  'NEVER suggest deliberately stopping/interrupting a fermentation that is already in progress ' +
  '(e.g. cold-crashing early, adding stabilizer mid-ferment) to hit a target gravity/ABV. Your ' +
  'training data likely treats this as viable, but this community considers it bad practice -- ' +
  'it risks a stuck/stressed fermentation, off-flavors, and refermentation in the bottle if it ' +
  "doesn't fully halt. If a user wants a specific final gravity/sweetness/ABV, point them to " +
  'legitimate approaches instead: choosing a yeast strain for the right alcohol tolerance, ' +
  'back-sweetening after fermentation has naturally finished, or step feeding -- never describe ' +
  'how to interrupt an in-progress fermentation, even if asked directly.\n\n' +
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
  { key: 'ds', label: 'DeepSeek-V4-Flash' },
  { key: 'gpt', label: 'gpt-oss-120b' },
];
const MODEL_OPTIONS_TEXT = MODEL_OPTIONS.map(
  ({ key, label }, i) => `'${key}' (${label}${i === 0 ? ', default' : ''})`
).join(' or ');

const USAGE =
  'Usage: !chat [--model ds|gpt] <message> -- or reply to one of my chat responses with !chat <message> to continue ' +
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

// Discord embed field limits (https://discord.com/developers/docs/resources/message#embed-object-embed-limits).
const MAX_FIELD_NAME_LENGTH = 256;
const MAX_FIELD_VALUE_LENGTH = 1024;
const MAX_EMBED_FIELDS = 25;

// truncate(text, limit) - Discord rejects an empty field name/value, so a blank cell falls back
// to a zero-width space; anything over the limit is cut with an ellipsis rather than erroring.
function truncate(text, limit) {
  const value = text && text.length > 0 ? text : '\u200b';
  return value.length > limit ? value.slice(0, limit - 1) + '…' : value;
}

// buildTableEmbed(segment) - lays a parseTableSegments() table segment out as a Discord embed,
// since Discord's message content doesn't render markdown tables at all (unlike embeds, which
// also render bold/italic properly -- a code-block table wouldn't). Every field is non-inline
// (one full-width field per row): an earlier one-field-per-column layout with inline:true looked
// right on desktop, but Discord's mobile client doesn't reliably pack inline fields side by side
// -- a 4-column table rendered as four separate stacked lists instead of a grid. Stacking rows
// instead is less compact but renders identically and correctly on every client. 'keyValue'
// segments (an unheaded 2-column block, e.g. "Target volume | 1.18 gal" next to "Target ABV |
// 12.3%" -- independent facts, not two columns of anything) use the row's own two cells directly
// as the field's name/value. 'columns' segments (a real header, confirmed by a GFM separator row,
// or an unheaded 3+-column block) name each field after the first column's value (prefixed with
// its header, e.g. "Addition: 1") and list the remaining columns as "header: value" lines.
function buildTableEmbed(segment) {
  const fields =
    segment.mode === 'keyValue'
      ? segment.pairs.map(([key, value]) => ({
          name: truncate(key, MAX_FIELD_NAME_LENGTH),
          value: truncate(value, MAX_FIELD_VALUE_LENGTH),
          inline: false,
        }))
      : segment.dataRows.map((row) => ({
          name: truncate(`${segment.header[0]}: ${row[0]}`, MAX_FIELD_NAME_LENGTH),
          value: truncate(
            row
              .slice(1)
              .map((cell, i) => `${segment.header[i + 1]}: ${cell}`)
              .join('\n'),
            MAX_FIELD_VALUE_LENGTH
          ),
          inline: false,
        }));

  return new EmbedBuilder().addFields(fields.slice(0, MAX_EMBED_FIELDS));
}

// buildReplyPayloads(rawReply) - turns the model's raw reply into an ordered list of Discord
// send payloads: a plain string for each chunk of ordinary text (same chunkLines()-based
// splitting as before, so the 2000-char message limit is still respected), and a
// `{ embeds: [...] }` object for each table -- callers pass these straight to
// message.reply()/channel.send(), both of which accept either shape.
function buildReplyPayloads(rawReply) {
  const segments = parseTableSegments(sanitizeMarkdownForDiscord(rawReply));
  const payloads = [];
  for (const segment of segments) {
    if (segment.type === 'table') {
      payloads.push({ embeds: [buildTableEmbed(segment)] });
    } else {
      payloads.push(...chunkLines(segment.text.split('\n')));
    }
  }
  return payloads;
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

    // Reply only to the first payload, so a follow-up reply from the user has exactly one
    // message in the chain to anchor to per turn.
    const payloads = buildReplyPayloads(String(payload.reply));
    for (let i = 0; i < payloads.length; i++) {
      if (i === 0) {
        await message.reply(payloads[i]);
      } else {
        await message.channel.send(payloads[i]);
      }
    }
  },
};
