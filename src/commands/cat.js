const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const { CAT_FACTS } = require('../data/facts.js');

module.exports = {
  name: 'cat',
  aliases: ['cat-fact'],
  description: 'A random cat fact.',
  execute(message) {
    message.channel.send(CAT_FACTS[CalculatorAPI.RandomInteger(CAT_FACTS.length)]);
  },
};
