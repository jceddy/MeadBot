const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const CHEF_QUIPS = require('../data/chefQuips.js');

module.exports = {
  name: 'quip',
  aliases: ['chef', 'chef-quip'],
  description: 'A quip from Chef, or a specific one by name.',
  execute(message, args) {
    let quip = null;
    if (args.length > 0 && Object.prototype.hasOwnProperty.call(CHEF_QUIPS, args[0])) {
      quip = CHEF_QUIPS[args[0]];
    }
    if (quip == null) {
      const keys = Object.keys(CHEF_QUIPS);
      quip = CHEF_QUIPS[keys[CalculatorAPI.RandomInteger(keys.length)]];
    }
    message.channel.send('"' + quip + '" -- Chef');
  },
};
