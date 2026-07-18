const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');

module.exports = {
  name: 'paddlin',
  description: "Everybody's got a big but, but this is a paddlin'.",
  execute(message) {
    const embed = new EmbedBuilder().setImage(config.links.paddlinImage);
    message.channel.send({ embeds: [embed] });
  },
};
