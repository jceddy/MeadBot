const config = require('../config.js');

module.exports = {
  name: 'doc',
  aliases: ['documentation'],
  description: 'Links to the MeadBot documentation.',
  execute(message) {
    message.channel.send(config.links.documentation);
  },
};
