const { EmbedBuilder } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const Gravity = require('../calculator/GravityCalculator.js');
const Nutrient = require('../calculator/NutrientCalculator.js');
const Constants = CalculatorAPI.Constants;

const HELP_TEXT = {
  '-u': 'Units should be specified as "us" or "metric" (default is "us").\nExample: !build-batch -u us',
  '--units': 'Units should be specified as "us" or "metric" (default is "us").\nExample: !build-batch -u us',
  '-v': 'Volume should be specified as a numeric value of gallons (if units are "us") or liters (if units are "metric") (default is 5 when units are "us" or 18.9 when units are "metric").\nExample: !build-batch -v 5',
  '--volume':
    'Volume should be specified as a numeric value of gallons (if units are "us") or liters (if units are "metric") (default is 5 when units are "us" or 18.9 when units are "metric").\nExample: !build-batch -v 5',
  '-a': 'Yeast ABV should be specified as a numeric ABV percentage that your yeast are expected to reach (default is 18).\nBe mindful that when treated well, yeast will likely overshoot their published tolerance.\nExample: !build-batch -a 10',
  '--yeast_abv':
    'Yeast ABV should be specified as a numeric ABV percentage that your yeast are expected to reach (default is 18).\nBe mindful that when treated well, yeast will likely overshoot their published tolerance.\nExample: !build-batch -a 10',
  '-r': 'Residual sugar should be specified as the target FG for your batch (default is 1.020).\nExample: !build-batch -r 1.020',
  '--residual_sugar':
    'Residual sugar should be specified as the target FG for your batch (default is 1.020).\nExample: !build-batch -r 1.020',
  '-y': 'YAN requirement should be specified as "very_low", "low", "medium", "high", or "kveik" (default is "medium").\nExample: !build-batch -y medium',
  '--yan_requirement':
    'YAN requirement should be specified as "very_low", "low", "medium", "high", or "kveik" (default is "medium").\nExample: !build-batch -y medium',
  '-n': 'Nutrient Regimen should be specified as "tosna", "k_dap", "blount_elliot", "tosna_k", "o_k", or "advanced" (default is "blount_elliot").\nExample: !build-batch -n blount_elliot',
  '--nutrient_regimen':
    'Nutrient Regimen should be specified as "tosna", "k_dap", "blount_elliot", "tosna_k", "o_k", or "advanced" (default is "blount_elliot").\nExample: !build-batch -n blount_elliot',
  '-o': 'OG override should be specified as the target OG for your batch. If this is specified, it will override any default or specified residual sugar value.\nExample: !build-batch -o 1.126',
  '--og_override':
    'OG override should be specified as the target OG for your batch. If this is specified, it will override any default or specified residual sugar value.\nExample: !build-batch -o 1.126',
  '-p': 'Pitch rate override should be specified as a number that overrides yeast g/G (for "us" units) or g/L (for "metric" units).\nExample: !build-batch -p 4',
  '--pitch_rate_override':
    'Pitch rate override should be specified as a number that overrides yeast g/G (for "us" units) or g/L (for "metric" units).\nExample: !build-batch -p 4',
  '-f': 'Fruit SG should be specified as the gravity contribution from fruit or grains in your batch.\nExample: !build-batch -f 1.035',
  '--fruit_sg':
    'Fruit SG should be specified as the gravity contribution from fruit or grains in your batch.\nExample: !build-batch -f 1.035',
  '-d': 'Advanced SNA Values should be a semicolon-delimited list of name=value pairs containing the Advanced SNA values to be overridden from default.\nNote: These values will only be used if Nutrient Regimen is set to "advanced".\nExample: !batch-build -n advanced -d yan=250;enforce_limits=false;r=90,5,5',
  '--advanced_sna_values':
    'Advanced SNA Values should be a semicolon-delimited list of name=value pairs containing the Advanced SNA values to be overridden from default.\nNote: These values will only be used if Nutrient Regimen is set to "advanced".\nExample: !batch-build -n advanced -d yan=250;enforce_limits=false;r=90,5,5',
  '-t': 'Hot should be set to "true" when fermenting hot (>= 80F) with a yeast like Belle Saison (it defaults to "false").\nExample: !build-batch -t true',
  '--hot':
    'Hot should be set to "true" when fermenting hot (>= 80F) with a yeast like Belle Saison (it defaults to "false").\nExample: !build-batch -t true',
  '-s': 'SNA schedule override should be a comma delimited set of increasing values, optionally starting with "pitch" and/or ending with "break".\nExample: !build-batch -s 24,48,72,break',
  '--sna_schedule_override':
    'SNA schedule override should be a comma delimited set of increasing values, optionally starting with "pitch" and/or ending with "break".\nExample: !build-batch -s 24,48,72,break',
  '-k': 'Fermaid K YAN override should be an integer value of ppm YAN provided by Fermaid K. The calculator assumes 134 if this is not specified (most calculators assume 100).\nExample: !build-batch -k 134',
  '--fermk_yan_override':
    'Fermaid K YAN override should be an integer value of ppm YAN provided by Fermaid K. The calculator assumes 134 if this is not specified (most calculators assume 100).\nExample: !build-batch -k 134',
  '-g': 'Go-Ferm YAN override should be an integer value of ppm YAN provided by Go-Ferm. The calculator assumes 77 if this is not specified (most calculators assume 0).\nExample: !build-batch -g 77',
  '--goferm_yan_override':
    'Go-Ferm YAN override should be an integer value of ppm YAN provided by Go-Ferm. The calculator assumes 77 if this is not specified (most calculators assume 0).\nExample: !build-batch -g 77',
  '-i': 'Fill Fk first should be set to "true" or "false", depending on whether you prioritize Fermaid K over Fermaid O when calculating nutrients for batches with low YAN requirement (defaults to "true").\nExample: !build-batch -i true',
  '--fill_fk_first':
    'Fill Fk first should be set to "true" or "false", depending on whether you prioritize Fermaid K over Fermaid O when calculating nutrients for batches with low YAN requirement (defaults to "true").\nExample: !build-batch -i true',
};

const USAGE =
  'Usage: !build-batch [-u|--units <string>] [-v|--volume <number>] [-a|--yeast_abv <number>] [-r|--residual_sugar <number>] [-y|--yan_requirement very_low|low|medium|high|kveik] [-n|--nutrient_regimen <string>] [-o|--og_override <number>] [-p|--pitch_rate_override <number>] [-f|--fruit_sg <number>] [-d|--advanced_sna_values <string>] [-t|--hot true|false] [-s|--sna_schedule_override <string>] [-k|--fermk_yan_override <integer>] [-g|--goferm_yan_override <integer>] [-i|--fill_fk_first true|false] [-h|--help [all]]';

module.exports = {
  name: 'build',
  aliases: ['build-batch'],
  description: 'Builds a full recipe (honey, yeast, nutrients) for a target batch.',
  execute(message, args) {
    let units = Constants.UNITS.US;
    let volume = 5;
    let volumeDefault = true;
    let yeastAbv = 18;
    let residualSugar = 1.02;
    let yanRequirement = Constants.YAN_REQUIREMENT.MEDIUM;
    let nutrientRegimen = Constants.NUTRIENT_REGIMEN.BLOUNT_ELLIOTT;
    let ogOverride = 0;
    let pitchRateOverride = 0;
    let fruitSg = 0;

    let yanOverride = 0;
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
    let fillFkFirst = true;

    let hot = false;
    let snaScheduleOverride = null;

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
        case '-a':
        case '--yeast_abv':
          yeastAbv = parseFloat(argValue);
          if (isNaN(yeastAbv)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          if (yeastAbv < 0.0 || yeastAbv > 22.0) {
            message.channel.send('Yeast ABV out of range: ' + yeastAbv.toFixed(2));
            return;
          }
          break;
        case '-r':
        case '--residual_sugar':
          residualSugar = parseFloat(argValue);
          if (isNaN(residualSugar)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          if (residualSugar < 0.99 || residualSugar > 1.1) {
            message.channel.send('Residual Sugar out of range: ' + residualSugar.toFixed(2));
            return;
          }
          break;
        case '-y':
        case '--yan_requirement':
          if (argValue === 'very_low') {
            yanRequirement = Constants.YAN_REQUIREMENT.VERY_LOW;
          } else if (argValue === 'low') {
            yanRequirement = Constants.YAN_REQUIREMENT.LOW;
          } else if (argValue === 'high') {
            yanRequirement = Constants.YAN_REQUIREMENT.HIGH;
          } else if (argValue === 'kveik') {
            yanRequirement = Constants.YAN_REQUIREMENT.KVEIK;
          } else {
            yanRequirement = Constants.YAN_REQUIREMENT.MEDIUM;
          }
          break;
        case '-n':
        case '--nutrient_regimen':
          switch (argValue) {
            case 'tosna':
              nutrientRegimen = Constants.NUTRIENT_REGIMEN.TOSNA;
              break;
            case 'k_dap':
              nutrientRegimen = Constants.NUTRIENT_REGIMEN.K_DAP;
              break;
            case 'tosna_k':
              nutrientRegimen = Constants.NUTRIENT_REGIMEN.TOSNA_K;
              break;
            case 'o_k':
              nutrientRegimen = Constants.NUTRIENT_REGIMEN.O_K;
              break;
            case 'advanced':
              nutrientRegimen = Constants.NUTRIENT_REGIMEN.ADVANCED;
              break;
            default:
              nutrientRegimen = Constants.NUTRIENT_REGIMEN.BLOUNT_ELLIOTT;
              break;
          }
          break;
        case '-o':
        case '--og_override':
          ogOverride = parseFloat(argValue);
          if (isNaN(ogOverride)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          if (ogOverride < 1.0 || ogOverride > 1.4) {
            message.channel.send('OG override out of range: ' + ogOverride.toFixed(2));
            return;
          }
          break;
        case '-p':
        case '--pitch_rate_override':
          pitchRateOverride = parseFloat(argValue);
          if (isNaN(pitchRateOverride)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          if (units === Constants.UNITS.US && (pitchRateOverride < 0.0 || pitchRateOverride > 10.0)) {
            message.channel.send('Pitch rate override out of range: ' + pitchRateOverride.toFixed(2));
            return;
          }
          if (units === Constants.UNITS.METRIC && (pitchRateOverride < 0.0 || pitchRateOverride > 4.0)) {
            message.channel.send('Pitch rate override out of range: ' + pitchRateOverride.toFixed(2));
            return;
          }
          break;
        case '-f':
        case '--fruit_sg':
          fruitSg = parseFloat(argValue);
          if (isNaN(fruitSg)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          if (fruitSg < 1.0 || fruitSg > 1.2) {
            message.channel.send('Fruit SG out of range: ' + fruitSg.toFixed(2));
            return;
          }
          break;
        case '-d':
        case '--advanced_sna_values': {
          const advancedArgs = argValue.split(';');
          for (const advancedArg of advancedArgs) {
            const [aaName, aaValue] = advancedArg.split('=');

            if (aaName === 'y' || aaName === 'yan') {
              yanOverride = parseInt(aaValue, 10);
              if (isNaN(yanOverride)) {
                message.channel.send(aaValue + ' is not a number.');
                return;
              }
            } else if (aaName === 'e' || aaName === 'fermo_effectiveness') {
              fermOEffectiveness = parseFloat(aaValue);
              if (isNaN(fermOEffectiveness)) {
                message.channel.send(aaValue + ' is not a number.');
                return;
              }
            } else if (aaName === 'l' || aaName === 'enforce_limits') {
              enforceLimits = aaValue === 'true';
            } else if (aaName === 'i' || aaName === 'limits') {
              const limits = aaValue.split(',');
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
            } else if (aaName === 'r' || aaName === 'yan_ratios') {
              const ratios = aaValue.split(',');
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
            }
          }
          break;
        }
        case '-t':
        case '--hot':
          hot = argValue === 'true';
          break;
        case '-s':
        case '--sna_schedule_override': {
          const scheduleParts = argValue.split(',');
          snaScheduleOverride = [];
          for (let part of scheduleParts) {
            if (part === 'pitch') {
              if (snaScheduleOverride.length > 0) {
                message.channel.send('"pitch" can only be the first item in SNA schedule override');
                return;
              }
            } else if (part === 'break') {
              // matches original: this comparison was always false (indexing one past the end)
            } else {
              part = parseInt(part, 10);
              if (isNaN(part)) {
                message.channel.send(argValue + ' is not a number.');
                return;
              }
              if (part < 1 || part > 500) {
                message.channel.send('SNA schedule override value out of range: ' + part);
                return;
              }
            }
            snaScheduleOverride.push(part);
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
        case '-i':
        case '--fill_fk_first':
          fillFkFirst = argValue === 'true';
          break;
        case '-h':
        case '--help':
          message.channel.send(HELP_TEXT[argValue] || USAGE);
          return;
      }
    }

    let fg = residualSugar;
    let abv = yeastAbv;
    const u = units;
    let bV = volume;
    const nR = yanRequirement;
    if (u === Constants.UNITS.METRIC) {
      bV = bV / 3.784; // convert to gallons
    }

    let og;
    if (ogOverride > 0) {
      og = ogOverride;
      const sg = Gravity.stormABVtoSG(abv);
      fg = og - sg + 1;
      if (fg < 1) {
        fg = 1;
        abv = yeastAbv = CalculatorAPI.ConvertGravityDropToABV(og);
      }
      residualSugar = fg;
    } else {
      const sg = Gravity.stormABVtoSG(abv);
      og = sg + fg - 1;
    }

    const sgDelta = og - fg + 1;
    let yan = Gravity.stormSGtoYAN(sgDelta, nR);

    let snaSchedule;
    if (snaScheduleOverride == null) {
      if (yanRequirement === Constants.YAN_REQUIREMENT.KVEIK) {
        snaSchedule = ['pitch'];
      } else if (hot) {
        if (og >= 1.1) {
          snaSchedule = [24, 'break'];
        } else if (og >= 1.08) {
          snaSchedule = [24];
        } else {
          snaSchedule = ['pitch'];
        }
      } else if (og >= 1.12) {
        snaSchedule = [24, 48, 72, 'break'];
      } else if (og >= 1.1) {
        snaSchedule = [24, 48, 'break'];
      } else if (og >= 1.08) {
        snaSchedule = [24, 'break'];
      } else if (og >= 1.06) {
        snaSchedule = [24];
      } else {
        snaSchedule = ['pitch'];
      }
    } else {
      snaSchedule = snaScheduleOverride;
    }

    let fruitPercent = 0;
    let fruitPercent100 = 0;
    let fruitYanContribution = 0;
    if (fruitSg > 0) {
      if (fruitSg > og) {
        message.channel.send("Fruit SG can't be higher than OG. (" + fruitSg.toFixed(3) + ' > ' + og.toFixed(3) + ')');
        return;
      }
      fruitPercent = (fruitSg - 1) / (og - 1);
      if (yanRequirement === Constants.YAN_REQUIREMENT.KVEIK) {
        fruitPercent = fruitPercent / 1.5;
      }
      fruitPercent100 = fruitPercent * 100;
      fruitYanContribution = Math.floor(yan * fruitPercent);
      yan -= fruitYanContribution;
    }

    const ho = Nutrient.hoCalc(og, bV, u);
    if (ho == null) {
      message.channel.send('Error calculating Honey Weight: Unknown Units.');
      return;
    }
    const tp = nutrientRegimen;
    og = Math.round(og * 1000) / 1000;

    let gf;
    if (pitchRateOverride > 0) {
      const yst = pitchRateOverride * volume;
      const numPacket = Math.ceil(yst / 5);
      const gfGrams = 1.25 * numPacket * 5;
      const reh = gfGrams * 20;
      gf = [yst, numPacket, gfGrams, reh];
    } else {
      gf = Nutrient.getGoferm(bV, og, fruitYanContribution);
    }

    const gofermYanContribution = Math.floor((gf[2] * gofermYan) / (bV * 3.784));
    yan -= gofermYanContribution;

    if (ho[0] > 100) {
      ho[0] = Math.round(ho[0]);
    } else if (ho[0] > 10) {
      ho[0] = Math.round(ho[0] * 10) / 10;
    } else {
      ho[0] = Math.round(ho[0] * 100) / 100;
    }

    let nut;
    let advancedNutrients;
    switch (tp) {
      case Constants.NUTRIENT_REGIMEN.TOSNA:
        nut = Nutrient.getFermO(bV, yan, snaSchedule);
        break;
      case Constants.NUTRIENT_REGIMEN.K_DAP:
        nut = Nutrient.getFermKdap(bV, yan, snaSchedule, fermKYan);
        break;
      case Constants.NUTRIENT_REGIMEN.BLOUNT_ELLIOTT:
        nut = Nutrient.getNutrients(bV, abv, yan, snaSchedule, fermKYan, fermOEffectiveness);
        break;
      case Constants.NUTRIENT_REGIMEN.TOSNA_K:
        nut = Nutrient.getFermK(bV, yan, snaSchedule);
        break;
      case Constants.NUTRIENT_REGIMEN.O_K:
        nut = Nutrient.getFermOK(bV, yan, snaSchedule);
        break;
      case Constants.NUTRIENT_REGIMEN.ADVANCED:
        if (yanOverride > 0) {
          yan = yanOverride - gofermYanContribution;
        }
        advancedNutrients = Nutrient.getAdvancedNutrients(
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
          snaSchedule,
          fermKYan,
          fillFkFirst
        );
        nut = advancedNutrients.sna;
        break;
      default:
        message.channel.send('Calculation failed: Unknown Nutrient Regimen.');
        return;
    }

    const batchSpecsEmbed = new EmbedBuilder().setTitle('Batch Specs').addFields(
      {
        name: 'Total Volume',
        value: volume.toFixed(2) + (units === Constants.UNITS.US ? ' gallon(s)' : ' liter(s)'),
        inline: true,
      },
      { name: 'Estimated ABV', value: yeastAbv.toFixed(2) + '%', inline: true },
      { name: 'Target OG', value: og.toFixed(3), inline: true },
      { name: 'Target FG', value: residualSugar.toFixed(3), inline: true },
      { name: 'YAN Requirement', value: Constants.YAN_REQUIREMENT_STRING[yanRequirement], inline: true },
      { name: 'YAN Provided', value: (nut.nitrogen + gofermYanContribution).toFixed(1), inline: true },
      { name: 'Nutrient Regimen', value: Constants.NUTRIENT_REGIMEN_STRING[nutrientRegimen], inline: true }
    );
    if (gofermYanContribution > 0) {
      batchSpecsEmbed.addFields({
        name: 'Go-Ferm YAN Contribution',
        value: String(gofermYanContribution),
        inline: true,
      });
    }
    if (fruitPercent > 0) {
      batchSpecsEmbed.addFields(
        { name: 'Fruit Sugar Percentage', value: fruitPercent100.toFixed(2) + '%', inline: true },
        { name: 'Fruit YAN Contribution', value: String(fruitYanContribution), inline: true }
      );
    }
    if (tp === Constants.NUTRIENT_REGIMEN.ADVANCED && advancedNutrients.enforce) {
      batchSpecsEmbed.addFields(
        { name: 'DAP Limit (g/L)', value: advancedNutrients.dap_limit.toFixed(2), inline: true },
        { name: 'Ferm K Limit (g/L)', value: advancedNutrients.fermK_limit.toFixed(2), inline: true },
        { name: 'Ferm O Limit (g/L)', value: advancedNutrients.fermO_limit.toFixed(2), inline: true }
      );
    }

    const ingredientsEmbed = new EmbedBuilder()
      .setTitle('Ingredients')
      .addFields(
        { name: 'Honey Needed', value: String(ho[0] + ho[1]), inline: true },
        { name: 'Dry Yeast Minimum Weight', value: gf[0] + 'g', inline: true },
        { name: '# Dry Yeast Packet(s)', value: gf[1] + ' (' + gf[1] * 5 + 'g yeast)', inline: true },
        { name: 'Go-ferm', value: gf[2] + 'g', inline: true },
        { name: 'Water to dilute Go-ferm', value: gf[2] * 20 + 'ml', inline: true }
      );
    if (tp !== Constants.NUTRIENT_REGIMEN.ADVANCED) {
      if (nut.totalFermO > 0) {
        ingredientsEmbed.addFields({ name: 'Fermaid O', value: nut.totalFermO + 'g', inline: true });
      }
      if (nut.totalFermK > 0) {
        ingredientsEmbed.addFields({ name: 'Fermaid K', value: nut.totalFermK + 'g', inline: true });
      }
      if (nut.totalDAP > 0) {
        ingredientsEmbed.addFields({ name: 'DAP', value: nut.totalDAP + 'g', inline: true });
      }
    }

    const ogPts = og - 1;
    const fgPts = fg - 1;
    const sgDiff = ogPts - fgPts;
    const break3 = 1 + (fgPts + (sgDiff * 2) / 3);

    const snaEmbed = new EmbedBuilder().setTitle('Nutrient Additions');
    for (const addition of nut.additions) {
      snaEmbed.addFields({
        name: CalculatorAPI.MakeHoursString(addition.timing, break3),
        value: Nutrient.makeNutString(addition),
        inline: true,
      });
    }

    if (tp === Constants.NUTRIENT_REGIMEN.ADVANCED) {
      const nutrientsEmbed = new EmbedBuilder().setTitle('Nutrients').addFields(
        {
          name: 'YAN Ratio',
          value:
            'DAP: ' +
            advancedNutrients.yan_ratio_dap +
            '\nFermaid K: ' +
            advancedNutrients.yan_ratio_fermK +
            '\nFermaid O: ' +
            advancedNutrients.yan_ratio_fermO,
          inline: true,
        },
        { name: 'mg N/g/L', value: 'DAP: 210\nFermaid K: ' + fermKYan + '\nFermaid O: 40', inline: true },
        {
          name: 'g/L to add',
          value:
            'DAP: ' +
            advancedNutrients.dapGL +
            '\nFermaid K: ' +
            advancedNutrients.fkGL +
            '\nFermaid O: ' +
            advancedNutrients.foGL,
          inline: true,
        },
        {
          name: 'N from Source',
          value:
            'DAP: ' +
            advancedNutrients.dapYan +
            '\nFermaid K: ' +
            advancedNutrients.fkYan +
            '\nFermaid O: ' +
            advancedNutrients.foYan,
          inline: true,
        },
        {
          name: 'Total g to add',
          value:
            'DAP: ' +
            advancedNutrients.dapG +
            '\nFermaid K: ' +
            advancedNutrients.fkG +
            '\nFermaid O: ' +
            advancedNutrients.foG,
          inline: true,
        }
      );

      let warning = '';
      if (advancedNutrients.fkGL > 0.5) {
        warning += 'Fermaid K exceeds US Legal Limit.';
      }
      if (advancedNutrients.dapGL > 0.96) {
        if (warning !== '') {
          warning += '\n';
        }
        warning += 'DAP exceeds US Legal Limit.';
      }
      if (advancedNutrients.foGL > 0.45) {
        if (warning !== '') {
          warning += '\n';
        }
        warning += 'Fermaid O risks adding yeasty flavors.';
      }
      if (warning !== '') {
        nutrientsEmbed.addFields({ name: 'Warning', value: warning });
      }

      message.channel
        .send({ embeds: [batchSpecsEmbed] })
        .then(() => message.channel.send({ embeds: [ingredientsEmbed] }))
        .then(() => message.channel.send({ embeds: [nutrientsEmbed] }))
        .then(() => message.channel.send({ embeds: [snaEmbed] }))
        .catch((error) => message.channel.send(error.message));
    } else {
      message.channel
        .send({ embeds: [batchSpecsEmbed] })
        .then(() => message.channel.send({ embeds: [ingredientsEmbed] }))
        .then(() => message.channel.send({ embeds: [snaEmbed] }));
    }
  },
};
