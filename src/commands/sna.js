const { EmbedBuilder } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const { calculateNutrients } = require('../calculator/NutrientCalculator.js');
const Constants = CalculatorAPI.Constants;

const HELP_TEXT = {
  '-u': 'Units should be specified as "us" or "metric" (default is "us").\nExample: !calculate-nutrients -u us',
  '--units': 'Units should be specified as "us" or "metric" (default is "us").\nExample: !calculate-nutrients -u us',
  '-v': 'Volume should be specified as a numeric value of gallons (if units are "us") or liters (if units are "metric") (default is 5 when units are "us" or 18.9 when units are "metric").\nExample: !calculate-nutrients -v 5',
  '--volume':
    'Volume should be specified as a numeric value of gallons (if units are "us") or liters (if units are "metric") (default is 5 when units are "us" or 18.9 when units are "metric").\nExample: !calculate-nutrients -v 5',
  '-y': 'Total YAN should be specified as a numeric value of PPM (default is 175).\nExample: !calculate-nutrients -y 175',
  '--yan':
    'Total YAN should be specified as a numeric value of PPM (default is 175).\nExample: !calculate-nutrients -y 175',
  '-e': 'Fermaid O Effectiveness should be specified as an integer value denoting the YAN effectiveness multiplier applied to Fermaid O in the calculations (default is 2.6).\nExample: !calculate-nutrients -e 4',
  '--fermo_effectiveness':
    'Fermaid O Effectiveness should be specified as an integer value denoting the YAN effectiveness multiplier applied to Fermaid O in the calculations (default is 2.6).\nExample: !calculate-nutrients -e 4',
  '-l': 'Enforce Limits should be specified as "true" or "false" (default is "true").\nExample: !calculate-nutrients -l true',
  '--enforce_limits':
    'Enforce Limits should be specified as "true" or "false" (default is "true").\nExample: !calculate-nutrients -l true',
  '-i': 'Limits should be specified as a comma-delimited list containing dap,fermK,fermO limits in g/L (default is 0.96,0.5,0.45).\nExample: !calculate-nutrients -i 0.96,0.5,0.45',
  '--limits':
    'Limits should be specified as a comma-delimited list containing dap,fermK,fermO limits in g/L (default is 0.96,0.5,0.45).\nExample: !calculate-nutrients -i 0.96,0.5,0.45',
  '-r': 'YAN ratios should be specified as a comma-delimited list containing dap,fermK,fermO ratios (default is 35,25,40).\nNote these ratios are only used if Enforce Limits is set to "false".\nExample: !calculate-nutrients -l false -r 35,25,40',
  '--yan_ratios':
    'YAN ratios should be specified as a comma-delimited list containing dap,fermK,fermO ratios (default is 35,25,40).\nNote these ratios are only used if Enforce Limits is set to "false".\nExample: !calculate-nutrients -l false -r 35,25,40',
  '-k': 'Fermaid K YAN override should be an integer value of ppm YAN provided by Fermaid K. The calculator assumes 134 if this is not specified (most calculators assume 100).\nExample: !calculate-nutrients -k 134',
  '--fermk_yan_override':
    'Fermaid K YAN override should be an integer value of ppm YAN provided by Fermaid K. The calculator assumes 134 if this is not specified (most calculators assume 100).\nExample: !calculate-nutrients -k 134',
  '-g': 'Go-Ferm YAN override should be an integer value of ppm YAN provided by Go-Ferm. The calculator assumes 77 if this is not specified (most calculators assume 0).\nExample: !calculate-nutrients -g 77',
  '--goferm_yan_override':
    'Go-Ferm YAN override should be an integer value of ppm YAN provided by Go-Ferm. The calculator assumes 77 if this is not specified (most calculators assume 0).\nExample: !calculate-nutrients -g 77',
  '-o': 'Go-Ferm grams should be an integer value specifying the grams of Go-Ferm being used to rehydrate (defaults to 0).\nExample: !calculate-nutrients -o 6.25',
  '--goferm_grams':
    'Go-Ferm grams should be an integer value specifying the grams of Go-Ferm being used to rehydrate (defaults to 0).\nExample: !calculate-nutrients -o 6.25',
  '-f': 'Fill Fk first should be set to "true" or "false", depending on whether you prioritize Fermaid K over Fermaid O when calculating nutrients for batches with low YAN requirement (defaults to "true").\nExample: !calculate-nutrients -f true',
  '--fill_fk_first':
    'Fill Fk first should be set to "true" or "false", depending on whether you prioritize Fermaid K over Fermaid O when calculating nutrients for batches with low YAN requirement (defaults to "true").\nExample: !calculate-nutrients -f true',
};

const USAGE =
  'Usage: !calculate-nutrients [-u|--units <string>] [-v|--volume <number>] [-y|--yan <number>] [-e|--fermo_effectiveness <number>] [-l|--enforce_limits true|false] [-i|--limits <number>,<number>,<number>] [-r|--yan_ratios <number>,<number>,<number>] [-k|--fermk_yan_override <integer>] [-g|--goferm_yan_override <integer>] [-f|--fill_fk_first true|false] [-h|--help [all]]';

module.exports = {
  name: 'sna',
  aliases: ['calculate-nutrients'],
  description: 'Calculates a staggered-nutrient-addition schedule for a given YAN target.',
  execute(message, args) {
    let units = Constants.UNITS.US;
    let volume = 5;
    let volumeDefault = true;
    let yan = 175;
    let fermOEffectiveness = 2.6;
    let enforceLimits = true;
    let dapLimit = 0.96;
    let fermKLimit = 0.5;
    let fermOLimit = 0.45;
    let yanRatioDap = 35;
    let yanRatioFermK = 25;
    let yanRatioFermO = 40;
    let fermKYan = 134;
    let gofermYan = 77;
    let gofermGrams = 0;
    let fillFkFirst = true;

    if (args.length === 0) {
      args = ['-h', 'all'];
    }
    for (let i = 0; i < args.length; i += 2) {
      const argName = args[i];
      const argValue = args.length > i + 1 ? args[i + 1] : '';

      switch (argName) {
        case '-u':
        case '--units':
          units = argValue === 'metric' ? Constants.UNITS.METRIC : Constants.UNITS.US;
          if (volumeDefault) {
            volume = units === Constants.UNITS.US ? 5 : 18.9;
          }
          break;
        case '-v':
        case '--volume':
          volume = parseFloat(argValue);
          if (isNaN(volume)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          volumeDefault = false;
          if (units === Constants.UNITS.US && (volume < 1.0 || volume > 20.0)) {
            message.channel.send('Volume out of range: ' + volume.toFixed(2));
            return;
          }
          if (units === Constants.UNITS.METRIC && (volume < 1.0 || volume > 100.0)) {
            message.channel.send('Volume out of range: ' + volume.toFixed(2));
            return;
          }
          break;
        case '-y':
        case '--yan':
          yan = parseFloat(argValue);
          if (isNaN(yan)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-e':
        case '--fermo_effectiveness':
          fermOEffectiveness = parseInt(argValue, 10);
          if (isNaN(fermOEffectiveness)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-l':
        case '--enforce_limits':
          enforceLimits = argValue === 'true';
          break;
        case '-i':
        case '--limits': {
          const limits = argValue.split(',');
          if (limits.length !== 3) {
            message.channel.send(
              'Limits should be specified as a comma-delimited list containing dap,fermK,fermO limits in g/L.'
            );
            return;
          }
          if (!limits[0].startsWith('def')) {
            dapLimit = parseFloat(limits[0]);
            if (isNaN(dapLimit)) {
              message.channel.send(limits[0] + ' is not a number.');
              return;
            }
          }
          if (!limits[1].startsWith('def')) {
            fermKLimit = parseFloat(limits[1]);
            if (isNaN(fermKLimit)) {
              message.channel.send(limits[1] + ' is not a number.');
              return;
            }
          }
          if (!limits[2].startsWith('def')) {
            fermOLimit = parseFloat(limits[2]);
            if (isNaN(fermOLimit)) {
              message.channel.send(limits[2] + ' is not a number.');
              return;
            }
          }
          break;
        }
        case '-r':
        case '--yan_ratios': {
          const ratios = argValue.split(',');
          if (ratios.length !== 3) {
            message.channel.send(
              'YAN ratios should be specified as a comma-delimited list containing dap,fermK,fermO ratios.'
            );
            return;
          }
          if (!ratios[0].startsWith('def')) {
            yanRatioDap = parseInt(ratios[0], 10);
            if (isNaN(yanRatioDap)) {
              message.channel.send(ratios[0] + ' is not a number.');
              return;
            }
          }
          if (!ratios[1].startsWith('def')) {
            yanRatioFermK = parseInt(ratios[1], 10);
            if (isNaN(yanRatioFermK)) {
              message.channel.send(ratios[1] + ' is not a number.');
              return;
            }
          }
          if (!ratios[2].startsWith('def')) {
            yanRatioFermO = parseInt(ratios[2], 10);
            if (isNaN(yanRatioFermO)) {
              message.channel.send(ratios[2] + ' is not a number.');
              return;
            }
          }
          break;
        }
        case '-k':
        case '--fermk_yan_override':
          fermKYan = parseInt(argValue, 10);
          if (isNaN(fermKYan)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-g':
        case '--goferm_yan_override':
          gofermYan = parseInt(argValue, 10);
          if (isNaN(gofermYan)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-o':
        case '--goferm_grams':
          gofermGrams = parseFloat(argValue);
          if (isNaN(gofermGrams)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-f':
        case '--fill_fk_first':
          fillFkFirst = argValue === 'true';
          break;
        case '-h':
        case '--help':
          message.channel.send(HELP_TEXT[argValue] || USAGE);
          return;
      }
    }

    const nutrients = calculateNutrients({
      units,
      volume,
      yan,
      fermOEffectiveness,
      enforceLimits,
      dapLimit,
      fermKLimit,
      fermOLimit,
      yanRatioDap,
      yanRatioFermK,
      yanRatioFermO,
      fermKYan,
      fillFkFirst,
      gofermYan,
      gofermGrams,
    });
    const gofermYanContribution = nutrients.gofermYanContribution;

    const batchInfoEmbed = new EmbedBuilder().setTitle('Batch Info').addFields(
      { name: 'Total YAN', value: String(nutrients.yan + gofermYanContribution), inline: true },
      {
        name: 'Must Volume',
        value: nutrients.volume.toFixed(2) + (nutrients.units === Constants.UNITS.US ? ' gallon(s)' : ' liter(s)'),
        inline: true,
      },
      { name: 'Fermaid O Effectiveness', value: String(nutrients.foe), inline: true }
    );
    if (gofermYanContribution > 0) {
      batchInfoEmbed.addFields({
        name: 'Go-Ferm YAN Contribution',
        value: String(gofermYanContribution),
        inline: true,
      });
    }
    if (nutrients.enforce) {
      batchInfoEmbed.addFields(
        { name: 'DAP Limit (g/L)', value: nutrients.dap_limit.toFixed(2), inline: true },
        { name: 'Ferm K Limit (g/L)', value: nutrients.fermK_limit.toFixed(2), inline: true },
        { name: 'Ferm O Limit (g/L)', value: nutrients.fermO_limit.toFixed(2), inline: true }
      );
    }

    const nutrientsEmbed = new EmbedBuilder().setTitle('Nutrients').addFields(
      {
        name: 'YAN Ratio',
        value:
          'DAP: ' +
          nutrients.yan_ratio_dap +
          '\nFermaid K: ' +
          nutrients.yan_ratio_fermK +
          '\nFermaid O: ' +
          nutrients.yan_ratio_fermO,
        inline: true,
      },
      { name: 'mg N/g/L', value: 'DAP: 210\nFermaid K: ' + fermKYan + '\nFermaid O: 40', inline: true },
      {
        name: 'g/L to add',
        value: 'DAP: ' + nutrients.dapGL + '\nFermaid K: ' + nutrients.fkGL + '\nFermaid O: ' + nutrients.foGL,
        inline: true,
      },
      {
        name: 'N from Source',
        value: 'DAP: ' + nutrients.dapYan + '\nFermaid K: ' + nutrients.fkYan + '\nFermaid O: ' + nutrients.foYan,
        inline: true,
      },
      {
        name: 'Total g to add',
        value: 'DAP: ' + nutrients.dapG + '\nFermaid K: ' + nutrients.fkG + '\nFermaid O: ' + nutrients.foG,
        inline: true,
      }
    );

    let warning = '';
    if (nutrients.fkGL > 0.5) {
      warning += 'Fermaid K exceeds US Legal Limit.';
    }
    if (nutrients.dapGL > 0.96) {
      if (warning !== '') {
        warning += '\n';
      }
      warning += 'DAP exceeds US Legal Limit.';
    }
    if (nutrients.foGL > 0.45) {
      if (warning !== '') {
        warning += '\n';
      }
      warning += 'Fermaid O risks adding yeasty flavors.';
    }
    if (warning !== '') {
      nutrientsEmbed.addFields({ name: 'Warning', value: warning });
    }

    message.channel.send({ embeds: [batchInfoEmbed] }).then(() => message.channel.send({ embeds: [nutrientsEmbed] }));
  },
};
