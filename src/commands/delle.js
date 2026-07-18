const CalculatorAPI = require('../calculator/CalculatorAPI.js');

module.exports = {
  name: 'delle',
  description: 'Estimates Delle units from %ABV and SG.',
  execute(message, args) {
    if (args.length < 2) {
      message.channel.send('Usage: !delle <%abv> <sg>\nExample: !delle 13 1.100');
      return;
    }

    const result = CalculatorAPI.ComputeDelle(parseFloat(args[0]), parseFloat(args[1]));

    if (result.error) {
      if (result.errorType === CalculatorAPI.Constants.ErrorTypes.IS_NAN) {
        message.channel.send(args[result.errorArgumentPosition] + ' is not a number.');
      } else {
        message.channel.send(result.errorMessage);
      }
      return;
    }

    message.channel.send(
      result.abv + '% ABV with ' + result.sg + ' SG is about ' + Math.round(result.delle) + ' Delle Units.'
    );
  },
};
