const CalculatorAPI = require('../calculator/CalculatorAPI.js');

module.exports = {
  name: 'gallon',
  aliases: ['gallons'],
  description: 'Converts US gallons to liters.',
  execute(message, args) {
    let gal;
    if (args[0] === 'π') {
      gal = Math.PI;
    } else if (args[0] === 'i') {
      message.channel.send('You are imagining things!');
      return;
    } else {
      gal = parseFloat(args[0]);
    }

    const result = CalculatorAPI.ConvertVolume(gal, 'gallons_us', 'liters');

    if (result.error) {
      if (result.errorType === CalculatorAPI.Constants.ErrorTypes.IS_NAN) {
        message.channel.send('I don\'t know no "' + args[result.errorArgumentPosition] + '"!');
      } else {
        message.channel.send(result.errorMessage);
      }
      return;
    }

    message.channel.send(
      result.fromAmount.toFixed(2) +
        ' ' +
        result.fromUnit.name +
        ' is about ' +
        result.toAmount.toFixed(2) +
        ' ' +
        result.toUnit.name +
        '.'
    );
  },
};
