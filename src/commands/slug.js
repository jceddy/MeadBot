const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const { SLUG_FACTS } = require('../data/facts.js');

module.exports = {
  name: 'slug',
  aliases: ['slug-fact', 'banana-slug', 'banana-slug-fact'],
  description: 'A random banana slug fact.',
  execute(message) {
    message.channel.send(SLUG_FACTS[CalculatorAPI.RandomInteger(SLUG_FACTS.length)]);
  },
};
