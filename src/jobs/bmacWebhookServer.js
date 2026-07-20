const http = require('http');
const crypto = require('crypto');
const config = require('../config.js');

const PORT = process.env.BMAC_WEBHOOK_PORT;
const HOST = process.env.BMAC_WEBHOOK_HOST || '0.0.0.0';
const SIGNING_SECRET = process.env.BMAC_SIGNING_SECRET;

// Buy Me a Coffee's payloads are small JSON documents; this is generous headroom against a
// misbehaving/malicious sender on this publicly reachable port.
const MAX_BODY_BYTES = 1024 * 1024;

const EXTRA_PURCHASE_EVENT_TYPE = 'extra_purchase.created';

function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const providedBuffer = Buffer.from(signatureHeader, 'utf8');
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

// BMAC lets a creator attach a custom question to an "extra" (e.g. "What's your Discord
// username?"); the buyer's response comes back as that extra's `answers`. There's no dedicated
// Discord-handle field, so this is the only way to recover the attribution the buyer typed in.
function findDiscordAttribution(extras) {
  for (const extra of extras) {
    if (/discord/i.test(extra?.question || '') && Array.isArray(extra?.answers) && extra.answers.length > 0) {
      return extra.answers.filter(Boolean).join(', ');
    }
  }
  return null;
}

function formatAmount(data) {
  const amount = Number(data.total_amount_charged ?? data.amount);
  return Number.isFinite(amount) ? amount.toFixed(2) : null;
}

// buildAnnouncement(payload) - returns the Discord announcement text for an "extra purchase"
// webhook event, or null for any other event type (BMAC may send other event types in the
// future, or a dashboard test ping; those are acknowledged but otherwise ignored).
function buildAnnouncement(payload) {
  if (!payload || payload.type !== EXTRA_PURCHASE_EVENT_TYPE) {
    return null;
  }

  const data = payload.data || {};
  const extras = Array.isArray(data.extras) ? data.extras : [];
  const titles = extras.map((extra) => extra?.title).filter(Boolean);
  const supporterName = data.supporter_name || 'Someone';
  const amount = formatAmount(data);
  const currency = (data.currency || 'USD').toUpperCase();
  const discordHandle = findDiscordAttribution(extras);

  let text = `☕ **${supporterName}**`;
  if (discordHandle) {
    text += ` (Discord: ${discordHandle})`;
  }
  text += ' just topped up the mead-chat budget';
  if (titles.length > 0) {
    text += ` with ${titles.join(', ')}`;
  }
  if (amount) {
    text += ` — $${amount} ${currency}`;
  }
  text += '!';
  if (data.support_note) {
    text += `\n> ${data.support_note}`;
  }
  return text;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        // Don't destroy the socket here -- that would tear down the connection before the 413
        // response below can be written. Just stop buffering and let the rest of the body drain.
        reject(new Error('payload too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handleRequest(client, req, res) {
  if (req.method !== 'POST') {
    res.writeHead(404).end();
    return;
  }

  let rawBody;
  try {
    rawBody = await readBody(req);
  } catch {
    res.writeHead(413).end();
    return;
  }

  if (!verifySignature(rawBody, req.headers['x-signature-sha256'], SIGNING_SECRET)) {
    res.writeHead(401).end();
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.writeHead(400).end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true }));

  const text = buildAnnouncement(payload);
  if (!text) {
    return;
  }

  const channel = client.channels.cache.get(config.channels.bmacAnnounce);
  if (!channel) {
    console.error('bmacAnnounce channel not found; announcement was:', text);
    return;
  }
  channel.send(text).catch((e) => console.error('Failed to send BMAC donation announcement:', e));
}

// start(client) - starts the webhook listener and returns the http.Server, or returns null (and
// logs why) without starting anything if the required config is missing. This is a plain
// http.Server rather than an Express app or similar -- it's a single unauthenticated-by-design
// endpoint (auth is the HMAC signature check above), so a framework would add nothing.
function start(client) {
  if (!PORT || !SIGNING_SECRET) {
    console.log('BMAC webhook server not configured (BMAC_WEBHOOK_PORT/BMAC_SIGNING_SECRET unset); skipping.');
    return null;
  }

  const server = http.createServer((req, res) => {
    handleRequest(client, req, res).catch((e) => {
      console.error('Unhandled error in BMAC webhook handler:', e);
      if (!res.headersSent) {
        res.writeHead(500).end();
      }
    });
  });

  server.listen(Number(PORT), HOST, () => {
    console.log(`BMAC webhook server listening on ${HOST}:${PORT}`);
  });

  return server;
}

module.exports = { start, verifySignature, buildAnnouncement };
