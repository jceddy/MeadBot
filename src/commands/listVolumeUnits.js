const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const chunkLines = require('../utils/chunkMessage.js');

module.exports = {
  name: 'list-volume-units',
  aliases: ['list-volumes'],
  description: 'Lists recognized volume unit names.',
  async execute(message) {
    const lines = CalculatorAPI.ListVolumeUnits().map((entry) => entry.unit + ': ' + entry.name);
    for (const chunk of chunkLines(lines)) {
      await message.channel.send(chunk);
    }
  },
};
