const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const MODULE_PATH = require.resolve('../src/commands/chatUsageByUser.js');

function loadCommand(env) {
  delete require.cache[MODULE_PATH];
  const previous = { MEADBOT_API_ROOT: process.env.MEADBOT_API_ROOT, CHAT_API_KEY: process.env.CHAT_API_KEY };
  process.env.MEADBOT_API_ROOT = env.MEADBOT_API_ROOT;
  process.env.CHAT_API_KEY = env.CHAT_API_KEY;
  const command = require('../src/commands/chatUsageByUser.js');
  process.env.MEADBOT_API_ROOT = previous.MEADBOT_API_ROOT;
  process.env.CHAT_API_KEY = previous.CHAT_API_KEY;
  return command;
}

function makeMessage() {
  const sent = [];
  const typed = { count: 0 };
  return {
    channel: {
      send: async (payload) => {
        sent.push(payload);
      },
      sendTyping: async () => {
        typed.count++;
      },
    },
    _sent: sent,
    _typed: typed,
  };
}

let originalFetch;

beforeEach(() => {
  originalFetch = global.fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('!chat-usage-by-user', () => {
  it('reports not configured when MEADBOT_API_ROOT/CHAT_API_KEY are unset', async () => {
    const command = loadCommand({ MEADBOT_API_ROOT: '', CHAT_API_KEY: '' });
    const message = makeMessage();

    await command.execute(message);

    assert.deepEqual(message._sent, ['Chat is not configured on this bot.']);
  });

  it('reports usage per user, with mentions suppressed', async () => {
    const command = loadCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    let capturedUrl;
    let capturedOptions;
    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        json: async () => ({
          error: false,
          usageByUser: [
            {
              userId: 'user-1',
              requestCount: 5,
              totalUsageUsd: 1.2345,
              totalTokens: 10000,
              lastUsedAt: '2026-07-20 01:00:00',
            },
            { userId: null, requestCount: 1, totalUsageUsd: 0, totalTokens: 50, lastUsedAt: '2026-07-19 12:00:00' },
          ],
        }),
      };
    };

    const message = makeMessage();
    await command.execute(message);

    assert.equal(capturedUrl, 'https://api.example.com/api/v1/balance/usage-by-user');
    assert.equal(capturedOptions.headers['X-Api-Key'], 'secret');
    assert.equal(message._typed.count, 1);

    assert.equal(message._sent.length, 1);
    assert.deepEqual(message._sent[0].allowedMentions, { parse: [] });
    assert.equal(
      message._sent[0].content,
      '<@user-1> -- 5 requests, $1.23, 10000 tokens, last used 2026-07-20 01:00:00\n' +
        '(no X-User-Id) -- 1 request, $0.00, 50 tokens, last used 2026-07-19 12:00:00'
    );
  });

  it('reports when there is no usage recorded yet', async () => {
    const command = loadCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => ({ json: async () => ({ error: false, usageByUser: [] }) });

    const message = makeMessage();
    await command.execute(message);

    assert.deepEqual(message._sent, ['No chat usage recorded yet.']);
  });

  it('shows the API error message when the endpoint returns one', async () => {
    const command = loadCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => ({
      json: async () => ({ error: true, errorMessage: 'The balance database is not configured on this server.' }),
    });

    const message = makeMessage();
    await command.execute(message);

    assert.deepEqual(message._sent, ['Chat usage error: The balance database is not configured on this server.']);
  });

  it('reports a network failure without throwing', async () => {
    const command = loadCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => {
      throw new Error('getaddrinfo ENOTFOUND api.example.com');
    };

    const message = makeMessage();
    await command.execute(message);

    assert.deepEqual(message._sent, ['Failed to reach the chat API: getaddrinfo ENOTFOUND api.example.com']);
  });

  it('splits into multiple chunks when the report is long', async () => {
    const command = loadCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const rows = Array.from({ length: 100 }, (_, i) => ({
      userId: `user-${i}`,
      requestCount: 1,
      totalUsageUsd: 0.01,
      totalTokens: 100,
      lastUsedAt: '2026-07-20 01:00:00',
    }));
    global.fetch = async () => ({ json: async () => ({ error: false, usageByUser: rows }) });

    const message = makeMessage();
    await command.execute(message);

    assert.ok(message._sent.length > 1);
    for (const payload of message._sent) {
      assert.ok(payload.content.length <= 1980);
      assert.deepEqual(payload.allowedMentions, { parse: [] });
    }
  });
});
