const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'chili',
  description: 'Chili (with or without beans, depending on where you are from).',
  execute(message) {
    const nickname = message.member ? message.member.displayName : '';
    const imageUrl = nickname.includes('TX')
      ? 'https://www.mamalovesfood.com/wp-content/uploads/2014/01/CHILI-RECIPE-WITHOUT-BEANS-500x500.jpg'
      : 'https://www.thewholesomedish.com/wp-content/uploads/2018/05/The-Best-Classic-Chili-550-500x375.jpg';
    const embed = new EmbedBuilder().setImage(imageUrl);
    message.channel.send({ embeds: [embed] });
  },
};
