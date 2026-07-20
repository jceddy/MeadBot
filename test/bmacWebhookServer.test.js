const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const MODULE_PATH = require.resolve('../src/jobs/bmacWebhookServer.js');
const CONFIG_PATH = require.resolve('../src/config.js');

const ENV_KEYS = ['BMAC_WEBHOOK_HOST', 'BMAC_WEBHOOK_PORT', 'BMAC_SIGNING_SECRET', 'BMAC_ANNOUNCE_CHANNEL_ID'];

function loadModule(env) {
  delete require.cache[MODULE_PATH];
  delete require.cache[CONFIG_PATH];
  const previous = {};
  for (const key of ENV_KEYS) {
    previous[key] = process.env[key];
    process.env[key] = env[key] ?? '';
  }
  const mod = require('../src/jobs/bmacWebhookServer.js');
  for (const key of ENV_KEYS) {
    process.env[key] = previous[key];
  }
  return mod;
}

function sign(body, secret) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function makeClient(channel) {
  return {
    channels: {
      cache: {
        get: (id) => (id === 'general-channel' ? channel : undefined),
      },
    },
  };
}

function makeChannel() {
  const sent = [];
  return {
    _sent: sent,
    send: async (text) => {
      sent.push(text);
    },
  };
}

describe('buildAnnouncement', () => {
  it('returns null for event types other than extra_purchase.created', () => {
    const { buildAnnouncement } = loadModule({});
    assert.equal(buildAnnouncement({ type: 'donation.created', data: {} }), null);
    assert.equal(buildAnnouncement(null), null);
  });

  it('builds an announcement from a full payload', () => {
    const { buildAnnouncement } = loadModule({});
    const text = buildAnnouncement({
      type: 'extra_purchase.created',
      data: {
        supporter_name: 'Alex',
        total_amount_charged: 12.5,
        currency: 'usd',
        support_note: 'Keep up the great work!',
        extras: [{ title: 'API budget top-up', question: "What's your Discord username?", answers: ['alex#1234'] }],
      },
    });

    assert.match(text, /\*\*Alex\*\*/);
    assert.match(text, /Discord: alex#1234/);
    assert.match(text, /API budget top-up/);
    assert.match(text, /\$12\.50 USD/);
    assert.match(text, /Keep up the great work!/);
  });

  it('falls back gracefully when optional fields are missing', () => {
    const { buildAnnouncement } = loadModule({});
    const text = buildAnnouncement({ type: 'extra_purchase.created', data: {} });

    assert.match(text, /\*\*Someone\*\*/);
    assert.doesNotMatch(text, /Discord:/);
    assert.doesNotMatch(text, /\$/);
  });

  it('uses amount as a fallback when total_amount_charged is absent', () => {
    const { buildAnnouncement } = loadModule({});
    const text = buildAnnouncement({ type: 'extra_purchase.created', data: { amount: 5 } });
    assert.match(text, /\$5\.00 USD/);
  });
});

describe('verifySignature', () => {
  it('accepts a correctly signed body', () => {
    const { verifySignature } = loadModule({});
    const body = Buffer.from('{"hello":"world"}');
    const secret = 'shh';
    assert.equal(verifySignature(body, sign(body, secret), secret), true);
  });

  it('rejects a wrong signature', () => {
    const { verifySignature } = loadModule({});
    const body = Buffer.from('{"hello":"world"}');
    assert.equal(verifySignature(body, sign(body, 'other-secret'), 'shh'), false);
  });

  it('rejects a missing signature header', () => {
    const { verifySignature } = loadModule({});
    assert.equal(verifySignature(Buffer.from('{}'), undefined, 'shh'), false);
  });
});

describe('bmac webhook HTTP server', () => {
  let server;

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = undefined;
    }
  });

  function baseUrl() {
    return `http://127.0.0.1:${server.address().port}`;
  }

  it('does not start when BMAC_WEBHOOK_PORT/BMAC_SIGNING_SECRET are unset', () => {
    const { start } = loadModule({});
    const result = start(makeClient(makeChannel()));
    assert.equal(result, null);
  });

  it('announces a valid, correctly signed extra purchase event', async () => {
    const { start } = loadModule({
      BMAC_WEBHOOK_PORT: '0',
      BMAC_SIGNING_SECRET: 'shh',
      BMAC_ANNOUNCE_CHANNEL_ID: 'general-channel',
    });
    const channel = makeChannel();
    server = start(makeClient(channel));
    await new Promise((resolve) => server.once('listening', resolve));

    const payload = { type: 'extra_purchase.created', data: { supporter_name: 'Sam', amount: 5 } };
    const body = Buffer.from(JSON.stringify(payload));
    const response = await fetch(baseUrl(), {
      method: 'POST',
      headers: { 'x-signature-sha256': sign(body, 'shh') },
      body,
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });

    // the Discord send happens after the response is written; give the event loop a tick
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(channel._sent.length, 1);
    assert.match(channel._sent[0], /\*\*Sam\*\*/);
  });

  it('rejects a request with an invalid signature and does not announce', async () => {
    const { start } = loadModule({
      BMAC_WEBHOOK_PORT: '0',
      BMAC_SIGNING_SECRET: 'shh',
      BMAC_ANNOUNCE_CHANNEL_ID: 'general-channel',
    });
    const channel = makeChannel();
    server = start(makeClient(channel));
    await new Promise((resolve) => server.once('listening', resolve));

    const body = Buffer.from(JSON.stringify({ type: 'extra_purchase.created', data: {} }));
    const response = await fetch(baseUrl(), {
      method: 'POST',
      headers: { 'x-signature-sha256': sign(body, 'wrong-secret') },
      body,
    });

    assert.equal(response.status, 401);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(channel._sent.length, 0);
  });

  it('rejects malformed JSON with a correct signature', async () => {
    const { start } = loadModule({
      BMAC_WEBHOOK_PORT: '0',
      BMAC_SIGNING_SECRET: 'shh',
      BMAC_ANNOUNCE_CHANNEL_ID: 'general-channel',
    });
    server = start(makeClient(makeChannel()));
    await new Promise((resolve) => server.once('listening', resolve));

    const body = Buffer.from('not json');
    const response = await fetch(baseUrl(), {
      method: 'POST',
      headers: { 'x-signature-sha256': sign(body, 'shh') },
      body,
    });

    assert.equal(response.status, 400);
  });

  it('rejects non-POST requests', async () => {
    const { start } = loadModule({ BMAC_WEBHOOK_PORT: '0', BMAC_SIGNING_SECRET: 'shh' });
    server = start(makeClient(makeChannel()));
    await new Promise((resolve) => server.once('listening', resolve));

    const response = await fetch(baseUrl(), { method: 'GET' });
    assert.equal(response.status, 404);
  });

  it('rejects an oversized body', async () => {
    const { start } = loadModule({ BMAC_WEBHOOK_PORT: '0', BMAC_SIGNING_SECRET: 'shh' });
    server = start(makeClient(makeChannel()));
    await new Promise((resolve) => server.once('listening', resolve));

    const body = Buffer.alloc(1024 * 1024 + 10, 'x');
    const response = await fetch(baseUrl(), {
      method: 'POST',
      headers: { 'x-signature-sha256': sign(body, 'shh') },
      body,
    });

    assert.equal(response.status, 413);
  });

  it('logs instead of throwing when the announce channel is not found', async () => {
    const { start } = loadModule({
      BMAC_WEBHOOK_PORT: '0',
      BMAC_SIGNING_SECRET: 'shh',
      BMAC_ANNOUNCE_CHANNEL_ID: 'missing-channel',
    });
    server = start(makeClient(makeChannel()));
    await new Promise((resolve) => server.once('listening', resolve));

    const body = Buffer.from(JSON.stringify({ type: 'extra_purchase.created', data: {} }));
    const response = await fetch(baseUrl(), {
      method: 'POST',
      headers: { 'x-signature-sha256': sign(body, 'shh') },
      body,
    });

    assert.equal(response.status, 200);
  });
});
