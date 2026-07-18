const { ChannelType } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');

async function countChannelMessages(channel, member, checkDate, state, threshold) {
  let lastId;

  for (;;) {
    if (state.total >= threshold) {
      return;
    }

    const options = { limit: 100 };
    if (lastId) {
      options.before = lastId;
    }

    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) {
      return;
    }

    state.total += messages.filter((m) => m.author.id === member.id).size;
    const lastMessage = messages.last();
    lastId = lastMessage.id;

    if (state.total >= threshold || CalculatorAPI.GetMonthsBetween(lastMessage.createdAt, checkDate, false) > 0) {
      return;
    }
  }
}

// counts how many messages `member` has posted across all of `guild`'s text channels in
// roughly the last month, stopping early once `messageThreshold` total is reached
async function countRecentMessages(guild, member, messageThreshold) {
  const checkDate = new Date();
  const textChannels = [...guild.channels.cache.values()].filter((ch) => ch.type === ChannelType.GuildText);
  const state = { total: 0 };

  await Promise.all(
    textChannels.map((channel) => countChannelMessages(channel, member, checkDate, state, messageThreshold))
  );

  return state.total;
}

module.exports = { countRecentMessages };
