const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const mediaPath = require('../utils/mediaPath.js');

module.exports = {
  name: 'closure',
  aliases: ['closures'],
  description: 'Oxygen ingress by closure type.',
  execute(message) {
    const attachment = new AttachmentBuilder(mediaPath('CQCOTRbyClosureTypeSummary2017.pdf'));
    const embed = new EmbedBuilder().addFields({ name: 'CQC', value: 'Oxygen Ingress by Closure Type' });
    message.channel.send({ embeds: [embed], files: [attachment] });
  },
};
