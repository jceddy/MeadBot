const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'so2',
  description: 'SO2.',
  execute(message) {
    const embed = new EmbedBuilder().setImage(
      'https://cdn.discordapp.com/attachments/842519648481443860/852904704144441375/image0.jpg'
    );
    message.channel.send({ embeds: [embed] });
  },
};
