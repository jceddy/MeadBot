const { EmbedBuilder } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const { calculateBlend } = require('../calculator/BlendCalculator.js');
const Constants = CalculatorAPI.Constants;

const HELP_TEXT = {
  '-u': 'Units should be one of "sg", "brix", "baume", "abv", "abw", or "other" (defaults to "other"). Example: !calculate-blend --units other --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
  '--units':
    'Units should be one of "sg", "brix", "baume", "abv", "abw", or "other" (defaults to "other"). Example: !calculate-blend --units other --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
  '-a': 'Value #1 should be the first value to blend. It should be numeric and <= Value #2. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
  '--value1':
    'Value #1 should be the first value to blend. It should be numeric and <= Value #2. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
  '-b': 'Value #2 should be the first value to blend. It should be numeric and >= Value #1. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
  '--value2':
    'Value #2 should be the first value to blend. It should be numeric and >= Value #1. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
  '-v': 'Blended value should be the value obtained after blending. It should be between Value #1 and Value #2. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
  '--blended_value':
    'Blended value should be the value obtained after blending. It should be between Value #1 and Value #2. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
  '-o': 'Volume #1 should be the volume containing liquid with Value #1. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
  '--volume1':
    'Volume #1 should be the volume containing liquid with Value #1. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
  '-p': 'Volume #2 should be the volume containing liquid with Value #2. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume2 3 --field_to_calculate volume1',
  '--volume2':
    'Volume #2 should be the volume containing liquid with Value #2. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume2 3 --field_to_calculate volume1',
  '-t': 'Total Volume is the sum of Volume #1 and Volume #2. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --total_volume 6 --field_to_calculate volume1',
  '--total_volume':
    'Total Volume is the sum of Volume #1 and Volume #2. Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --total_volume 6 --field_to_calculate volume1',
  '-f': 'Field to calculate should be one of "value1", "value2", "blended_value", "volume1", "volume2", or "total_volume". Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
  '--field_to_calculate':
    'Field to calculate should be one of "value1", "value2", "blended_value", "volume1", "volume2", or "total_volume". Example: !calculate-blend --value1 11 --value2 15 --blended_value 12 --volume1 3 --field_to_calculate volume2',
};

const USAGE =
  'Usage: !calculate-blend [-a|--value1 <number>] [-b|--value2 <number>] [-v|--blended_value <number>] [-o|--volume1 <number>] [-p|--volume2 <number>] [-t|--total_volume <number>] [-f|--field_to_calculate value1|value2|blended_value|volume1|volume2|total_volume] [-h|--help [all]]';

module.exports = {
  name: 'blend',
  aliases: ['calculate-blend'],
  description: 'Solves for one field of a two-liquid blend given the other five.',
  execute(message, args) {
    let units = Constants.BLEND_UNITS.OTHER;
    let value1 = null;
    let value2 = null;
    let blendedValue = null;
    let volume1 = null;
    let volume2 = null;
    let totalVolume = null;
    let fieldToCalculate = null;

    if (args.length === 0) {
      args = ['-h', 'all'];
    }
    for (let i = 0; i < args.length; i += 2) {
      const argName = args[i];
      const argValue = args.length > i + 1 ? args[i + 1] : '';

      switch (argName) {
        case '-u':
        case '--units':
          switch (argValue) {
            case 'sg':
              units = Constants.BLEND_UNITS.SG;
              break;
            case 'brix':
              units = Constants.BLEND_UNITS.BRIX;
              break;
            case 'baume':
              units = Constants.BLEND_UNITS.BAUME;
              break;
            case 'abv':
              units = Constants.BLEND_UNITS.ABV;
              break;
            case 'abw':
              units = Constants.BLEND_UNITS.ABW;
              break;
            case 'other':
              units = Constants.BLEND_UNITS.OTHER;
              break;
            default:
              message.channel.send('Unrecognized value for units: ' + argValue);
              return;
          }
          break;
        case '-a':
        case '--value1':
          value1 = parseFloat(argValue);
          if (isNaN(value1)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-b':
        case '--value2':
          value2 = parseFloat(argValue);
          if (isNaN(value2)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-v':
        case '--blended_value':
          blendedValue = parseFloat(argValue);
          if (isNaN(blendedValue)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-o':
        case '--volume1':
          volume1 = parseFloat(argValue);
          if (isNaN(volume1)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-p':
        case '--volume2':
          volume2 = parseFloat(argValue);
          if (isNaN(volume2)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-t':
        case '--total_volume':
          totalVolume = parseFloat(argValue);
          if (isNaN(totalVolume)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-f':
        case '--field_to_calculate':
          switch (argValue) {
            case 'value1':
              fieldToCalculate = Constants.BLEND_FIELDS.VALUE1;
              break;
            case 'value2':
              fieldToCalculate = Constants.BLEND_FIELDS.VALUE2;
              break;
            case 'blended_value':
              fieldToCalculate = Constants.BLEND_FIELDS.BLENDED_VALUE;
              break;
            case 'volume1':
              fieldToCalculate = Constants.BLEND_FIELDS.VOLUME1;
              break;
            case 'volume2':
              fieldToCalculate = Constants.BLEND_FIELDS.VOLUME2;
              break;
            case 'total_volume':
              fieldToCalculate = Constants.BLEND_FIELDS.TOTAL_VOLUME;
              break;
            default:
              message.channel.send('Unrecognized value for field_to_calculate: ' + argValue);
              return;
          }
          break;
        case '-h':
        case '--help':
          message.channel.send(HELP_TEXT[argValue] || USAGE);
          return;
      }
    }

    if (fieldToCalculate == null) {
      message.channel.send('Please specify a field to calculate.');
      return;
    }

    const result = calculateBlend(fieldToCalculate, { value1, value2, blendedValue, volume1, volume2, totalVolume });
    if (result.error) {
      message.channel.send(result.errorMessage);
      return;
    }

    const unitName = Constants.BLEND_UNIT_NAMES[units];
    const embed = new EmbedBuilder().setTitle('Blending Calculation').addFields(
      {
        name: 'Unblended',
        value: unitName + ' #1: ' + result.value1 + '\n\n' + unitName + ' #2: ' + result.value2 + '\n',
        inline: true,
      },
      { name: 'Blended', value: '.\nBlended ' + unitName + ': ' + result.blendedValue + '\n\n', inline: true },
      {
        name: 'Volumes',
        value:
          'Volume #1: ' + result.volume1 + '\n\nVolume #2: ' + result.volume2 + '\nTotal Volume: ' + result.totalVolume,
        inline: true,
      }
    );
    message.channel.send({ embeds: [embed] });
  },
};
