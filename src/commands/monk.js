const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');

module.exports = {
  name: 'monk',
  aliases: ['jetfuel', 'jetfuelmonk', 'rocketfuel', 'rocketfuelmonk'],
  description: 'The monk.',
  execute(message) {
    const embed = new EmbedBuilder().setImage(config.links.monkImage);
    message.channel.send({ embeds: [embed] });
  },
};
