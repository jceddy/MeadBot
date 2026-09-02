const { EmbedBuilder } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');

const HELP_TEXT = {
  '-v': 'Batch volume as a number.\nExample: !prime -v 5',
  '--volume': 'Batch volume as a number.\nExample: !prime -v 5',
  '-u': 'Volume unit, e.g. "gallons_us", "liters" (default is "gallons_us").\nExample: !prime -u liters',
  '--volume_unit': 'Volume unit, e.g. "gallons_us", "liters" (default is "gallons_us").\nExample: !prime -u liters',
  '-t': "The beer/mead's temperature at/near the end of fermentation, as a number (default is 68).\nExample: !prime -t 65",
  '--temperature':
    "The beer/mead's temperature at/near the end of fermentation, as a number (default is 68).\nExample: !prime -t 65",
  '-f': 'Temperature unit, "f"/"fahrenheit" or "c"/"celsius" (default is "f").\nExample: !prime -f c',
  '--temperature_unit': 'Temperature unit, "f"/"fahrenheit" or "c"/"celsius" (default is "f").\nExample: !prime -f c',
  '-c': 'Target carbonation level in volumes of CO2, e.g. 2.4 (default is 2.4).\nExample: !prime -c 2.8',
  '--target_co2': 'Target carbonation level in volumes of CO2, e.g. 2.4 (default is 2.4).\nExample: !prime -c 2.8',
  '-s': 'Priming sugar to use: "corn_sugar", "table_sugar", "dme", or "honey" (default is "corn_sugar").\nExample: !prime -s honey',
  '--priming_sugar':
    'Priming sugar to use: "corn_sugar", "table_sugar", "dme", or "honey" (default is "corn_sugar").\nExample: !prime -s honey',
};

const USAGE =
  'Usage: !prime [-v|--volume <number>] [-u|--volume_unit <unit>] [-t|--temperature <number>] ' +
  '[-f|--temperature_unit f|c] [-c|--target_co2 <number>] [-s|--priming_sugar corn_sugar|table_sugar|dme|honey] [-h|--help [all]]';

module.exports = {
  name: 'prime',
  aliases: ['priming', 'priming-sugar'],
  description: 'Estimates priming sugar needed to carbonate a batch to a target CO2 level.',
  execute(message, args) {
    let volume = 5;
    let volumeUnit = 'gallons_us';
    let temperature = 68;
    let temperatureUnit = 'f';
    let targetCO2 = 2.4;
    let primingSugar = 'corn_sugar';

    for (let i = 0; i < args.length; i += 2) {
      const argName = args[i];
      const argValue = args.length > i + 1 ? args[i + 1] : '';

      switch (argName) {
        case '-v':
        case '--volume':
          volume = argValue;
          break;
        case '-u':
        case '--volume_unit':
          volumeUnit = argValue;
          break;
        case '-t':
        case '--temperature':
          temperature = argValue;
          break;
        case '-f':
        case '--temperature_unit':
          temperatureUnit = argValue;
          break;
        case '-c':
        case '--target_co2':
          targetCO2 = argValue;
          break;
        case '-s':
        case '--priming_sugar':
          primingSugar = argValue;
          break;
        case '-h':
        case '--help':
          message.channel.send(HELP_TEXT[argValue] || USAGE);
          return;
      }
    }

    const result = CalculatorAPI.CalculatePrimingSugar(volume, volumeUnit, temperature, temperatureUnit, targetCO2, primingSugar);

    if (result.error) {
      message.channel.send(result.errorMessage);
      return;
    }

    const embed = new EmbedBuilder().setTitle('Priming Sugar Calculator').addFields(
      {
        name: 'Batch',
        value: result.volume + ' ' + result.volumeUnit.name + ' at ' + result.temperature + '°' + result.temperatureUnit[0],
        inline: true,
      },
      {
        name: 'Carbonation',
        value: 'Target: ' + result.targetCO2 + ' vols\nResidual (est.): ' + result.residualCO2 + ' vols',
        inline: true,
      },
      {
        name: result.primingSugar.name,
        value: result.primingSugarGrams + ' g (' + result.primingSugarOunces + ' oz)',
        inline: false,
      }
    );
    message.channel.send({ embeds: [embed] });
  },
};
