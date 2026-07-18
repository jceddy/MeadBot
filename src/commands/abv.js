const CalculatorAPI = require('../calculator/CalculatorAPI.js');

module.exports = {
  name: 'abv',
  description: 'Calculates ABV from OG and FG (or an estimated dry FG).',
  execute(message, args) {
    try {
      if (args.length < 1) {
        message.channel.send('Usage: !abv <number> [<number>|dry]');
        return;
      }

      const abvResult = CalculatorAPI.CalculateABV(
        parseFloat(args[0]),
        args.length === 1 || args[1] === 'dry' ? null : parseFloat(args[1])
      );

      if (abvResult.error) {
        if (abvResult.errorType === CalculatorAPI.Constants.ErrorTypes.IS_NAN) {
          message.channel.send(args[abvResult.errorArgumentPosition] + ' is not a number.');
        } else {
          message.channel.send(abvResult.errorMessage);
        }
        return;
      }

      const delleResult = CalculatorAPI.ComputeDelle(abvResult.abv, abvResult.fg);

      message.channel.send(
        'OG: ' +
          abvResult.og.toFixed(3) +
          ', FG: ' +
          abvResult.fg.toFixed(3) +
          ', ABV: ' +
          abvResult.abv.toFixed(2) +
          '%'
      );
      message.channel.send(
        delleResult.abv +
          '% ABV with ' +
          delleResult.sg +
          ' SG is about ' +
          Math.round(delleResult.delle) +
          ' Delle Units.'
      );
    } catch (e) {
      message.channel.send(e.message);
    }
  },
};
