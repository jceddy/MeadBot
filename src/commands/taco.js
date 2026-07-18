const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'taco',
  description: 'Taco!',
  execute(message) {
    const embed = new EmbedBuilder().setImage(
      'https://s23209.pcdn.co/wp-content/uploads/2019/04/Mexican-Street-TacosIMG_9108-1.jpg'
    );
    message.channel.send({ embeds: [embed] });
  },
};
