const CalculatorAPI = require('../calculator/CalculatorAPI.js');

module.exports = {
  name: 'liter',
  aliases: ['liters', 'litre', 'litres'],
  description: 'Converts liters to US gallons.',
  execute(message, args) {
    let liters;
    if (args[0] === 'π') {
      liters = Math.PI;
    } else if (args[0] === 'i') {
      message.channel.send('You are imagining things!');
      return;
    } else {
      liters = parseFloat(args[0]);
    }

    const result = CalculatorAPI.ConvertVolume(liters, 'liters', 'gallons_us');

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
