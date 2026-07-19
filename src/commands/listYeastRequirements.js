const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const chunkLines = require('../utils/chunkMessage.js');

module.exports = {
  name: 'list-yeast-requirements',
  description: 'Lists known yeasts and their YAN requirement.',
  async execute(message) {
    const lines = CalculatorAPI.ListYeastRequirements().map((entry) => entry.yeast + ': ' + entry.requirement);
    for (const chunk of chunkLines(lines)) {
      await message.channel.send(chunk);
    }
  },
};
