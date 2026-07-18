const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'bees',
  description: 'Bees!',
  execute(message) {
    const embed = new EmbedBuilder().setImage('https://media4.giphy.com/media/2jukgZs1AECkGNxAL2/giphy.gif');
    message.channel.send({ embeds: [embed] });
  },
};
