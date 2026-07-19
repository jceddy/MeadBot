const { EmbedBuilder } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const Batch = require('../calculator/BatchCalculator.js');
const Nutrient = require('../calculator/NutrientCalculator.js');
const Constants = CalculatorAPI.Constants;

const SHOW_NUTRITION = { NONE: 0, PARTIAL: 1, FULL: 2 };

const HELP_TEXT = {
  '-u': 'Units should be one of "metric", "us", "imperial" (defaults to "us"). This controls default units used, and should be the first argument specified, if it is specified. Example: !calculate-mead --units us',
  '--units':
    'Units should be one of "metric", "us", "imperial" (defaults to "us"). This controls default units used, and should be the first argument specified, if it is specified. Example: !calculate-mead --units us',
  '-t': 'Must temperature should be provided as a number in the specified units (defaults to 68). Example: !calculate-mead --must_temperature 68 --must_temperature_units fahrenheit',
  '--must_temperature':
    'Must temperature should be provided as a number in the specified units (defaults to 68). Example: !calculate-mead --must_temperature 68 --must_temperature_units fahrenheit',
  '-x': 'Must temperature units should be one of "celsius" or "fahrenheit" (defaults to "fahrenheit"). Example: !calculate-mead --must_temperature 68 --must_temperature_units fahrenheit',
  '--must_temperature_units':
    'Must temperature units should be one of "celsius" or "fahrenheit" (defaults to "fahrenheit"). Example: !calculate-mead --must_temperature 68 --must_temperature_units fahrenheit',
  '-g': 'Target gravity should be provided as a number in the specified units (defaults to 1.108). Example: !calculate-mead --target_gravity 1.108 --target_gravity_units sg',
  '--target_gravity':
    'Target gravity should be provided as a number in the specified units (defaults to 1.108). Example: !calculate-mead --target_gravity 1.108 --target_gravity_units sg',
  '-i': 'Target gravity units should be one of "sg", "brix", or "baume" (defaults to "sg"). Example: !calculate-mead --target_gravity 1.108 --target_gravity_units sg',
  '--target_gravity_units':
    'Target gravity units should be one of "sg", "brix", or "baume" (defaults to "sg"). Example: !calculate-mead --target_gravity 1.108 --target_gravity_units sg',
  '-a': 'Target ABV should be provided as a number in the specified units (defaults to 14.13). If target gravity is specified, this value will be ignored. Example: !calculate-mead --target_abv 14.13 --target_abv_units abv',
  '--target_abv':
    'Target ABV should be provided as a number in the specified units (defaults to 14.13). If target gravity is specified, this value will be ignored. Example: !calculate-mead --target_abv 14.13 --target_abv_units abv',
  '-b': 'Target ABV units should be one of "abv" or "abw" (defaults to "abv"). Example: !calculate-mead --target_abv 14.13 --target_abv_units abv',
  '--target_abv_units':
    'Target ABV units should be one of "abv" or "abw" (defaults to "abv"). Example: !calculate-mead --target_abv 14.13 --target_abv_units abv',
  '-v': 'Target volume should be provided as a number in the specified units (defaults to 5.0). Example: !calculate-mead --target_volume 5.0 --target_volume_units gallons_us',
  '--target_volume':
    'Target volume should be provided as a number in the specified units (defaults to 5.0). Example: !calculate-mead --target_volume 5.0 --target_volume_units gallons_us',
  '-w': 'Use the command !list-volume-units to get a list of acceptable input volume units (defaults to "gallons_us"). Example: !calculate-mead --target_volume 5.0 --target_volume_units gallons_us',
  '--target_volume_units':
    'Use the command !list-volume-units to get a list of acceptable input volume units (defaults to "gallons_us"). Example: !calculate-mead --target_volume 5.0 --target_volume_units gallons_us',
  '-s': 'Additional sugar should be specified as a comma-delimited string of name=value pairs containing information about additional sugar sources.\nMultiple additional sugars may be specified. Example: !calculate-mead --additional_sugars type=honey,quantity=15,units=pounds,sugar_content=79.6,yan_multiplier=0',
  '--additional_sugar':
    'Additional sugar should be specified as a comma-delimited string of name=value pairs containing information about additional sugar sources.\nMultiple additional sugars may be specified. Example: !calculate-mead --additional_sugars type=honey,quantity=15,units=pounds,sugar_content=79.6,yan_multiplier=0',
  '-c': 'Current gravity should be provided as a number in the specified units (defaults to 1.000). Example: !calculate-mead --current_gravity 1.000 --current_gravity_units sg',
  '--current_gravity':
    'Current gravity should be provided as a number in the specified units (defaults to 1.000). Example: !calculate-mead --current_gravity 1.000 --current_gravity_units sg',
  '-d': 'Current gravity units should be one of "sg", "brix", or "baume" (defaults to "sg"). Example: !calculate-mead --current_gravity 1.000 --current_gravity_units sg',
  '--current_gravity_units':
    'Current gravity units should be one of "sg", "brix", or "baume" (defaults to "sg"). Example: !calculate-mead --current_gravity 1.000 --current_gravity_units sg',
  '-r': 'Current volume should be provided as a number in the specified units (defaults to 0). Example: !calculate-mead --current_volume 0 --current_volume_units gallons_us',
  '--current_volume':
    'Current volume should be provided as a number in the specified units (defaults to 0). Example: !calculate-mead --current_volume 0 --current_volume_units gallons_us',
  '-y': 'Use the command !list-volume-units to get a list of acceptable input volume units (defaults to "gallons_us"). Example: !calculate-mead --current_volume 0 --current_volume_units gallons_us',
  '--current_volume_units':
    'Use the command !list-volume-units to get a list of acceptable input volume units (defaults to "gallons_us"). Example: !calculate-mead --current_volume 0 --current_volume_units gallons_us',
  '-e': 'Yeast ABV should be specified as a numeric ABV percentage that your yeast are expected to reach (default is 18).\nBe mindful that when treated well, yeast will likely overshoot their published tolerance.\nExample: !calculate-mead --yeast_abv 18',
  '--yeast_abv':
    'Yeast ABV should be specified as a numeric ABV percentage that your yeast are expected to reach (default is 18).\nBe mindful that when treated well, yeast will likely overshoot their published tolerance.\nExample: !calculate-mead --yeast_abv 18',
  '-n': 'YAN requirement should be specified as "very_low", "low", "medium", "high", or "kveik" (default is "medium").\nExample: !calculate-mead --yan_requirement medium',
  '--yan_requirement':
    'YAN requirement should be specified as "very_low", "low", "medium", "high", or "kveik" (default is "medium").\nExample: !calculate-mead --yan_requirement medium',
  '-o': 'Hot should be set to "true" when fermenting hot (>= 80F) with a yeast like Belle Saison (it defaults to "false").\nExample: !calculate-mead --hot true',
  '--hot':
    'Hot should be set to "true" when fermenting hot (>= 80F) with a yeast like Belle Saison (it defaults to "false").\nExample: !calculate-mead --hot true',
  '-z': 'Show nutrition can be one of "full", "partial", or "none" (defaults to "partial").\nIf it is set to none, then nutrition information is suppressed from the command output, if it is set to partial, then nutrient contribution details are suppressed from the command output, but other nutrition info is still included (defaults to partial).\nExample: !calculate-mead --show_nutrition partial',
  '--show_nutrition':
    'Show nutrition can be one of "full", "partial", or "none" (defaults to "partial").\nIf it is set to none, then nutrition information is suppressed from the command output, if it is set to partial, then nutrient contribution details are suppressed from the command output, but other nutrition info is still included (defaults to partial).\nExample: !calculate-mead --show_nutrition partial',
  '-l': 'Calculate additive honey should be set to "true" if you haven\'t specified a sugar source and want the calculator to determine how much honey to add to a specified volume instead of how much **of** a specified volume it should be (it defaults to "false").\nExample: !calculate-mead --calculate_additive_honey true',
  '--calculate_additive_honey':
    'Calculate additive honey should be set to "true" if you haven\'t specified a sugar source and want the calculator to determine how much honey to add to a specified volume instead of how much **of** a specified volume it should be (it defaults to "false").\nExample: !calculate-mead --calculate_additive_honey true',
  '-p': 'Target Step Feed Gravity should be a numeric value in target_gravity_units units, and should be larger than target_gravity.\nNote: If this parameter is specified, it will override any specified target_gravity.\nExample: !calculate-mead --target_gravity 1.080 --target_step_feed_gravity 1.170',
  '--target_step_feed_gravity':
    'Target Step Feed Gravity should be a numeric value in target_gravity_units units, and should be larger than target_gravity.\nNote: If this parameter is specified, it will override any specified target_gravity.\nExample: !calculate-mead --target_gravity 1.080 --target_step_feed_gravity 1.170',
  '-q': 'Overrides should be a semicolon-delimited list of name=value pairs containing values to be overridden from default.\nExample: !calculate-mead --overrides fermo_effectiveness=2.6;enforce_limits=true;limits=0.96,0.5,0.45;yan_ratios=35,25,40;fermk_yan=134;goferm_yan=77;fill_fk_first=true;use_goferm=true;yeast_pack_grams=5',
  '--overrides':
    'Overrides should be a semicolon-delimited list of name=value pairs containing values to be overridden from default.\nExample: !calculate-mead --overrides fermo_effectiveness=2.6;enforce_limits=true;limits=0.96,0.5,0.45;yan_ratios=35,25,40;fermk_yan=134;goferm_yan=77;fill_fk_first=true;use_goferm=true;yeast_pack_grams=5',
};

const USAGE =
  'Usage: !calculate-mead [-u|--units metric|us|imperial] [-t|--must_temperature <number>] [-x|--must_temperature_units celsius|fahrenheit] [-g|--target_gravity <number>] [-i|--target_gravity_units sg|brix|baum] [-a|--target_abv <number>] [-b|--target_abv_units abv|abw] [-v|--target_volume <number>] [-w|--target_volume_units <string>] [-s|--additional_sugar <string> [-s|--additional_sugar <string> ...]] [-c|--current_gravity <number>] [-d|--current_gravity_units sg|brix|baum] [-r|--current_volume <number>] [-y|--current_volume_units <string>] [-e|--yeast_abv <number>] [-n|--yan_requirement very_low|low|medium|high|kveik] [-o|--hot true|false] [-z|--show_nutrition true|false] [-l|--calculate_additive_honey true|false] [-p|--target_step_feed_gravity <number>] [-q|--overrides <string>] [-h|--help [all]]';

module.exports = {
  name: 'calculate-mead',
  aliases: ['mead'],
  description: 'Builds a full recipe for a mead of a given target gravity/ABV and volume.',
  execute(message, args) {
    const defaultAdditionalSugar = {
      type: Constants.SUGAR_SOURCES.HONEY,
      quantity_amount: null,
      quantity_amount_specified: false,
      quantity_units: Constants.HONEY_UNITS.POUNDS,
      sugar_content: Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].percent,
      additive: false,
      yan_multiplier: 1,
    };

    let units = Constants.UNITS.US;
    let mustTemperature = null;
    let mustTemperatureUnits = null;
    let targetGravity = null;
    let targetGravityUnits = null;
    let targetAbv = null;
    let targetAbvUnits = null;
    let targetVolume = null;
    let targetVolumeUnits = null;
    let additionalSugars = null;
    let currentGravity = null;
    let currentGravityUnits = null;
    let currentVolume = null;
    let currentVolumeUnits = null;
    let targetStepFeedGravity = null;

    let yeastAbv = 18;
    let yanRequirement = Constants.YAN_REQUIREMENT.MEDIUM;
    let hot = false;
    let showNutrition = SHOW_NUTRITION.PARTIAL;
    let calculateAdditiveHoney = false;

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
    let useGoferm = true;
    let useGofermSet = false;
    let yeastPackGrams = 5;

    if (args.length === 0) {
      args = ['-h', 'all'];
    }
    for (let i = 0; i < args.length; i += 2) {
      const argName = args[i];
      const argValue = args.length > i + 1 ? args[i + 1] : '';

      switch (argName) {
        case '-u':
        case '--units':
          if (i !== 0) {
            message.channel.send('If units is specified, it should be the first argument specified.');
            return;
          }
          switch (argValue) {
            case 'metric':
              units = Constants.UNITS.METRIC;
              defaultAdditionalSugar.quantity_units = Constants.HONEY_UNITS.KILOGRAMS;
              break;
            case 'us':
              units = Constants.UNITS.US;
              defaultAdditionalSugar.quantity_units = Constants.HONEY_UNITS.POUNDS;
              break;
            case 'imperial':
              units = Constants.UNITS.IMPERIAL;
              defaultAdditionalSugar.quantity_units = Constants.HONEY_UNITS.POUNDS;
              break;
            default:
              message.channel.send('Unrecognized value for units: ' + argValue);
              return;
          }
          break;
        case '-t':
        case '--must_temperature':
          mustTemperature = parseFloat(argValue);
          if (isNaN(mustTemperature)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-x':
        case '--must_temperature_units':
          switch (argValue) {
            case 'celsius':
              mustTemperatureUnits = Constants.TEMPERATURE_UNITS.CELSIUS;
              break;
            case 'fahrenheit':
              mustTemperatureUnits = Constants.TEMPERATURE_UNITS.FAHRENHEIT;
              break;
            default:
              message.channel.send('Unrecognized value for must_temperature_units: ' + argValue);
              return;
          }
          break;
        case '-g':
        case '--target_gravity':
          targetGravity = parseFloat(argValue);
          if (isNaN(targetGravity)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-i':
        case '--target_gravity_units':
          switch (argValue) {
            case 'sg':
              targetGravityUnits = Constants.GRAVITY_UNITS.SG;
              break;
            case 'brix':
              targetGravityUnits = Constants.GRAVITY_UNITS.BRIX;
              break;
            case 'baume':
              targetGravityUnits = Constants.GRAVITY_UNITS.BAUME;
              break;
            default:
              message.channel.send('Unrecognized value for target_gravity_units: ' + argValue);
              return;
          }
          break;
        case '-a':
        case '--target_abv':
          targetAbv = parseFloat(argValue);
          if (isNaN(targetAbv)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-b':
        case '--target_abv_units':
          if (argValue === 'abv') {
            targetAbvUnits = Constants.ABV_UNITS.ABV;
          } else if (argValue === 'abw') {
            targetAbvUnits = Constants.ABV_UNITS.ABW;
          } else {
            message.channel.send('Unrecognized value for target_abv_units: ' + argValue);
            return;
          }
          break;
        case '-v':
        case '--target_volume':
          targetVolume = parseFloat(argValue);
          if (isNaN(targetVolume)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-w':
        case '--target_volume_units':
          targetVolumeUnits = CalculatorAPI.GetVolumeUnit(argValue);
          if (targetVolumeUnits == null) {
            message.channel.send('Unrecognized value for target_volume_units: ' + argValue);
            return;
          }
          break;
        case '-s':
        case '--additional_sugar': {
          const additionalSugar = Object.assign({}, defaultAdditionalSugar);
          let sugarContentSpecified = false;
          let yanMultiplierSpecified = false;

          const sugarParts = argValue.split(',');
          for (const sugarPart of sugarParts) {
            const sugarArgParts = sugarPart.split('=');
            if (sugarArgParts.length < 2) {
              message.channel.send('Invalid argment in additional sugar: ' + sugarPart);
              return;
            }
            const [sugarArgName, sugarArgValue] = sugarArgParts;

            switch (sugarArgName) {
              case 't':
              case 'type':
                if (sugarArgValue === 'other') {
                  additionalSugar.type = null;
                } else {
                  const sugarType = CalculatorAPI.GetSugarSourceIdentifier(sugarArgValue);
                  if (sugarType == null) {
                    message.channel.send('Unrecognized sugar source: ' + sugarArgValue);
                    return;
                  }
                  additionalSugar.type = sugarType;
                }
                break;
              case 'q':
              case 'quantity':
                additionalSugar.quantity_amount = parseFloat(sugarArgValue);
                if (isNaN(additionalSugar.quantity_amount)) {
                  message.channel.send(sugarArgValue + ' is not a number.');
                  return;
                }
                additionalSugar.quantity_amount_specified = true;
                break;
              case 'u':
              case 'units':
                additionalSugar.quantity_units = CalculatorAPI.GetHoneyUnit(sugarArgValue);
                if (additionalSugar.quantity_units == null) {
                  message.channel.send('Unrecognized quntity unit in additional sugars: ' + sugarArgValue);
                }
                break;
              case 's':
              case 'sugar_content':
                additionalSugar.sugar_content = parseFloat(sugarArgValue);
                if (isNaN(additionalSugar.sugar_content)) {
                  message.channel.send(sugarArgValue + ' is not a number.');
                }
                sugarContentSpecified = true;
                break;
              case 'a':
              case 'additive':
                additionalSugar.additive = sugarArgValue === 'true';
                break;
              case 'y':
              case 'yan_multiplier':
                additionalSugar.yan_multiplier = parseFloat(sugarArgValue);
                if (isNaN(additionalSugar.yan_multiplier)) {
                  message.channel.send(sugarArgValue + ' is not a number.');
                  return;
                }
                yanMultiplierSpecified = true;
                break;
              default:
                message.channel.send('Unrecognized argument name in additional sugars: ' + sugarArgName);
                return;
            }
          }

          if (!sugarContentSpecified) {
            additionalSugar.sugar_content = Constants.SUGAR_SOURCE_INFO[additionalSugar.type].percent;
          }
          if (!yanMultiplierSpecified) {
            additionalSugar.yan_multiplier = Constants.SUGAR_SOURCE_INFO[additionalSugar.type].yan;
          }
          if (additionalSugars == null) {
            additionalSugars = [];
          }

          if (additionalSugar.additive && !additionalSugar.quantity_amount_specified) {
            message.channel.send(
              'If additive is set to true in additional sugar, then a quantity amount must be specified.'
            );
            return;
          }

          additionalSugars.push(additionalSugar);
          break;
        }
        case '-c':
        case '--current_gravity':
          currentGravity = parseFloat(argValue);
          if (isNaN(currentGravity)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-d':
        case '--current_gravity_units':
          switch (argValue) {
            case 'sg':
              currentGravityUnits = Constants.GRAVITY_UNITS.SG;
              break;
            case 'brix':
              currentGravityUnits = Constants.GRAVITY_UNITS.BRIX;
              break;
            case 'baume':
              currentGravityUnits = Constants.GRAVITY_UNITS.BAUME;
              break;
            default:
              message.channel.send('Unrecognized value for current_gravity_units: ' + argValue);
              return;
          }
          break;
        case '-r':
        case '--current_volume':
          currentVolume = parseFloat(argValue);
          if (isNaN(currentVolume)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-y':
        case '--current_volume_units':
          currentVolumeUnits = CalculatorAPI.GetVolumeUnit(argValue);
          if (currentVolumeUnits == null) {
            message.channel.send('Unrecognized value for current_volume_units: ' + argValue);
            return;
          }
          break;
        case '-e':
        case '--yeast_abv':
          yeastAbv = parseFloat(argValue);
          if (isNaN(yeastAbv)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          if (yeastAbv < 10.0 || yeastAbv > 22.0) {
            message.channel.send('Yeast ABV out of range: ' + yeastAbv.toFixed(2));
            return;
          }
          break;
        case '-n':
        case '--yan_requirement':
          if (argValue === 'very_low') {
            yanRequirement = Constants.YAN_REQUIREMENT.VERY_LOW;
          } else if (argValue === 'low') {
            yanRequirement = Constants.YAN_REQUIREMENT.LOW;
          } else if (argValue === 'high') {
            yanRequirement = Constants.YAN_REQUIREMENT.HIGH;
          } else if (argValue === 'kveik') {
            yanRequirement = Constants.YAN_REQUIREMENT.KVEIK;
            if (!useGofermSet) {
              useGoferm = false;
            }
          } else {
            yanRequirement = Constants.YAN_REQUIREMENT.MEDIUM;
          }
          break;
        case '-o':
        case '--hot':
          hot = argValue === 'true';
          break;
        case '-z':
        case '--show_nutrition':
          if (argValue === 'none') {
            showNutrition = SHOW_NUTRITION.NONE;
          } else if (argValue === 'full') {
            showNutrition = SHOW_NUTRITION.FULL;
          } else {
            showNutrition = SHOW_NUTRITION.PARTIAL;
          }
          break;
        case '-l':
        case '--calculate_additive_honey':
          calculateAdditiveHoney = argValue === 'true';
          break;
        case '-p':
        case '--target_step_feed_gravity':
          targetStepFeedGravity = parseFloat(argValue);
          if (isNaN(targetStepFeedGravity)) {
            message.channel.send(argValue + ' is not a number.');
            return;
          }
          break;
        case '-q':
        case '--overrides': {
          const overrideParts = argValue.split(';');
          for (const overridePart of overrideParts) {
            const overrideArgParts = overridePart.split('=');
            if (overrideArgParts.length < 2) {
              message.channel.send('Invalid argment in overrides: ' + overridePart);
              return;
            }
            const [overrideArgName, overrideArgValue] = overrideArgParts;

            switch (overrideArgName) {
              case 'e':
              case 'fermo_effectiveness':
                fermOEffectiveness = parseFloat(overrideArgValue);
                if (isNaN(fermOEffectiveness)) {
                  message.channel.send(overrideArgValue + ' is not a number.');
                  return;
                }
                break;
              case 'l':
              case 'enforce_limits':
                enforceLimits = overrideArgValue === 'true';
                break;
              case 'i':
              case 'limits': {
                const limits = overrideArgValue.split(',');
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
              case 'r':
              case 'yan_ratios': {
                const ratios = overrideArgValue.split(',');
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
              case 'k':
              case 'fermk_yan':
                fermKYan = parseInt(overrideArgValue, 10);
                if (isNaN(fermKYan)) {
                  message.channel.send(overrideArgValue + ' is not a number.');
                  return;
                }
                break;
              case 'g':
              case 'goferm_yan':
                gofermYan = parseInt(overrideArgValue, 10);
                if (isNaN(gofermYan)) {
                  message.channel.send(overrideArgValue + ' is not a number.');
                  return;
                }
                break;
              case 'f':
              case 'fill_fk_first':
                fillFkFirst = overrideArgValue === 'true';
                break;
              case 'u':
              case 'use_goferm':
                useGoferm = overrideArgValue === 'true';
                useGofermSet = true;
                break;
              case 'y':
              case 'yeast_pack_grams':
                yeastPackGrams = parseFloat(overrideArgValue);
                if (isNaN(yeastPackGrams)) {
                  message.channel.send(overrideArgValue + ' is not a number.');
                  return;
                }
                if (yeastPackGrams < 0 || yeastPackGrams > 25) {
                  message.channel.send('yeast_pack_grams out of range: ' + yeastPackGrams);
                  return;
                }
                break;
              default:
                message.channel.send('Unrecognized argument name in overrides: ' + overrideArgName);
                return;
            }
          }
          break;
        }
        case '-h':
        case '--help':
          message.channel.send(HELP_TEXT[argValue] || USAGE);
          return;
      }
    }

    const result = Batch.calculateMead({
      units,
      mustTemperature,
      mustTemperatureUnits,
      targetGravity,
      targetGravityUnits,
      targetAbv,
      targetAbvUnits,
      targetVolume,
      targetVolumeUnits,
      additionalSugars,
      currentGravity,
      currentGravityUnits,
      currentVolume,
      currentVolumeUnits,
      targetStepFeedGravity,
      yeastAbv,
      yanRequirement,
      hot,
      calculateAdditiveHoney,
      fermOEffectiveness,
      enforceLimits,
      dapLimit,
      fermKLimit,
      fermOLimit,
      yanRatioDap,
      yanRatioFermK,
      yanRatioFermO,
      fermKYan,
      gofermYan,
      fillFkFirst,
      useGoferm,
      yeastPackGrams,
    });
    if (result.error) {
      message.channel.send(result.errorMessage);
      return;
    }
    ({
      mustTemperature,
      mustTemperatureUnits,
      targetGravity,
      targetGravityUnits,
      targetStepFeedGravity,
      targetAbv,
      targetAbvUnits,
      targetVolume,
      targetVolumeUnits,
      currentGravity,
      currentGravityUnits,
      currentVolume,
      currentVolumeUnits,
      additionalSugars,
    } = result);
    const {
      targetFinalGravity,
      currentGravitySpecified,
      currentVolumeSpecified,
      gofermYanContribution,
      fruitYanContribution,
      nutrients,
      break3,
    } = result;
    const gf = [
      result.goferm.minGrams,
      result.goferm.numPackets,
      result.goferm.grams,
      result.goferm.dilutionWaterMl,
      result.goferm.yeastPackGrams,
    ];
    const { volumeAfterSteps, honeyVolsPerStep, numberOfSteps, stepAddSg } = result.stepFeeding || {};
    const honeyStepUnits =
      units === Constants.UNITS.METRIC ? Constants.HONEY_UNITS.KILOGRAMS : Constants.HONEY_UNITS.POUNDS;

    // display output
    const batchInfoEmbed = new EmbedBuilder().setTitle('Batch Info').addFields(
      {
        name: 'Temperature of Must',
        value: mustTemperature.toFixed(2) + ' ' + Constants.TEMPERATURE_UNIT_NAMES[mustTemperatureUnits],
        inline: true,
      },
      {
        name: 'Target OG',
        value:
          targetGravity.toFixed(3) +
          (targetStepFeedGravity == null ? '' : '/' + targetStepFeedGravity.toFixed(3)) +
          ' ' +
          Constants.GRAVITY_UNIT_NAMES[targetGravityUnits],
        inline: true,
      },
      {
        name: 'Target FG',
        value: targetFinalGravity.toFixed(3) + ' ' + Constants.GRAVITY_UNIT_NAMES[targetGravityUnits],
        inline: true,
      },
      { name: 'Target ' + Constants.ABV_UNIT_NAMES[targetAbvUnits], value: targetAbv.toFixed(2), inline: true },
      {
        name: 'Target Volume',
        value: targetVolume.toFixed(2) + ' ' + Constants.VOLUME_UNIT_INFO[targetVolumeUnits].name,
        inline: true,
      }
    );
    if (targetStepFeedGravity != null) {
      batchInfoEmbed.addFields(
        {
          name: 'Volume after Steps',
          value: volumeAfterSteps.toFixed(2) + ' ' + Constants.VOLUME_UNIT_INFO[targetVolumeUnits].name,
          inline: true,
        },
        {
          name: 'Step Feeding',
          value:
            'Add ' +
            honeyVolsPerStep.toFixed(2) +
            ' ' +
            Constants.HONEY_UNIT_INFO[honeyStepUnits].name +
            ' of Honey ' +
            numberOfSteps +
            ' times, when SG = ' +
            stepAddSg.toFixed(3),
          inline: false,
        }
      );
    }
    if (showNutrition >= SHOW_NUTRITION.PARTIAL) {
      batchInfoEmbed.addFields(
        {
          name: 'Total YAN',
          value: (nutrients.yan + gofermYanContribution + fruitYanContribution).toFixed(1),
          inline: true,
        },
        { name: 'YAN Contribution from Fruit/Grain', value: String(fruitYanContribution), inline: true },
        { name: 'Fermaid O Effectiveness', value: String(nutrients.foe), inline: true },
        { name: 'Go-Ferm YAN Contribution', value: String(gofermYanContribution), inline: true },
        { name: 'DAP Limit (g/L)', value: nutrients.dap_limit.toFixed(2), inline: true },
        { name: 'Ferm K Limit (g/L)', value: nutrients.fermK_limit.toFixed(2), inline: true },
        { name: 'Ferm O Limit (g/L)', value: nutrients.fermO_limit.toFixed(2), inline: true }
      );
    }
    if (currentGravitySpecified) {
      batchInfoEmbed.addFields({
        name: 'Current Gravity',
        value: currentGravity.toFixed(3) + ' ' + Constants.GRAVITY_UNIT_NAMES[currentGravityUnits],
        inline: true,
      });
    }
    if (currentVolumeSpecified) {
      batchInfoEmbed.addFields({
        name: 'Current Volume',
        value: currentVolume.toFixed(3) + ' ' + Constants.VOLUME_UNIT_INFO[currentVolumeUnits].name,
        inline: true,
      });
    }

    const additionalSugarEmbeds = (additionalSugars || []).map((sugar) =>
      new EmbedBuilder().setTitle('Additional Sugar').addFields(
        { name: 'Type', value: Constants.SUGAR_SOURCE_INFO[sugar.type].name, inline: true },
        {
          name: 'Quantity',
          value: sugar.quantity_amount.toFixed(3) + ' ' + Constants.HONEY_UNIT_INFO[sugar.quantity_units].name,
          inline: true,
        },
        { name: 'Sugar Content', value: sugar.sugar_content.toFixed(2) + '%', inline: true }
      )
    );

    const yeastEmbed = new EmbedBuilder()
      .setTitle('Yeast/Rehydration')
      .addFields({ name: 'Dry Yeast Minimum Weight', value: gf[0] + 'g', inline: true });
    if (gf[4] > 0) {
      yeastEmbed.addFields({
        name: '# Dry Yeast Packet(s)',
        value: gf[1] + ' (' + gf[1] * gf[4] + 'g yeast)',
        inline: true,
      });
    }
    if (gf[2] > 0) {
      yeastEmbed.addFields(
        { name: 'Go-ferm', value: gf[2] + 'g', inline: true },
        { name: 'Water to dilute Go-ferm', value: gf[2] * 20 + 'ml', inline: true }
      );
    }

    const snaEmbed = new EmbedBuilder().setTitle('Nutrient Additions');
    for (const addition of nutrients.sna.additions) {
      snaEmbed.addFields({
        name: CalculatorAPI.MakeHoursString(addition.timing, break3),
        value: Nutrient.makeNutString(addition),
        inline: true,
      });
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

    async function sendSugarEmbed(index) {
      if (index < additionalSugarEmbeds.length) {
        await message.channel.send({ embeds: [additionalSugarEmbeds[index]] });
        await sendSugarEmbed(index + 1);
      } else if (showNutrition === SHOW_NUTRITION.FULL) {
        await message.channel.send({ embeds: [yeastEmbed] });
        await message.channel.send({ embeds: [nutrientsEmbed] });
        await message.channel.send({ embeds: [snaEmbed] });
      } else if (showNutrition === SHOW_NUTRITION.PARTIAL) {
        await message.channel.send({ embeds: [yeastEmbed] });
        await message.channel.send({ embeds: [snaEmbed] });
      }
    }

    message.channel.send({ embeds: [batchInfoEmbed] }).then(() => sendSugarEmbed(0));
  },
};
