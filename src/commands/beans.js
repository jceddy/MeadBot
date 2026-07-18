const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'beans',
  description: 'Beans.',
  execute(message) {
    const embed = new EmbedBuilder().setImage(
      'https://www.recipetineats.com/wp-content/uploads/2014/05/Homemade-Heinz-Baked-Beans_0-SQ.jpg?w=500&h=375&crop=1'
    );
    message.channel.send({ embeds: [embed] });
  },
};
