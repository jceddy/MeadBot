// jumpLink(message) - a Discord "jump to message" URL, using @me for the guild segment when
// message.guildId is unset (a DM channel).
module.exports = function jumpLink(message) {
  return `https://discord.com/channels/${message.guildId || '@me'}/${message.channelId}/${message.id}`;
};
