module.exports = {
  name: 'recipes',
  description: 'Links to starter recipes on the wiki.',
  execute(message) {
    message.channel.send('https://wiki.meadtools.com/recipes');
  },
};
