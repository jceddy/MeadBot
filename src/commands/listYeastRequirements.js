const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const chunkLines = require('../utils/chunkMessage.js');

module.exports = {
  name: 'list-yeast-requirements',
  description: 'Lists known yeasts and their YAN requirement.',
  async execute(message) {
    const lines = Object.keys(CalculatorAPI.Constants.YAN_REQUIREMENT_BY_YEAST).map(
      (yeast) =>
        yeast +
        ': ' +
        CalculatorAPI.Constants.YAN_REQUIREMENT_STRING[CalculatorAPI.Constants.YAN_REQUIREMENT_BY_YEAST[yeast]]
    );
    for (const chunk of chunkLines(lines)) {
      await message.channel.send(chunk);
    }
  },
};
