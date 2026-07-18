module.exports = {
  name: 'restart',
  description: 'Links to advice on restarting a stuck fermentation.',
  execute(message) {
    message.channel.send('<https://scottlab.com/restart-stuck-fermentation-traditional>');
  },
};
