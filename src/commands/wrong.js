const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'wrong',
  aliases: ['someoneiswrong'],
  description: 'Someone is wrong on the internet.',
  execute(message) {
    const embed = new EmbedBuilder().setImage(
      'https://cdn.discordapp.com/attachments/808990352937451540/849857593022218270/Someoneiswrongoninternet.png'
    );
    message.channel.send({ embeds: [embed] });
  },
};
