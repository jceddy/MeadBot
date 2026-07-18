const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mediaPath = require('../utils/mediaPath.js');

module.exports = {
  name: 'wrong',
  aliases: ['someoneiswrong'],
  description: 'Someone is wrong on the internet.',
  execute(message) {
    const attachment = new AttachmentBuilder(mediaPath('someoneiswrong.png'), { name: 'someoneiswrong.png' });
    const embed = new EmbedBuilder().setImage('attachment://someoneiswrong.png');
    message.channel.send({ embeds: [embed], files: [attachment] });
  },
};
