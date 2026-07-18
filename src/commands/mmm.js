module.exports = {
  name: 'mmm',
  aliases: ['reddit'],
  description: 'Links to r/MeadMaking.',
  execute(message) {
    message.channel.send('https://www.reddit.com/r/MeadMaking/');
  },
};
