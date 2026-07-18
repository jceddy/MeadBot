const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const chunkLines = require('../utils/chunkMessage.js');

module.exports = {
  name: 'list-volume-units',
  aliases: ['list-volumes'],
  description: 'Lists recognized volume unit names.',
  async execute(message) {
    const lines = Object.keys(CalculatorAPI.Constants.VOLUME_UNITS).map(
      (unit) =>
        unit.toLowerCase() +
        ': ' +
        CalculatorAPI.Constants.VOLUME_UNIT_INFO[CalculatorAPI.Constants.VOLUME_UNITS[unit]].name
    );
    for (const chunk of chunkLines(lines)) {
      await message.channel.send(chunk);
    }
  },
};
