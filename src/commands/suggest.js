const config = require('../config.js');

module.exports = {
  name: 'suggest',
  aliases: ['s', 'suggestion'],
  description: 'Sends a suggestion to the suggestions channel.',
  async execute(message) {
    const suggestionMessage = message.content.substr(message.content.indexOf(' ') + 1);
    const suggestionsChannel = message.client.channels.cache.get(config.channels.suggestions);
    if (suggestionsChannel) {
      await suggestionsChannel.send(message.author.toString() + ': ' + suggestionMessage);
    }
    message.channel.send('Thanks for the suggestion!');
  },
};
