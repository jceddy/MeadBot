const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const MODULE_PATH = require.resolve('../src/commands/chatbudget.js');

function loadChatBudgetCommand(env) {
  delete require.cache[MODULE_PATH];
  const previous = {
    MEADBOT_API_ROOT: process.env.MEADBOT_API_ROOT,
    CHAT_API_KEY: process.env.CHAT_API_KEY,
    BMAC_TOPUP_URL: process.env.BMAC_TOPUP_URL,
  };
  process.env.MEADBOT_API_ROOT = env.MEADBOT_API_ROOT;
  process.env.CHAT_API_KEY = env.CHAT_API_KEY;
  process.env.BMAC_TOPUP_URL = env.BMAC_TOPUP_URL || '';
  const command = require('../src/commands/chatbudget.js');
  process.env.MEADBOT_API_ROOT = previous.MEADBOT_API_ROOT;
  process.env.CHAT_API_KEY = previous.CHAT_API_KEY;
  process.env.BMAC_TOPUP_URL = previous.BMAC_TOPUP_URL;
  return command;
}

function makeMessage() {
  const sent = [];
  const typed = { count: 0 };
  return {
    channel: {
      send: async (text) => {
        sent.push(text);
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

describe('!chatbudget', () => {
  it('reports not configured when MEADBOT_API_ROOT/CHAT_API_KEY are unset', async () => {
    const chatbudget = loadChatBudgetCommand({ MEADBOT_API_ROOT: '', CHAT_API_KEY: '' });
    const message = makeMessage();

    await chatbudget.execute(message);

    assert.deepEqual(message._sent, ['Chat is not configured on this bot.']);
  });

  it('reports the balance from the API', async () => {
    const chatbudget = loadChatBudgetCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    let capturedUrl;
    let capturedOptions;
    global.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        json: async () => ({
          error: false,
          balance: { totalDepositsUsd: 25, totalUsageUsd: 8.4231, balanceUsd: 16.5769 },
        }),
      };
    };

    const message = makeMessage();
    await chatbudget.execute(message);

    assert.equal(capturedUrl, 'https://api.example.com/api/v1/balance');
    assert.equal(capturedOptions.headers['X-Api-Key'], 'secret');
    assert.deepEqual(message._sent, ['Chat AI budget: $16.58 remaining ($25.00 deposited, $8.42 used so far).']);
    assert.equal(message._typed.count, 1);
  });

  it('appends the top-up link when the balance is exhausted', async () => {
    const chatbudget = loadChatBudgetCommand({
      MEADBOT_API_ROOT: 'https://api.example.com',
      CHAT_API_KEY: 'secret',
      BMAC_TOPUP_URL: 'https://buymeacoffee.com/jceddy/extras',
    });
    global.fetch = async () => ({
      json: async () => ({
        error: false,
        balance: { totalDepositsUsd: 10, totalUsageUsd: 10, balanceUsd: 0 },
      }),
    });

    const message = makeMessage();
    await chatbudget.execute(message);

    assert.deepEqual(message._sent, [
      'Chat AI budget: $0.00 remaining ($10.00 deposited, $10.00 used so far).\n' +
        'Help keep !chat running: https://buymeacoffee.com/jceddy/extras',
    ]);
  });

  it('omits the top-up link when the balance is exhausted but BMAC_TOPUP_URL is unset', async () => {
    const chatbudget = loadChatBudgetCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => ({
      json: async () => ({
        error: false,
        balance: { totalDepositsUsd: 10, totalUsageUsd: 12, balanceUsd: -2 },
      }),
    });

    const message = makeMessage();
    await chatbudget.execute(message);

    assert.deepEqual(message._sent, ['Chat AI budget: -$2.00 remaining ($10.00 deposited, $12.00 used so far).']);
  });

  it('shows the API error message when the balance endpoint returns one', async () => {
    const chatbudget = loadChatBudgetCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => ({
      json: async () => ({ error: true, errorMessage: 'The balance database is not configured on this server.' }),
    });

    const message = makeMessage();
    await chatbudget.execute(message);

    assert.deepEqual(message._sent, ['Chat budget error: The balance database is not configured on this server.']);
  });

  it('reports a network failure without throwing', async () => {
    const chatbudget = loadChatBudgetCommand({ MEADBOT_API_ROOT: 'https://api.example.com', CHAT_API_KEY: 'secret' });
    global.fetch = async () => {
      throw new Error('getaddrinfo ENOTFOUND api.example.com');
    };

    const message = makeMessage();
    await chatbudget.execute(message);

    assert.deepEqual(message._sent, ['Failed to reach the chat API: getaddrinfo ENOTFOUND api.example.com']);
  });
});
