// Discord IDs and content links used by moderation, passive reactions, and a few commands.
// All IDs default to MeadBot's original home server (The Mead Hall) so behavior is unchanged
// out of the box; override via .env to run against a different server.

function idList(envValue, defaults) {
  if (!envValue) {
    return defaults;
  }
  return envValue
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

module.exports = {
  prefix: process.env.PREFIX || '!',

  channels: {
    adminBotSpam: process.env.ADMIN_BOT_SPAM_CHANNEL_ID || '769614143178539058',
    botSpam: process.env.BOT_SPAM_CHANNEL_ID || '628776700947464212',
    thunderDome: process.env.THUNDERDOME_CHANNEL_ID || '849176853247164427',
    suggestions: process.env.SUGGESTIONS_CHANNEL_ID || '850485656039718932',
    honeyPot: process.env.HONEYPOT_CHANNEL_ID || '',
    // channels where MeadBot banters back when mentioned or at random
    banter: idList(process.env.BANTER_CHANNEL_IDS, ['795859577371361280', '803440059927101440']),
  },

  guilds: {
    theMeadHall: process.env.MEAD_HALL_GUILD_ID || '627621875408961537',
  },

  roles: {
    honeyPotExempt: process.env.HONEYPOT_EXEMPT_ROLE_ID || '627648402452119588',
    trollRoleName: process.env.TROLL_ROLE_NAME || 'Troll',
  },

  owner: {
    userId: process.env.BOT_OWNER_USER_ID || '387809758645583872',
    searchQuery: process.env.BOT_OWNER_SEARCH_QUERY || 'jceddy',
  },

  // users who get an occasional random easter-egg response
  easterEggUsers: {
    yeah: process.env.EASTER_EGG_USER_YEAH || '434021120392560650',
    reactOnly: idList(process.env.EASTER_EGG_USERS_REACT, ['151512855018078208', '576914402230403088']),
  },

  emoji: {
    chiliBean: process.env.EMOJI_CHILI_BEAN || '633921580589776896',
    chiliNoBean: process.env.EMOJI_CHILI_NO_BEAN || '769317507164536833',
    raisin: process.env.EMOJI_RAISIN || '633926630783582208',
    texas: process.env.EMOJI_TEXAS || '649132593375215626',
    minnesota: process.env.EMOJI_MINNESOTA || '649138373696421890',
    chicago: process.env.EMOJI_CHICAGO || '803346794632839180',
    easterEggReact: process.env.EMOJI_EASTER_EGG_REACT || '797672299573542934',
  },

  links: {
    documentation: process.env.DOCUMENTATION_URL || 'https://www.jceddy.com/meadbot/MeadBot%20Documentation.pdf',
    monkImage: process.env.MONK_IMAGE_URL || 'https://www.jceddy.com/meadbot/monk.jpg',
    paddlinImage: process.env.PADDLIN_IMAGE_URL || 'https://www.jceddy.com/images/paddlin.jpg',
  },

  moderation: {
    // how many days of inactivity before a channel's old messages are cleaned up
    cleanupIntervalMs: Number(process.env.CLEANUP_INTERVAL_MS) || 86400000,
  },
};
