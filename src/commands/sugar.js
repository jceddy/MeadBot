const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const chunkLines = require('../utils/chunkMessage.js');

module.exports = {
  name: 'sugar',
  aliases: ['sugar-source'],
  description: 'Sugar content of a named sugar source, or a list of all known sources.',
  async execute(message, args) {
    if (args.length > 0) {
      const sourceId = CalculatorAPI.GetSugarSourceIdentifier(args[0]);
      if (sourceId == null) {
        message.channel.send('Unknown sugar source: ' + args[0]);
      } else {
        const source = CalculatorAPI.Constants.SUGAR_SOURCE_INFO[sourceId];
        message.channel.send(source.name + ' contain(s) about ' + source.percent.toFixed(2) + '% sugar by volume');
      }
      return;
    }

    const lines = CalculatorAPI.Constants.SUGAR_SOURCE_INFO.map(
      (source) => source.name + ': ' + source.percent.toFixed(2) + '%'
    );
    for (const chunk of chunkLines(lines)) {
      await message.channel.send(chunk);
    }
  },
};
