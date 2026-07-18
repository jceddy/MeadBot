const { EmbedBuilder } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const Gravity = require('../calculator/GravityCalculator.js');
const Constants = CalculatorAPI.Constants;

const HELP_TEXT = {
  '-g': 'Gravity units should be specified as "sg", "brix", or "baume" (default is "sg").\nExample: !potential-alcohol -g sg',
  '--gravity_units':
    'Gravity units should be specified as "sg", "brix", or "baume" (default is "sg").\nExample: !potential-alcohol -g sg',
  '-u': 'ABV units should be specified as "abv", or "abw" (default is "abv").\nExample: !potential-alcohol -u abv',
  '--abv_units':
    'ABV units should be specified as "abv", or "abw" (default is "abv").\nExample: !potential-alcohol -u abv',
  '-o': 'Original gravity should be specified as a number in the units specified by the gravity units argument.\nExample: !potential-alcohol -g sg -o 1.108',
  '--original_gravity':
    'Original gravity should be specified as a number in the units specified by the gravity units argument.\nExample: !potential-alcohol -g sg -o 1.108',
  '-f': 'Final gravity should be specified as a number in the units specified by the gravity units argument.\nExample: !potential-alcohol -g sg -f 0.998',
  '--final_gravity':
    'Final gravity should be specified as a number in the units specified by the gravity units argument.\nExample: !potential-alcohol -g sg -f 0.998',
  '-a': 'ABV/ABW should be specified as a percentage in the units specified by the ABV units argument.\nExample: !potential-alcohol -u abv -a 14.37',
  '--abv':
    'ABV/ABW should be specified as a percentage in the units specified by the ABV units argument.\nExample: !potential-alcohol -u abv -a 14.37',
  '--abw':
    'ABV/ABW should be specified as a percentage in the units specified by the ABV units argument.\nExample: !potential-alcohol -u abv -a 14.37',
};

const USAGE =
  'Usage: !potential-alcohol [-g|--gravity_units sg|brix|baume] [-u|--abv_units abv|abw] [-o|--original_gravity <number>] [-f|--final_gravity <number>] [-a|--abv|--abw <number>] [-h|--help [all]]';

module.exports = {
  name: 'pot',
  aliases: ['potential-alcohol'],
  description: 'Converts between original/final gravity and potential alcohol.',
  execute(message, args) {
    let gravityUnits = Constants.GRAVITY_UNITS.SG;
    let abvUnits = Constants.ABV_UNITS.ABV;
    let og = 1.108;
    let fg = 0.998;
    let abv = 14.37;

    let inputOg = og;
    let inputFg = fg;
    let inputAbv = abv;

    if (args.length === 0) {
      args = ['-h', 'all'];
    }
    for (let i = 0; i < args.length; i += 2) {
      const argName = args[i];
      const argValue = args.length > i + 1 ? args[i + 1] : '';

      switch (argName) {
        case '-g':
        case '--gravity_units': {
          const from = gravityUnits;
          const tmp = Gravity.convToSG(og, from);
          const tmp2 = Gravity.convToSG(fg, from);

          let to;
          if (argValue === 'sg') {
            to = Constants.GRAVITY_UNITS.SG;
            if (inputOg === og) {
              inputOg = tmp;
            }
            og = tmp;
            if (inputFg === fg) {
              inputFg = tmp2;
            }
            fg = tmp2;
          } else if (argValue === 'brix') {
            to = Constants.GRAVITY_UNITS.BRIX;
            if (inputOg === og) {
              inputOg = CalculatorAPI.ConvertSGToBrix(tmp);
            }
            og = CalculatorAPI.ConvertSGToBrix(tmp);
            if (inputFg === fg) {
              inputFg = CalculatorAPI.ConvertSGToBrix(tmp2);
            }
            fg = CalculatorAPI.ConvertSGToBrix(tmp2);
          } else if (argValue === 'baume') {
            to = Constants.GRAVITY_UNITS.BAUME;
            if (inputOg === og) {
              inputOg = Gravity.SGToBaume(tmp);
            }
            og = Gravity.SGToBaume(tmp);
            if (inputFg === fg) {
              inputFg = Gravity.SGToBaume(tmp2);
            }
            fg = Gravity.SGToBaume(tmp2);
          } else {
            message.channel.send('Unknown gravity units: ' + argValue);
            return;
          }

          gravityUnits = to;
          break;
        }
        case '-u':
        case '--abv_units':
          if (argValue === 'abv') {
            if (abvUnits === Constants.ABV_UNITS.ABW) {
              abvUnits = Constants.ABV_UNITS.ABV;
              if (inputAbv === abv) {
                inputAbv = Gravity.ABWToABV(abv);
              }
              abv = Gravity.ABWToABV(abv);
            }
          } else if (argValue === 'abw') {
            if (abvUnits === Constants.ABV_UNITS.ABV) {
              abvUnits = Constants.ABV_UNITS.ABW;
              if (inputAbv === abv) {
                inputAbv = Gravity.ABVToABW(abv);
              }
              abv = Gravity.ABVToABW(abv);
            }
          } else {
            message.channel.send('Unknown abv units: ' + argValue);
            return;
          }
          break;
        case '-o':
        case '--original_gravity':
          inputOg = parseFloat(argValue);
          if (isNaN(inputOg)) {
            message.channel.send('Original gravity is not a number: ' + argValue);
            return;
          }
          break;
        case '-f':
        case '--final_gravity':
          inputFg = parseFloat(argValue);
          if (isNaN(inputFg)) {
            message.channel.send('Final gravity is not a number: ' + argValue);
            return;
          }
          break;
        case '-a':
        case '--abv':
        case '--abw':
          inputAbv = parseFloat(argValue);
          if (isNaN(inputAbv)) {
            message.channel.send('ABV/ABW is not a number: ' + argValue);
            return;
          }
          break;
        case '-h':
        case '--help':
          message.channel.send(HELP_TEXT[argValue] || USAGE);
          return;
      }
    }

    if (inputOg !== og) {
      if (inputAbv !== abv) {
        og = inputOg;
        abv = inputAbv;

        const tmpAbv = abvUnits === Constants.ABV_UNITS.ABW ? Gravity.ABWToABV(abv) : abv;
        const sg = Gravity.ABVToSG(tmpAbv);
        const tmp2 = og - sg + 1;

        if (gravityUnits === Constants.GRAVITY_UNITS.BRIX) {
          fg = CalculatorAPI.ConvertSGToBrix(tmp2);
        } else if (gravityUnits === Constants.GRAVITY_UNITS.BAUME) {
          fg = Gravity.SGToBaume(tmp2);
        } else {
          fg = tmp2;
        }
      } else {
        og = inputOg;
        fg = inputFg;

        const tmp = Gravity.convToSG(og, gravityUnits);
        const tmp2 = Gravity.convToSG(fg, gravityUnits);
        abv = CalculatorAPI.ConvertGravityDropToABV(1 + Number(tmp) - Number(tmp2));
        if (abvUnits === Constants.ABV_UNITS.ABW) {
          abv = Gravity.ABVToABW(abv);
        }
      }
    } else {
      fg = inputFg;
      abv = inputAbv;

      const tmpAbv = abvUnits === Constants.ABV_UNITS.ABW ? Gravity.ABWToABV(abv) : abv;
      const sg = Gravity.stormABVtoSG(tmpAbv);
      const tmp = fg + sg - 1;

      if (gravityUnits === Constants.GRAVITY_UNITS.BRIX) {
        og = CalculatorAPI.ConvertSGToBrix(tmp);
      } else if (gravityUnits === Constants.GRAVITY_UNITS.BAUME) {
        og = Gravity.SGToBaume(tmp);
      } else {
        og = tmp;
      }
    }

    const embed = new EmbedBuilder().setTitle('Potential Alcohol Conversion').addFields(
      {
        name: Constants.GRAVITY_UNIT_NAMES[gravityUnits],
        value: 'Original Gravity: ' + og.toFixed(3) + '\nFinal Gravity: ' + fg.toFixed(3),
        inline: true,
      },
      { name: Constants.ABV_UNIT_NAMES[abvUnits], value: abv.toFixed(3), inline: true }
    );
    message.channel.send({ embeds: [embed] });
  },
};
