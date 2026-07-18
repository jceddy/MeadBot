const CalculatorAPI = require('../calculator/CalculatorAPI.js');

module.exports = {
  name: 'convert-honey-units',
  aliases: ['convert-honey', 'convert'],
  description: 'Converts an amount of honey between units.',
  execute(message, args) {
    if (args.length < 3) {
      message.channel.send(
        'Usage: !convert-honey-units <amount> <from-unit> <to-unit>\nExample: !convert-honey-units 1.5 kilograms pounds'
      );
      return;
    }

    const result = CalculatorAPI.ConvertHoneyUnits(parseFloat(args[0]), args[1], args[2]);

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
        ' of honey is about ' +
        result.toAmount.toFixed(2) +
        ' ' +
        result.toUnit.name +
        '.'
    );
  },
};
