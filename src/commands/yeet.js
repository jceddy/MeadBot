const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mediaPath = require('../utils/mediaPath.js');

module.exports = {
  name: 'yeet',
  description: 'Yeet.',
  execute(message) {
    const attachment = new AttachmentBuilder(mediaPath('video0_1.mov'));
    const embed = new EmbedBuilder().addFields({
      name: 'Herculometer™ - Triple Scale Hydrometer',
      value: 'https://www.midwestsupplies.com/products/herculometertm-triple-scale-hydrometer',
    });
    message.channel.send({ embeds: [embed], files: [attachment] });
  },
};
