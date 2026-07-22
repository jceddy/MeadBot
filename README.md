# MeadBot

Discord bot to help make Mead.

## Setup

Requires Node.js 18 or newer (discord.js v14's dependencies use syntax that doesn't parse on
older versions — this will otherwise fail with a cryptic `SyntaxError` deep inside
`node_modules` rather than a clear version-mismatch error).

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your bot token:

   ```
   cp .env.example .env
   ```

   By default, MeadBot's moderation and passive-reaction features (see below) are configured
   for its original home server. Set `HONEYPOT_CHANNEL_ID` to enable the honeypot moderation
   feature (it's disabled by default), and override the other IDs in `.env` to run on a
   different server. See `.env.example` for the full list.

   In the [Discord Developer Portal](https://discord.com/developers/applications), enable the
   **Server Members Intent** and **Message Content Intent** for your bot application — MeadBot
   needs both.

3. Start the bot:
   ```
   npm start
   ```

## Commands

MeadBot uses prefix commands (default prefix: `!`, configurable via `PREFIX` in `.env`). Run
`!help` in a channel MeadBot can see for the full, current list — it's generated from the
loaded commands, so it's always accurate. Highlights:

- Mead-brewing calculators: `!abv`, `!calories`, `!delle`, `!build-batch`, `!calculate-nutrients`,
  `!potential-alcohol`, `!calculate-blend`, `!calculate-mead`, `!sugar`, `!convert-volume`,
  `!convert-honey-units`, `!convert-temp`, `!gallon`, `!liter`, `!list-volume-units`,
  `!list-yeast-requirements`.
- Community/fun: `!cat`, `!dog`, `!slug`, `!quip`, `!suggest`, and a handful of image/link
  commands (`!kahm`, `!yeet`, `!closure`, `!bees`, `!taco`, etc).
- Info: `!wiki`, `!doc`, `!recipes`, `!mmm`, `!eligibility`, `!version`, `!funding`.
- Admin: `!stop`.
- `!chat` (alias `!ask`): chat with an LLM assistant backed by MeadBotAPI's calculators, plus two
  tools grounding it in [wiki.meadtools.com](https://wiki.meadtools.com/en/home) (restricted to
  that host) — a static page index (title, url, category, a one-sentence summary, keywords, and
  related pages) it should check first to find the right page directly, and a page fetcher (which
  can also follow links) for drilling in or for anything the index doesn't cover. The system
  prompt requires the model to consult the wiki before answering mead-making
  judgment calls (recipe design, technique, troubleshooting) that aren't a pure calculation,
  rather than relying on its own training data, and to cite wiki pages it used inline next to the
  claims they support (as bare URLs -- Discord doesn't render `[text](url)` markdown links in
  message content) rather than in one list at the end. The prompt also steers it away from
  markdown tables/LaTeX/raw HTML tags, none of which render in Discord messages -- and since
  prompt instructions aren't fully reliable, `sanitizeMarkdownForDiscord` (`src/utils/`) also
  cleans up whatever slips through before the reply is sent: `<br>`/table tags become plain text,
  LaTeX-style notation (`\times`, `\text{...}`, etc.) is converted to plain text, and bare URLs
  are wrapped in `<angle brackets>` so Discord doesn't generate a link-preview embed for them. A
  CommonMark thematic break (`---`, `***`, `- - -`, etc., meant as a horizontal rule) is normalized
  to a fixed-width line of a proper horizontal-line character, since Discord doesn't render those
  either and the model's own dash count can be as short as 3 characters. Separately,
  `parseTableSegments.js` finds markdown/GFM tables (and the model's more common habit of a bare
  `|`-delimited row per line with no real table syntax at all) and `chat.js` renders each one as a
  Discord embed instead of plain text — the only way bold/italic emphasis inside cells actually
  renders, since a monospace code-block table doesn't render markdown at all. Every embed field is
  non-inline (one full-width field per row) rather than one field per column — Discord's mobile
  client doesn't reliably pack inline fields side by side, so a multi-column table laid out that
  way rendered as several separate stacked lists instead of a grid. A block with no confirmed
  header (no GFM `---` separator row) and exactly two columns is treated as a list of independent
  key/value facts (e.g. a field named "Target OG" with value "1.110"); any other table gets one
  field per data row instead, named after its first column (e.g. "Addition: 1") with the remaining
  columns listed as "header: value" lines in the field's value. Reconstructed conversation history
  (see below) and negative-feedback records fold a table reply's embed fields back into plain text
  (`assistantMessageText` in `buildChatHistory.js`), so a table-only reply (no surrounding text at
  all) isn't lost from context on a follow-up. The system prompt also flatly prohibits ever
  suggesting a fermentation-in-progress be deliberately stopped/interrupted (cold-crashing early,
  stabilizing mid-ferment) to hit a target gravity — bad practice this community avoids, even
  though it's a common enough suggestion in general brewing/mead training data that the model
  needs to be told not to reach for it; back-sweetening after natural completion, yeast selection,
  and step feeding are the legitimate alternatives it's pointed to instead. Reply to one of its
  responses with another
  `!chat`/`!ask` to continue that conversation — MeadBot reconstructs history from the reply
  chain rather than keeping its own session state. Requires `MEADBOT_API_ROOT` and `CHAT_API_KEY`
  in `.env`; without them it reports itself as not configured. If MeadBotAPI's Fireworks balance
  runs out, the error reply includes the `BMAC_TOPUP_URL` link (see `!topup`) so a user can top
  it up. If the chat agent exhausts its tool-calling budget without reaching an answer, the user
  gets a friendly "I don't know the answer to that" reply instead of the raw backend error, and
  the bot owner is DMed (same recipient as an unhandled command error) with the question and a
  jump link to it, for investigation. A leading `--model`/`-m` flag picks which LLM MeadBotAPI
  runs the question against — `ds` (DeepSeek-V4-Flash, the default) or `gpt` (gpt-oss-120b), e.g.
  `!chat --model gpt what's my ABV?` — an unrecognized value is rejected with the two valid
  options rather than silently falling back to the default. The typing indicator is kept alive
  with a repeated `sendTyping()` every few seconds for the whole wait on MeadBotAPI, since Discord
  clears it after about 10 seconds and a chat reply (especially one involving several tool calls)
  routinely takes longer than that.
- `!topup`: posts the `BMAC_TOPUP_URL` link for donating toward `!chat`'s AI usage budget.
- `!chatbudget`: reports `!chat`'s remaining Fireworks AI usage budget (deposits minus usage cost,
  from MeadBotAPI's `GET /balance`), including the `!topup` link if it's run out.
- `!chat-usage-by-user`: reports `!chat` usage broken down per Discord user (request count, cost,
  tokens, last used), from MeadBotAPI's `GET /balance/usage-by-user`. Mentions are posted with
  notifications suppressed, so running this report doesn't ping everyone listed in it.

Each calculator command supports `-h`/`--help` (optionally `-h all` for the full usage string).

### Moderation and passive reactions

Beyond commands, MeadBot also (both configurable/disableable via `.env`, see above):

- Auto-bans anyone who posts in a configured "honeypot" channel (unless they're an admin or
  hold an exempt role) — set `HONEYPOT_CHANNEL_ID` to enable.
- Runs a daily job that deletes old messages from its own admin/spam channels.
- Listens for Buy Me a Coffee "extra purchase" donation webhooks and announces them in
  `BMAC_ANNOUNCE_CHANNEL_ID` (with Discord-handle attribution, if the supporter answered a
  "Discord username" question on the extra) — set `BMAC_WEBHOOK_PORT` and `BMAC_SIGNING_SECRET`
  to enable; the port must already be reachable from the internet (firewall/port-forwarding),
  since MeadBot doesn't manage that itself. Purely an announcement — it does not touch
  MeadBotAPI's balance ledger; topping that up from a donation is a manual step.
- Reacts or replies to certain keywords/phrases in messages (scoped to the configured guild
  where noted in `src/reactions/passiveReactions.js`).
- Watches for a 👎 reaction on one of its own `!chat`/`!ask` replies. If confirmed (the reacted-to
  message must be a reply whose reply chain traces back to a `!chat`/`!ask` invocation — this
  rules out unrelated bot replies like `!help`'s), it reconstructs the conversation and records it
  via MeadBotAPI's `POST /api/v1/chat/feedback`, then DMs the bot owner (same recipient as an
  unhandled command error) with a jump link to the message and whether persisting succeeded.
- Watches `version.json` for changes (checked roughly every 4 seconds) and exits if it differs
  from the version loaded at startup, so a deploy that updates `version.json` triggers a
  restart under the systemd service. See `!version` and [Versioning](#versioning) below.

## Versioning

`version.json` at the repo root holds the app's running version, e.g. `{ "version": "2.0.0" }`.
It's intentionally separate from `package.json`'s version, since its only purpose is to signal
the running process to restart — bump it as part of a release when you want a live deploy to
pick up new code (the systemd service must be configured to restart the process on exit for
this to work; MeadBot itself only exits, it doesn't restart itself). `!version` reports the
version that was loaded at startup.

## Project structure

- `src/index.js` - Bot entry point, sets up the Discord client.
- `src/config.js` - Discord IDs (channels/guild/roles/users) and content links, sourced from
  `.env` with defaults matching MeadBot's original home server.
- `src/commands/` - One file per command, each exporting
  `{ name, aliases?, description, execute(message, args, client) }`.
- `src/events/` - One file per Discord.js event, each exporting `{ name, once, execute(...args, client) }`.
- `src/handlers/` - Loads commands (including aliases) and events at startup.
- `src/calculator/` - Mead-brewing calculator functions and constants (unit conversions, ABV,
  calories, Delle number, nutrient-schedule math, blending math), independent of Discord.js.
- `src/data/` - Static content (facts, chef quips, presence activities).
- `src/jobs/` - Background work: the old-message cleanup job, the version-file watcher, and the
  contest-eligibility message-counting helper.
- `src/version.js` - Reads `version.json`.
- `src/moderation/` - The honeypot-channel auto-ban logic.
- `src/reactions/` - Passive (non-command) keyword-triggered reactions.
- `src/utils/` - Small shared helpers (media file paths, message chunking, DM/notify helpers).
- `test/` - Unit tests, run with `npm test`.

### Adding a command

Add a new file to `src/commands/` exporting `{ name, aliases?, description, execute(message, args, client) }`.
It's picked up automatically on startup, including any aliases.

### Adding an event

Add a new file to `src/events/` exporting `{ name, once, execute(...args, client) }`. It's picked up automatically on startup.

## Development

- `npm test` - Run the unit test suite (Node's built-in test runner).
- `npm run lint` - Check for lint errors.
- `npm run lint:fix` - Auto-fix lint errors where possible.
- `npm run format` - Format the codebase with Prettier.
