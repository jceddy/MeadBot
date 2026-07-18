const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const { DOG_FACTS } = require('../data/facts.js');

module.exports = {
  name: 'dog',
  aliases: ['dog-fact'],
  description: 'A random dog fact.',
  execute(message) {
    message.channel.send(DOG_FACTS[CalculatorAPI.RandomInteger(DOG_FACTS.length)]);
  },
};
