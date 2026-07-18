const config = require('../config.js');

module.exports = {
  name: 'funding',
  description: 'Links to a way to support MeadBot development.',
  execute(message) {
    message.channel.send(config.links.funding);
  },
};
