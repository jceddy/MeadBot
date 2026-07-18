const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mediaPath = require('../utils/mediaPath.js');

module.exports = {
  name: 'kahm',
  description: 'What kahm yeast looks like.',
  execute(message) {
    const attachment = new AttachmentBuilder(mediaPath('kahm.jpg'), { name: 'kahm.jpg' });
    const embed = new EmbedBuilder().setImage('attachment://kahm.jpg');
    message.channel.send({ embeds: [embed], files: [attachment] });
  },
};
