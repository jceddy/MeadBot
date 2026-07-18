const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mediaPath = require('../utils/mediaPath.js');

module.exports = {
  name: 'so2',
  description: 'SO2.',
  execute(message) {
    const attachment = new AttachmentBuilder(mediaPath('so2.jpg'), { name: 'so2.jpg' });
    const embed = new EmbedBuilder().setImage('attachment://so2.jpg');
    message.channel.send({ embeds: [embed], files: [attachment] });
  },
};
