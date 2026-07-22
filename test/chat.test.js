const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const CHAT_MODULE_PATH = require.resolve('../src/commands/chat.js');

function loadChatCommand(env) {
  delete require.cache[CHAT_MODULE_PATH];
  const previous = {
    MEADBOT_API_ROOT: process.env.MEADBOT_API_ROOT,
    CHAT_API_KEY: process.env.CHAT_API_KEY,
    BMAC_TOPUP_URL: process.env.BMAC_TOPUP_URL,
  };
  process.env.MEADBOT_API_ROOT = env.MEADBOT_API_ROOT;
  process.env.CHAT_API_KEY = env.CHAT_API_KEY;
  process.env.BMAC_TOPUP_URL = env.BMAC_TOPUP_URL || '';
  const command = require('../src/commands/chat.js');
  process.env.MEADBOT_API_ROOT = previous.MEADBOT_API_ROOT;
  process.env.CHAT_API_KEY = previous.CHAT_API_KEY;
  process.env.BMAC_TOPUP_URL = previous.BMAC_TOPUP_URL;
  return command;
}

function makeClient(sentDms = []) {
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
  id = 'msg-1',
  content,
  authorId = 'user-1',
  reference = null,
  byId = {},
  guildId = 'guild-1',
  channelId = 'channel-1',
}) {
  const sent = [];
  const replies = [];
  const typed = { count: 0 };

  const channel = {
    send: async (text) => {
      sent.push(text);
    },
    sendTyping: async () => {
      typed.count++;
    },
    messages: {
      fetch: async (id) => {
        if (!byId[id]) {
          throw new Error('unknown message: ' + id);
        }
        return byId[id];
      },
    },
  };

  const message = {
    id,
    content,
    author: { id: authorId, bot: false },
    reference,
    guildId,
    channelId,
    guild: null, // forces notifyOwner down the client.users.fetch path, not guild.members.fetch
    channel,
    reply: async (text) => {
      replies.push(text);
    },
    _sent: sent,
    _replies: replies,
    _typed: typed,
  };
  return message;
}

let originalFetch;

beforeEach(() => {
  originalFetch = global.fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('!chat', () => {
  it('shows usage when no message text is given', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const message = makeMessage({ content: '!chat' });

    await chat.execute(message, [], makeClient());

    assert.equal(message._sent.length, 1);
    assert.match(message._sent[0], /^Usage: !chat/);
  });

  it('reports not configured when MEADBOT_API_ROOT/CHAT_API_KEY are unset', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: '', CHAT_API_KEY: '' });
    const message = makeMessage({ content: '!chat hello' });

    await chat.execute(message, ['hello'], makeClient());

    assert.deepEqual(message._sent, ['Chat is not configured on this bot.']);
  });

  it('sends a system + user message for a fresh conversation and replies with the result', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    let capturedUrl;
    let capturedOptions;
    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return { json: async () => ({ error: false, reply: 'Your ABV is about 13.2%.', messages: [] }) };
    };

    const message = makeMessage({ content: "!chat What's my ABV for OG 1.100, FG 1.000?", authorId: 'user-42' });
    await chat.execute(message, [], makeClient());

    assert.equal(capturedUrl, 'https://api.example.com/api/v1/chat');
    assert.equal(capturedOptions.headers['X-Api-Key'], 'secret');
    assert.equal(capturedOptions.headers['X-User-Id'], 'user-42');

    const body = JSON.parse(capturedOptions.body);
    assert.deepEqual(body.messages, [
      { role: 'system', content: body.messages[0].content },
      { role: 'user', content: "What's my ABV for OG 1.100, FG 1.000?" },
    ]);
    assert.match(body.messages[0].content, /MeadBot/);
    assert.equal(body.model, undefined);

    assert.deepEqual(message._replies, ['Your ABV is about 13.2%.']);
    assert.equal(message._sent.length, 0);
    assert.equal(message._typed.count, 1);
  });

  it('sends the selected model and strips --model from the question text', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    let capturedBody;
    global.fetch = async (_url, options) => {
      capturedBody = JSON.parse(options.body);
      return { json: async () => ({ error: false, reply: 'ok', messages: [] }) };
    };

    const message = makeMessage({ content: '!chat --model ds what is my ABV?' });
    await chat.execute(message, [], makeClient());

    assert.equal(capturedBody.model, 'ds');
    assert.equal(capturedBody.messages.at(-1).content, 'what is my ABV?');
  });

  it('accepts the short -m flag and is case-insensitive on both the flag and the model key', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    let capturedBody;
    global.fetch = async (_url, options) => {
      capturedBody = JSON.parse(options.body);
      return { json: async () => ({ error: false, reply: 'ok', messages: [] }) };
    };

    const message = makeMessage({ content: '!chat -M DS what is my ABV?' });
    await chat.execute(message, [], makeClient());

    assert.equal(capturedBody.model, 'ds');
    assert.equal(capturedBody.messages.at(-1).content, 'what is my ABV?');
  });

  it('rejects an unrecognized --model value without calling the chat API', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    let fetchCalled = false;
    global.fetch = async () => {
      fetchCalled = true;
      return { json: async () => ({ error: false, reply: 'ok', messages: [] }) };
    };

    const message = makeMessage({ content: '!chat --model claude what is my ABV?' });
    await chat.execute(message, [], makeClient());

    assert.equal(fetchCalled, false);
    assert.equal(message._sent.length, 1);
    assert.match(message._sent[0], /Unknown model 'claude'/);
  });

  it('shows usage when --model is given with no value', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const message = makeMessage({ content: '!chat --model' });

    await chat.execute(message, [], makeClient());

    assert.equal(message._sent.length, 1);
    assert.match(message._sent[0], /Missing a model after --model/);
  });

  it('shows usage when --model is given with a value but no question follows', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const message = makeMessage({ content: '!chat --model ds' });

    await chat.execute(message, [], makeClient());

    assert.equal(message._sent.length, 1);
    assert.match(message._sent[0], /^Usage: !chat/);
  });

  it('keeps refreshing the typing indicator on an interval while waiting, and stops once the response arrives', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => ({ json: async () => ({ error: false, reply: 'ok', messages: [] }) });

    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    let capturedCallback;
    let capturedDelay;
    let clearedHandle;
    const fakeHandle = {};
    global.setInterval = (callback, delay) => {
      capturedCallback = callback;
      capturedDelay = delay;
      return fakeHandle;
    };
    global.clearInterval = (handle) => {
      clearedHandle = handle;
    };

    const message = makeMessage({ content: '!chat hi' });
    try {
      await chat.execute(message, [], makeClient());
    } finally {
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
    }

    assert.equal(typeof capturedCallback, 'function');
    assert.ok(capturedDelay > 0 && capturedDelay <= 10000, `expected a sub-10s refresh interval, got ${capturedDelay}`);
    assert.equal(clearedHandle, fakeHandle);

    // The initial call happens before the interval is even set up.
    assert.equal(message._typed.count, 1);
    capturedCallback();
    assert.equal(message._typed.count, 2);
  });

  it('reconstructs conversation history by walking the reply chain', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });

    // Fetched Discord messages carry a `.channel` back-reference (that's how a real Message can
    // resolve its own `.reference` further up the chain), so the mocked parent messages need one
    // too -- otherwise buildHistory's second hop can't look anything up and stops early.
    const byId = {};
    const channel = {
      messages: {
        fetch: async (id) => {
          if (!byId[id]) {
            throw new Error('unknown message: ' + id);
          }
          return byId[id];
        },
      },
    };

    const rootUserMessage = {
      content: '!chat how much honey for 5 gallons at 1.100?',
      author: { id: 'user-1', bot: false },
      reference: null,
      channel,
    };
    const firstBotReply = {
      content: "You'll need about 6.9 lbs of honey.",
      author: { id: 'bot-id', bot: true },
      reference: { messageId: 'root' },
      channel,
    };
    byId.root = rootUserMessage;
    byId['bot-reply-1'] = firstBotReply;

    let capturedBody;
    global.fetch = async (_url, options) => {
      capturedBody = JSON.parse(options.body);
      return { json: async () => ({ error: false, reply: 'And with kveik, about the same.', messages: [] }) };
    };

    const followUp = makeMessage({
      content: '!chat what if I use kveik instead?',
      authorId: 'user-1',
      reference: { messageId: 'bot-reply-1' },
      byId,
    });

    await chat.execute(followUp, [], makeClient());

    assert.deepEqual(capturedBody.messages.slice(1), [
      { role: 'user', content: 'how much honey for 5 gallons at 1.100?' },
      { role: 'assistant', content: "You'll need about 6.9 lbs of honey." },
      { role: 'user', content: 'what if I use kveik instead?' },
    ]);
    assert.deepEqual(followUp._replies, ['And with kveik, about the same.']);
  });

  it('stops walking history gracefully when a referenced message cannot be fetched', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    let capturedBody;
    global.fetch = async (_url, options) => {
      capturedBody = JSON.parse(options.body);
      return { json: async () => ({ error: false, reply: 'ok', messages: [] }) };
    };

    const message = makeMessage({
      content: '!chat continue',
      reference: { messageId: 'missing' },
      byId: {},
    });

    await chat.execute(message, [], makeClient());

    assert.deepEqual(capturedBody.messages.slice(1), [{ role: 'user', content: 'continue' }]);
  });

  it('shows the API error message when the chat endpoint returns one', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => ({
      json: async () => ({ error: true, errorMessage: 'Missing or invalid X-Api-Key header.' }),
    });

    const message = makeMessage({ content: '!chat hi' });
    await chat.execute(message, [], makeClient());

    assert.deepEqual(message._sent, ['Chat error: Missing or invalid X-Api-Key header.']);
  });

  it('appends the top-up link when the chat endpoint reports insufficientBalance', async () => {
    const chat = loadChatCommand({
      MEADBOT_API_ROOT: 'https://api.example.com',
      CHAT_API_KEY: 'secret',
      BMAC_TOPUP_URL: 'https://buymeacoffee.com/jceddy/extras',
    });
    global.fetch = async () => ({
      json: async () => ({
        error: true,
        errorMessage: 'Chat backend error: Fireworks request failed (HTTP 402): Insufficient balance',
        insufficientBalance: true,
      }),
    });

    const message = makeMessage({ content: '!chat hi' });
    await chat.execute(message, [], makeClient());

    assert.deepEqual(message._sent, [
      'Chat error: Chat backend error: Fireworks request failed (HTTP 402): Insufficient balance\n' +
        'The AI usage budget is empty -- help top it up: https://buymeacoffee.com/jceddy/extras',
    ]);
  });

  it('omits the top-up link on an insufficientBalance error when BMAC_TOPUP_URL is unset', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => ({
      json: async () => ({ error: true, errorMessage: 'insufficient balance', insufficientBalance: true }),
    });

    const message = makeMessage({ content: '!chat hi' });
    await chat.execute(message, [], makeClient());

    assert.deepEqual(message._sent, ['Chat error: insufficient balance']);
  });

  it('replies with a friendly message and DMs the owner when the tool-iteration cap is exceeded', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => ({
      json: async () => ({
        error: true,
        errorMessage: 'Chat backend error: Exceeded maximum tool-calling iterations (6).',
        exceededToolIterations: true,
      }),
    });

    const sentDms = [];
    const client = makeClient(sentDms);
    const message = makeMessage({
      id: 'msg-42',
      content: '!chat what is the meaning of life?',
      authorId: 'user-7',
      guildId: 'guild-1',
      channelId: 'channel-1',
    });
    await chat.execute(message, [], client);

    assert.deepEqual(message._sent, []);
    assert.deepEqual(message._replies, [
      "I don't know the answer to that -- maybe try asking a different way, or a more specific question?",
    ]);

    assert.equal(sentDms.length, 1);
    assert.match(sentDms[0], /tool-calling iteration cap for <@user-7>/);
    assert.match(sentDms[0], /https:\/\/discord\.com\/channels\/guild-1\/channel-1\/msg-42/);
    assert.match(sentDms[0], /what is the meaning of life\?/);
  });

  it('reports a network failure without throwing', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => {
      throw new Error('getaddrinfo ENOTFOUND api.example.com');
    };

    const message = makeMessage({ content: '!chat hi' });
    await chat.execute(message, [], makeClient());

    assert.deepEqual(message._sent, ['Failed to reach the chat API: getaddrinfo ENOTFOUND api.example.com']);
  });

  it('includes error.cause when fetch throws its generic "fetch failed" error', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => {
      const error = new TypeError('fetch failed');
      error.cause = new Error('connect ECONNREFUSED 127.0.0.1:443');
      throw error;
    };

    const message = makeMessage({ content: '!chat hi' });
    await chat.execute(message, [], makeClient());

    assert.deepEqual(message._sent, ['Failed to reach the chat API: fetch failed: connect ECONNREFUSED 127.0.0.1:443']);
  });

  it('chunks a long reply, replying only to the first chunk', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    const longReply = Array.from({ length: 5 }, () => 'x'.repeat(700)).join('\n');
    global.fetch = async () => ({ json: async () => ({ error: false, reply: longReply, messages: [] }) });

    const message = makeMessage({ content: '!chat give me a long answer' });
    await chat.execute(message, [], makeClient());

    assert.equal(message._replies.length, 1);
    assert.ok(message._sent.length >= 1);
    for (const chunk of [...message._replies, ...message._sent]) {
      assert.ok(chunk.length <= 1980);
    }
  });

  it('sanitizes Discord-unsafe markdown/HTML out of the reply before sending it', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => ({
      json: async () => ({
        error: false,
        reply: 'OG \\approx 1.100<br>| Ingredient | Amount |\n|---|---|\n| Honey | 3.2lb |',
        messages: [],
      }),
    });

    const message = makeMessage({ content: '!chat give me a recipe' });
    await chat.execute(message, [], makeClient());

    const sent = [...message._replies, ...message._sent].join('\n');
    assert.ok(!sent.includes('<br>'));
    assert.ok(!sent.includes('\\approx'));
    assert.ok(!sent.includes('---'));
    assert.ok(sent.includes('≈'));
    assert.ok(sent.includes('Honey'));
  });

  it('preserves original casing/punctuation from the raw message content, not the lowercased args array', async () => {
    const chat = loadChatCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    let capturedBody;
    global.fetch = async (_url, options) => {
      capturedBody = JSON.parse(options.body);
      return { json: async () => ({ error: false, reply: 'ok', messages: [] }) };
    };

    const message = makeMessage({ content: "!chat What's My ABV?" });
    // messageCreate.js lowercases args before passing them; execute() must not rely on them for
    // the actual message text.
    await chat.execute(message, ["what's", 'my', 'abv?'], makeClient());

    assert.equal(capturedBody.messages.at(-1).content, "What's My ABV?");
  });
});
