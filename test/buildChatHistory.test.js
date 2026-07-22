const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { buildChatHistory, stripCommandPrefix, looksLikeChatInvocation } = require('../src/utils/buildChatHistory.js');

function makeClient() {
  return { prefix: '!', user: { id: 'bot-id' } };
}

describe('stripCommandPrefix', () => {
  it('removes a leading "!chat "/"!ask " (any case) and trims the rest', () => {
    assert.equal(stripCommandPrefix('!chat what is my ABV?', '!'), 'what is my ABV?');
    assert.equal(stripCommandPrefix('!ASK   hello  ', '!'), 'hello');
  });
});

describe('looksLikeChatInvocation', () => {
  it('is true for !chat/!ask, false otherwise', () => {
    assert.ok(looksLikeChatInvocation('!chat hi', '!'));
    assert.ok(looksLikeChatInvocation('!ask hi', '!'));
    assert.ok(!looksLikeChatInvocation('!help', '!'));
  });
});

describe('buildChatHistory', () => {
  it('reconstructs plain-text-only history unchanged when no embeds are involved', async () => {
    const byId = {};
    const channel = { messages: { fetch: async (id) => byId[id] } };
    byId.root = { content: '!chat how much honey?', author: { id: 'user-1' }, reference: null, channel };
    byId['bot-1'] = {
      content: "You'll need about 6.9 lbs.",
      author: { id: 'bot-id' },
      reference: { messageId: 'root' },
      channel,
      embeds: [],
    };

    const message = {
      content: '!chat what about kveik?',
      reference: { messageId: 'bot-1' },
      channel,
    };

    const { history } = await buildChatHistory(message, makeClient());

    assert.deepEqual(history, [
      { role: 'user', content: 'how much honey?' },
      { role: 'assistant', content: "You'll need about 6.9 lbs." },
    ]);
  });

  it("folds an embed-only bot reply's fields into the reconstructed assistant turn", async () => {
    const byId = {};
    const channel = { messages: { fetch: async (id) => byId[id] } };
    byId.root = { content: '!chat give me the basics', author: { id: 'user-1' }, reference: null, channel };
    byId['bot-1'] = {
      content: '', // the table-only reply has no plain-text content at all
      author: { id: 'bot-id' },
      reference: { messageId: 'root' },
      channel,
      embeds: [
        {
          fields: [
            { name: 'Target OG', value: '1.110' },
            { name: 'Target ABV', value: '12.3%' },
          ],
        },
      ],
    };

    const message = { content: '!chat what if I want it drier?', reference: { messageId: 'bot-1' }, channel };

    const { history } = await buildChatHistory(message, makeClient());

    assert.deepEqual(history, [
      { role: 'user', content: 'give me the basics' },
      { role: 'assistant', content: 'Target OG: 1.110\nTarget ABV: 12.3%' },
    ]);
  });

  it('combines surrounding text with embed fields when a reply has both', async () => {
    const byId = {};
    const channel = { messages: { fetch: async (id) => byId[id] } };
    byId.root = { content: '!chat give me a recipe', author: { id: 'user-1' }, reference: null, channel };
    byId['bot-1'] = {
      content: 'Here you go:',
      author: { id: 'bot-id' },
      reference: { messageId: 'root' },
      channel,
      embeds: [{ fields: [{ name: 'Ingredient', value: 'Honey' }] }],
    };

    const message = { content: '!chat and if I sub in maple syrup?', reference: { messageId: 'bot-1' }, channel };

    const { history } = await buildChatHistory(message, makeClient());

    assert.deepEqual(history[1], { role: 'assistant', content: 'Here you go:\n\nIngredient: Honey' });
  });

  it('stops walking gracefully when a referenced message cannot be fetched', async () => {
    const channel = {
      messages: {
        fetch: async () => {
          throw new Error('deleted');
        },
      },
    };
    const message = { content: '!chat continue', reference: { messageId: 'missing' }, channel };

    const { history, root } = await buildChatHistory(message, makeClient());

    assert.deepEqual(history, []);
    assert.equal(root, message);
  });
});
