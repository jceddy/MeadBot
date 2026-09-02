const { EmbedBuilder } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const Priming = require('../calculator/PrimingCalculator.js');
const Constants = CalculatorAPI.Constants;

const GRAMS_PER_OUNCE = 28.3495231;

const HELP_TEXT = {
  '-v': 'Volume should be the batch size, as a number, in the units specified by --volume_units (default is 5).\nExample: !prime -v 5',
  '--volume':
    'Volume should be the batch size, as a number, in the units specified by --volume_units (default is 5).\nExample: !prime -v 5',
  '-w': 'Use the command !list-volume-units to get a list of acceptable input volume units (defaults to "gallons_us").\nExample: !prime -v 5 -w gallons_us',
  '--volume_units':
    'Use the command !list-volume-units to get a list of acceptable input volume units (defaults to "gallons_us").\nExample: !prime -v 5 -w gallons_us',
  '-t': 'Temperature should be the highest temperature the batch reached after fermentation finished (defaults to 68). Warmer holds less dissolved CO2, so a warmer batch needs more priming sugar.\nExample: !prime -t 68',
  '--temperature':
    'Temperature should be the highest temperature the batch reached after fermentation finished (defaults to 68). Warmer holds less dissolved CO2, so a warmer batch needs more priming sugar.\nExample: !prime -t 68',
  '-x': 'Temperature units should be "fahrenheit" or "celsius" (defaults to "fahrenheit").\nExample: !prime -t 68 -x fahrenheit',
  '--temperature_units':
    'Temperature units should be "fahrenheit" or "celsius" (defaults to "fahrenheit").\nExample: !prime -t 68 -x fahrenheit',
  '-c': 'Target CO2 should be the desired carbonation level in volumes of CO2 (defaults to 2.5). Typical references: ~1.5-2.0 for a still/lightly petillant mead, ~2.5-3.0 for standard sparkling, ~3.0+ for champagne-style (needs bottles rated for the pressure).\nExample: !prime -c 2.5',
  '--co2':
    'Target CO2 should be the desired carbonation level in volumes of CO2 (defaults to 2.5). Typical references: ~1.5-2.0 for a still/lightly petillant mead, ~2.5-3.0 for standard sparkling, ~3.0+ for champagne-style (needs bottles rated for the pressure).\nExample: !prime -c 2.5',
  '-s': 'Sugar should be "corn_sugar" (dextrose) or "table_sugar" (sucrose) (defaults to "corn_sugar").\nExample: !prime -s corn_sugar',
  '--sugar':
    'Sugar should be "corn_sugar" (dextrose) or "table_sugar" (sucrose) (defaults to "corn_sugar").\nExample: !prime -s corn_sugar',
};

const USAGE =
  'Usage: !prime [-v|--volume <number>] [-w|--volume_units <string>] [-t|--temperature <number>] [-x|--temperature_units fahrenheit|celsius] [-c|--co2 <number>] [-s|--sugar corn_sugar|table_sugar] [-h|--help [all]]';

function getSugarType(value) {
  switch (value) {
    case 'corn_sugar':
    case 'corn':
    case 'dextrose':
      return Priming.SUGAR_TYPES.CORN_SUGAR;
    case 'table_sugar':
    case 'sugar':
    case 'sucrose':
      return Priming.SUGAR_TYPES.TABLE_SUGAR;
    default:
      return null;
  }
}

module.exports = {
  name: 'prime',
  aliases: ['priming', 'priming-sugar'],
  description: 'Calculates how much priming sugar to add for bottle-conditioning a batch.',
  execute(message, args) {
    let volume = 5;
    let volumeUnits = 'gallons_us';
    let temperature = 68;
    let temperatureUnits = Constants.TEMPERATURE_UNITS.FAHRENHEIT;
    let targetCO2 = 2.5;
    let sugarType = Priming.SUGAR_TYPES.CORN_SUGAR;

    if (args.length === 0) {
      args = ['-h', 'all'];
    }
    for (let i = 0; i < args.length; i += 2) {
      const argName = args[i];
      const argValue = args.length > i + 1 ? args[i + 1] : '';

      switch (argName) {
        case '-v':
        case '--volume':
          volume = parseFloat(argValue);
          if (isNaN(volume)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          if (volume <= 0 || volume > 500) {
            message.channel.send('Volume out of range: ' + volume.toFixed(2));
            return;
          }
          break;
        case '-w':
        case '--volume_units':
          if (CalculatorAPI.GetVolumeUnit(argValue) == null) {
            message.channel.send('Unrecognized value for volume_units: ' + argValue);
            return;
          }
          volumeUnits = argValue;
          break;
        case '-t':
        case '--temperature':
          temperature = parseFloat(argValue);
          if (isNaN(temperature)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-x':
        case '--temperature_units':
          if (argValue === 'fahrenheit') {
            temperatureUnits = Constants.TEMPERATURE_UNITS.FAHRENHEIT;
          } else if (argValue === 'celsius') {
            temperatureUnits = Constants.TEMPERATURE_UNITS.CELSIUS;
          } else {
            message.channel.send('Unrecognized value for temperature_units: ' + argValue);
            return;
          }
          break;
        case '-c':
        case '--co2':
          targetCO2 = parseFloat(argValue);
          if (isNaN(targetCO2)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          if (targetCO2 <= 0 || targetCO2 > 6) {
            message.channel.send('Target CO2 out of range: ' + targetCO2.toFixed(2));
            return;
          }
          break;
        case '-s':
        case '--sugar': {
          const parsedSugarType = getSugarType(argValue);
          if (parsedSugarType == null) {
            message.channel.send('Unrecognized value for sugar: ' + argValue);
            return;
          }
          sugarType = parsedSugarType;
          break;
        }
        case '-h':
        case '--help':
          message.channel.send(HELP_TEXT[argValue] || USAGE);
          return;
      }
    }

    // reject out-of-range Fahrenheit values after unit resolution, in whatever unit was given
    const fahrenheitCheck =
      temperatureUnits === Constants.TEMPERATURE_UNITS.CELSIUS ? (temperature * 9) / 5 + 32 : temperature;
    if (fahrenheitCheck < 32 || fahrenheitCheck > 100) {
      message.channel.send('Temperature out of range: ' + temperature.toFixed(1));
      return;
    }

    const volumeResult = CalculatorAPI.ConvertVolume(volume, volumeUnits, 'liters');
    if (volumeResult.error) {
      message.channel.send(volumeResult.errorMessage);
      return;
    }

    const result = Priming.calculatePrimingSugar(
      volumeResult.toAmount,
      temperature,
      temperatureUnits,
      targetCO2,
      sugarType
    );

    const embed = new EmbedBuilder().setTitle('Priming Sugar').addFields(
      {
        name: 'Batch Volume',
        value: volume.toFixed(2) + ' ' + volumeResult.fromUnit.name + ' (' + volumeResult.toAmount.toFixed(2) + ' L)',
        inline: true,
      },
      {
        name: 'Highest Post-Ferment Temp',
        value: temperature.toFixed(1) + ' ' + Constants.TEMPERATURE_UNIT_NAMES[temperatureUnits],
        inline: true,
      },
      { name: 'Target CO2', value: targetCO2.toFixed(2) + ' volumes', inline: true },
      { name: 'Residual CO2', value: result.residualCO2.toFixed(2) + ' volumes', inline: true },
      { name: 'Sugar Type', value: result.sugarTypeName, inline: true },
      {
        name: 'Priming Sugar Needed',
        value: result.grams.toFixed(1) + 'g (' + (result.grams / GRAMS_PER_OUNCE).toFixed(2) + ' oz)',
        inline: true,
      }
    );

    if (result.co2ToAdd <= 0) {
      embed.addFields({
        name: 'Note',
        value:
          "This batch already holds at or above your target CO2 at this temperature, so no priming sugar is needed. If you're bottling now, warming it first would let more CO2 escape before packaging.",
      });
    } else if (targetCO2 > 3.5) {
      embed.addFields({
        name: 'Caution',
        value:
          'Targets above ~3.5 volumes need bottles rated for high pressure (e.g. champagne bottles) — standard beer/wine bottles can fail. Always prime carefully and know your target before bottling.',
      });
    }

    message.channel.send({ embeds: [embed] });
  },
};
