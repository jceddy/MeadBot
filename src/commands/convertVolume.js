const CalculatorAPI = require('../calculator/CalculatorAPI.js');

module.exports = {
  name: 'convert-volume',
  aliases: ['volume'],
  description: 'Converts a volume between units.',
  execute(message, args) {
    if (args.length < 3) {
      message.channel.send(
        'Usage: !convert-volume <amount> <from-unit> <to-unit>\nExample: !convert-volume 1 gallons_us liters'
      );
      return;
    }

    const result = CalculatorAPI.ConvertVolume(parseFloat(args[0]), args[1], args[2]);

    if (result.error) {
      if (result.errorType === CalculatorAPI.Constants.ErrorTypes.IS_NAN) {
        message.channel.send(args[result.errorArgumentPosition] + ' is not a number.');
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
