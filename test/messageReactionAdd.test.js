const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const MODULE_PATH = require.resolve('../src/events/messageReactionAdd.js');

function loadHandler(env) {
  delete require.cache[MODULE_PATH];
  const previous = { MEADBOT_API_ROOT: process.env.MEADBOT_API_ROOT, CHAT_API_KEY: process.env.CHAT_API_KEY };
  process.env.MEADBOT_API_ROOT = env.MEADBOT_API_ROOT;
  process.env.CHAT_API_KEY = env.CHAT_API_KEY;
  const handler = require('../src/events/messageReactionAdd.js');
  process.env.MEADBOT_API_ROOT = previous.MEADBOT_API_ROOT;
  process.env.CHAT_API_KEY = previous.CHAT_API_KEY;
  return handler;
}

function makeClient(sentDms) {
  return {
    prefix: '!',
    user: { id: 'bot-id' },
    users: {
      fetch: async () => ({
        send: async (text) => sentDms.push(text),
      }),
    },
  };
}

function makeMessage({
  id,
  content,
  authorId,
  reference = null,
  byId = {},
  guildId = 'guild-1',
  channelId = 'channel-1',
  partial = false,
}) {
  return {
    id,
    content,
    author: { id: authorId },
    reference,
    guildId,
    channelId,
    guild: null, // forces notifyOwner down the client.users.fetch path, not guild.members.fetch
    partial,
    fetch: async function () {
      this.partial = false;
      return this;
    },
    channel: {
      messages: {
        fetch: async (msgId) => {
          if (!byId[msgId]) {
            throw new Error('unknown message: ' + msgId);
          }
          return byId[msgId];
        },
      },
    },
  };
}

function makeReaction({ emojiName = '👎', message, partial = false }) {
  return {
    emoji: { name: emojiName },
    message,
    partial,
    fetch: async function () {
      this.partial = false;
      return this;
    },
  };
}

let originalFetch;

beforeEach(() => {
  originalFetch = global.fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('messageReactionAdd', () => {
  it('ignores reactions from bots', async () => {
    const handler = loadHandler({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const sentDms = [];
    const client = makeClient(sentDms);
    const message = makeMessage({ id: 'm1', content: 'reply', authorId: 'bot-id', reference: { messageId: 'root' } });
    const reaction = makeReaction({ message });

    await handler.execute(reaction, { id: 'user-1', bot: true }, client);

    assert.deepEqual(sentDms, []);
  });

  it('ignores non-thumbs-down emoji', async () => {
    const handler = loadHandler({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const sentDms = [];
    const client = makeClient(sentDms);
    const message = makeMessage({ id: 'm1', content: 'reply', authorId: 'bot-id', reference: { messageId: 'root' } });
    const reaction = makeReaction({ emojiName: '👍', message });

    await handler.execute(reaction, { id: 'user-1', bot: false }, client);

    assert.deepEqual(sentDms, []);
  });

  it('ignores reactions on messages not authored by the bot', async () => {
    const handler = loadHandler({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const sentDms = [];
    const client = makeClient(sentDms);
    const message = makeMessage({
      id: 'm1',
      content: 'reply',
      authorId: 'someone-else',
      reference: { messageId: 'root' },
    });
    const reaction = makeReaction({ message });

    await handler.execute(reaction, { id: 'user-1', bot: false }, client);

    assert.deepEqual(sentDms, []);
  });

  it('ignores reactions on a bot message with no reference', async () => {
    const handler = loadHandler({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const sentDms = [];
    const client = makeClient(sentDms);
    const message = makeMessage({ id: 'm1', content: 'reply', authorId: 'bot-id', reference: null });
    const reaction = makeReaction({ message });

    await handler.execute(reaction, { id: 'user-1', bot: false }, client);

    assert.deepEqual(sentDms, []);
  });

  it('ignores a reply chain that did not originate from !chat/!ask (e.g. !help)', async () => {
    const handler = loadHandler({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const sentDms = [];
    const client = makeClient(sentDms);

    const rootHelpMessage = { content: '!help', author: { id: 'user-1' }, reference: null };
    const byId = { root: rootHelpMessage };
    const message = makeMessage({
      id: 'm1',
      content: 'help text',
      authorId: 'bot-id',
      reference: { messageId: 'root' },
      byId,
    });

    const reaction = makeReaction({ message });
    await handler.execute(reaction, { id: 'user-1', bot: false }, client);

    assert.deepEqual(sentDms, []);
  });

  it('records feedback and DMs the owner for a valid 👎 on a !chat reply', async () => {
    const handler = loadHandler({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const sentDms = [];
    const client = makeClient(sentDms);

    const rootUserMessage = {
      content: '!chat how much honey for 5 gallons?',
      author: { id: 'user-1' },
      reference: null,
    };
    const byId = { root: rootUserMessage };
    const message = makeMessage({
      id: 'bot-reply-1',
      content: "You'll need about 15 lbs of honey.",
      authorId: 'bot-id',
      reference: { messageId: 'root' },
      byId,
      guildId: 'guild-1',
      channelId: 'channel-1',
    });

    let capturedUrl;
    let capturedBody;
    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return { json: async () => ({ error: false }) };
    };

    const reaction = makeReaction({ message });
    await handler.execute(reaction, { id: 'user-2', bot: false }, client);

    assert.equal(capturedUrl, 'https://api.example.com/api/v1/chat/feedback');
    assert.equal(capturedBody.discordUserId, 'user-2');
    assert.equal(capturedBody.discordMessageId, 'bot-reply-1');
    assert.equal(capturedBody.discordChannelId, 'channel-1');
    assert.equal(capturedBody.discordGuildId, 'guild-1');
    assert.deepEqual(capturedBody.messages, [
      { role: 'user', content: 'how much honey for 5 gallons?' },
      { role: 'assistant', content: "You'll need about 15 lbs of honey." },
    ]);

    assert.equal(sentDms.length, 1);
    assert.match(sentDms[0], /Negative feedback on a !chat reply from <@user-2>/);
    assert.match(sentDms[0], /https:\/\/discord\.com\/channels\/guild-1\/channel-1\/bot-reply-1/);
    assert.match(sentDms[0], /Persisted to the feedback database\./);
  });

  it('DMs the owner noting the failure when the feedback API returns an error', async () => {
    const handler = loadHandler({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const sentDms = [];
    const client = makeClient(sentDms);

    const rootUserMessage = {
      content: '!ask what temperature should I ferment at?',
      author: { id: 'user-1' },
      reference: null,
    };
    const byId = { root: rootUserMessage };
    const message = makeMessage({
      id: 'bot-reply-1',
      content: '60-70F.',
      authorId: 'bot-id',
      reference: { messageId: 'root' },
      byId,
    });

    global.fetch = async () => ({
      json: async () => ({ error: true, errorMessage: 'The feedback database is not configured on this server.' }),
    });

    const reaction = makeReaction({ message });
    await handler.execute(reaction, { id: 'user-2', bot: false }, client);

    assert.equal(sentDms.length, 1);
    assert.match(sentDms[0], /Failed to persist feedback: The feedback database is not configured on this server\./);
  });

  it('DMs the owner noting a network failure reaching the feedback endpoint', async () => {
    const handler = loadHandler({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const sentDms = [];
    const client = makeClient(sentDms);

    const rootUserMessage = { content: '!chat hi', author: { id: 'user-1' }, reference: null };
    const byId = { root: rootUserMessage };
    const message = makeMessage({
      id: 'bot-reply-1',
      content: 'hello!',
      authorId: 'bot-id',
      reference: { messageId: 'root' },
      byId,
    });

    global.fetch = async () => {
      throw new Error('getaddrinfo ENOTFOUND api.example.com');
    };

    const reaction = makeReaction({ message });
    await handler.execute(reaction, { id: 'user-2', bot: false }, client);

    assert.equal(sentDms.length, 1);
    assert.match(sentDms[0], /Failed to reach the chat API: getaddrinfo ENOTFOUND api\.example\.com/);
  });

  it('notes chat is not configured instead of attempting to persist', async () => {
    const handler = loadHandler({ MEADBOT_API_ROOT: '', CHAT_API_KEY: '' });
    const sentDms = [];
    const client = makeClient(sentDms);

    const rootUserMessage = { content: '!chat hi', author: { id: 'user-1' }, reference: null };
    const byId = { root: rootUserMessage };
    const message = makeMessage({
      id: 'bot-reply-1',
      content: 'hello!',
      authorId: 'bot-id',
      reference: { messageId: 'root' },
      byId,
    });

    const reaction = makeReaction({ message });
    await handler.execute(reaction, { id: 'user-2', bot: false }, client);

    assert.equal(sentDms.length, 1);
    assert.match(sentDms[0], /Not persisted -- chat is not configured on this bot\./);
  });

  it('resolves partial reactions and messages before checking them', async () => {
    const handler = loadHandler({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const sentDms = [];
    const client = makeClient(sentDms);

    const rootUserMessage = { content: '!chat hi', author: { id: 'user-1' }, reference: null };
    const byId = { root: rootUserMessage };
    const message = makeMessage({
      id: 'bot-reply-1',
      content: 'hello!',
      authorId: 'bot-id',
      reference: { messageId: 'root' },
      byId,
      partial: true,
    });

    global.fetch = async () => ({ json: async () => ({ error: false }) });

    const reaction = makeReaction({ message, partial: true });
    await handler.execute(reaction, { id: 'user-2', bot: false }, client);

    assert.equal(reaction.partial, false);
    assert.equal(message.partial, false);
    assert.equal(sentDms.length, 1);
  });

  it('uses @me in the jump link for a reaction with no guild (DM)', async () => {
    const handler = loadHandler({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const sentDms = [];
    const client = makeClient(sentDms);

    const rootUserMessage = { content: '!chat hi', author: { id: 'user-1' }, reference: null };
    const byId = { root: rootUserMessage };
    const message = makeMessage({
      id: 'bot-reply-1',
      content: 'hello!',
      authorId: 'bot-id',
      reference: { messageId: 'root' },
      byId,
      guildId: null,
    });

    global.fetch = async () => ({ json: async () => ({ error: false }) });

    const reaction = makeReaction({ message });
    await handler.execute(reaction, { id: 'user-2', bot: false }, client);

    assert.match(sentDms[0], /https:\/\/discord\.com\/channels\/@me\/channel-1\/bot-reply-1/);
  });
});
