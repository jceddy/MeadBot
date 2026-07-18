const CalculatorAPI = require('../calculator/CalculatorAPI.js');

module.exports = {
  name: 'convert-temp',
  aliases: ['temp'],
  description: 'Converts a temperature between Fahrenheit and Celsius.',
  execute(message, args) {
    if (args.length < 2) {
      message.channel.send('Usage: !convert-temp <amount> <from-unit>\nExample: !convert-temp 68 fahrenheit');
      return;
    }

    const result = CalculatorAPI.ConvertTemperature(parseFloat(args[0]), args[1]);

    if (result.error) {
      if (result.errorType === CalculatorAPI.Constants.ErrorTypes.IS_NAN) {
        message.channel.send(args[result.errorArgumentPosition] + ' is not a number.');
      } else {
        message.channel.send(result.errorMessage);
      }
      return;
    }

    message.channel.send(
      result.fromTemperature.toFixed(2) +
        ' ' +
        result.fromUnit +
        ' is about ' +
        result.toTemperature.toFixed(2) +
        ' ' +
        result.toUnit +
        '.'
    );
  },
};
