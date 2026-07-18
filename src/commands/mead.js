const { EmbedBuilder } = require('discord.js');
const CalculatorAPI = require('../calculator/CalculatorAPI.js');
const Gravity = require('../calculator/GravityCalculator.js');
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
    let defaultMustTemperature = 68;
    let defaultMustTemperatureUnits = Constants.TEMPERATURE_UNITS.FAHRENHEIT;
    let defaultTargetGravity = 1.108;
    const defaultTargetGravityUnits = Constants.GRAVITY_UNITS.SG;
    let defaultTargetAbv = 14.13;
    const defaultTargetAbvUnits = Constants.ABV_UNITS.ABV;
    let defaultTargetVolume = 5.0;
    let defaultTargetVolumeUnits = Constants.VOLUME_UNITS.GALLONS_US;
    const defaultAdditionalSugar = {
      type: Constants.SUGAR_SOURCES.HONEY,
      quantity_amount: null,
      quantity_amount_specified: false,
      quantity_units: Constants.HONEY_UNITS.POUNDS,
      sugar_content: Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].percent,
      additive: false,
      yan_multiplier: 1,
    };
    const defaultCurrentGravity = 1.0;
    const defaultCurrentGravityUnits = Constants.GRAVITY_UNITS.SG;
    const defaultCurrentVolume = 0;
    let defaultCurrentVolumeUnits = Constants.VOLUME_UNITS.GALLONS_US;

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
              defaultMustTemperatureUnits = Constants.TEMPERATURE_UNITS.CELSIUS;
              defaultMustTemperature = 20;
              defaultTargetVolumeUnits = Constants.VOLUME_UNITS.LITERS;
              defaultCurrentVolumeUnits = Constants.VOLUME_UNITS.LITERS;
              defaultTargetVolume = 18.93;
              defaultAdditionalSugar.quantity_units = Constants.HONEY_UNITS.KILOGRAMS;
              break;
            case 'us':
              units = Constants.UNITS.US;
              defaultMustTemperatureUnits = Constants.TEMPERATURE_UNITS.FAHRENHEIT;
              defaultMustTemperature = 68;
              defaultTargetVolumeUnits = Constants.VOLUME_UNITS.GALLONS_US;
              defaultCurrentVolumeUnits = Constants.VOLUME_UNITS.GALLONS_US;
              defaultTargetVolume = 5;
              defaultAdditionalSugar.quantity_units = Constants.HONEY_UNITS.POUNDS;
              break;
            case 'imperial':
              units = Constants.UNITS.IMPERIAL;
              defaultMustTemperatureUnits = Constants.TEMPERATURE_UNITS.FAHRENHEIT;
              defaultMustTemperature = 68;
              defaultTargetVolumeUnits = Constants.VOLUME_UNITS.GALLONS_IMP;
              defaultCurrentVolumeUnits = Constants.VOLUME_UNITS.GALLONS_IMP;
              defaultTargetVolume = 5;
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

    // determine which entries need to be computed & update them
    let targetGravitySpecified = targetGravity != null;
    const targetVolumeSpecified = targetVolume != null;
    const targetAbvSpecified = targetAbv != null;
    const currentGravitySpecified = currentGravity != null;
    const currentVolumeSpecified = currentVolume != null;

    if (currentGravityUnits == null) {
      currentGravityUnits = defaultCurrentGravityUnits;
    }
    if (currentGravity == null) {
      currentGravity = defaultCurrentGravity;
    }
    if (currentVolumeUnits == null) {
      currentVolumeUnits = defaultCurrentVolumeUnits;
    }
    if (currentVolume == null) {
      currentVolume = defaultCurrentVolume;
    }
    if (targetGravityUnits == null) {
      targetGravityUnits = defaultTargetGravityUnits;
    }
    if (targetGravity == null) {
      targetGravity = defaultTargetGravity;
    }
    if (targetVolumeUnits == null) {
      targetVolumeUnits = defaultTargetVolumeUnits;
    }
    if (targetVolume == null) {
      targetVolume = defaultTargetVolume;
    }
    if (targetAbvUnits == null) {
      targetAbvUnits = defaultTargetAbvUnits;
    }
    if (targetAbv == null) {
      targetAbv = defaultTargetAbv;
    }
    if (mustTemperature == null) {
      mustTemperature = defaultMustTemperature;
    }
    if (mustTemperatureUnits == null) {
      mustTemperatureUnits = defaultMustTemperatureUnits;
    }

    let additionalSugarsVolumeCheck = 0;
    if (additionalSugars != null) {
      for (const sugar of additionalSugars) {
        const targetLiters =
          (sugar.quantity_amount / Constants.HONEY_UNIT_INFO[Constants.HONEY_UNITS.LITERS].conversion) *
          Constants.HONEY_UNIT_INFO[sugar.quantity_units].conversion;
        const sugarVolumeInTargetVolumeUnits = targetLiters / Constants.VOLUME_UNIT_INFO[targetVolumeUnits].conversion;

        if (sugar.additive) {
          targetVolume += sugarVolumeInTargetVolumeUnits;
        }
        additionalSugarsVolumeCheck += sugarVolumeInTargetVolumeUnits;
      }
    }
    if (additionalSugarsVolumeCheck >= targetVolume) {
      const targetVolumeUnitName = Constants.VOLUME_UNIT_INFO[targetVolumeUnits].name;
      message.channel.send(
        'Total sugar volume (' +
          additionalSugarsVolumeCheck.toFixed(3) +
          ' ' +
          targetVolumeUnitName +
          ') is greater than total target volume (' +
          targetVolume.toFixed(3) +
          ' ' +
          targetVolumeUnitName +
          ').\nIt must be less than or equal.'
      );
      return;
    }

    let vSugar = 0;
    const vCSg = Number(Gravity.toSG(currentGravity, currentGravityUnits));
    const vCVol = Number(Gravity.toVol(currentVolumeUnits, currentVolume));
    let vTSg = Number(Gravity.toSG(targetGravity, targetGravityUnits));
    let vTVol = Number(Gravity.toVol(targetVolumeUnits, targetVolume));
    const tempCoeff = Gravity.getTempCoeff(mustTemperature, mustTemperatureUnits);
    let vTSfSg = null;
    if (targetStepFeedGravity != null) {
      vTSfSg = Number(Gravity.toSG(targetStepFeedGravity, targetGravityUnits));
      if (targetGravitySpecified && vTSfSg <= vTSg) {
        message.channel.send('target_step_feed_gravity should be greater than target_gravity');
        return;
      }
    }

    let dryFg = CalculatorAPI.EstimateDryFG(vTSg);

    if (targetStepFeedGravity != null) {
      targetAbv = CalculatorAPI.ConvertGravityDropToABV(vTSfSg);
      if (targetAbvUnits === Constants.ABV_UNITS.ABW) {
        targetAbv = Gravity.ABVToABW(targetAbv);
      }
      if (targetAbv > yeastAbv) {
        targetAbv = yeastAbv;
      }
    } else if (targetGravitySpecified) {
      targetAbv = CalculatorAPI.ConvertGravityDropToABV(vTSg - dryFg + 1);
      if (targetAbvUnits === Constants.ABV_UNITS.ABW) {
        targetAbv = Gravity.ABVToABW(targetAbv);
      }
      if (targetAbv > yeastAbv) {
        targetAbv = yeastAbv;
      }
    } else if (targetAbvSpecified) {
      vTSg =
        targetAbvUnits === Constants.ABV_UNITS.ABW
          ? Gravity.stormABVtoSG(Gravity.ABWToABV(targetAbv))
          : Gravity.stormABVtoSG(targetAbv);

      dryFg = CalculatorAPI.EstimateDryFG(vTSg);
      vTSg = targetGravity = vTSg + dryFg - 1;
      targetGravitySpecified = true; // we just specified it
    }

    let unspecifiedSugar = false;
    if (additionalSugars != null) {
      for (const sugar of additionalSugars) {
        if (sugar.quantity_amount_specified) {
          vSugar += Gravity.getSugars(sugar);
        } else {
          unspecifiedSugar = true;
        }
      }
    }

    // do the calculations
    if (targetVolumeSpecified && !targetGravitySpecified) {
      const mygpl = (vSugar * 1000 + Gravity.SGToSugarConc(vCSg - tempCoeff) * vCVol) / vTVol;
      vTSg = Gravity.sugarConcToSG(mygpl) + tempCoeff;
      targetGravity = Gravity.doConvertSG(Constants.GRAVITY_UNITS.SG, targetGravityUnits, vTSg);
      targetGravity = Math.round(targetGravity * 1000) / 1000;

      dryFg = CalculatorAPI.EstimateDryFG(vTSg);

      if (targetStepFeedGravity == null) {
        targetAbv =
          targetAbvUnits === Constants.ABV_UNITS.ABW
            ? Gravity.ABVToABW(CalculatorAPI.ConvertGravityDropToABV(vTSg - dryFg + 1))
            : CalculatorAPI.ConvertGravityDropToABV(vTSg - dryFg + 1);

        if (targetAbv > yeastAbv) {
          targetAbv = yeastAbv;
        }
      } else if (vTSfSg <= vTSg) {
        message.channel.send('target_step_feed_gravity should be greater than target_gravity');
        return;
      }
    } else if (!targetVolumeSpecified && targetGravitySpecified && additionalSugars != null) {
      vTVol = (vSugar * 1000 + Gravity.SGToSugarConc(vCSg) * vCVol) / Gravity.SGToSugarConc(vTSg);
      targetVolume = Number(vTVol / Constants.VOLUME_UNIT_INFO[targetVolumeUnits].conversion);
    } else if (targetGravitySpecified && targetVolumeSpecified && (additionalSugars == null || unspecifiedSugar)) {
      // calculate sugar quantity - we either add a honey specification, or specify an unspecified sugar
      const myQuant =
        (Gravity.SGToSugarConc(vTSg) * vTVol) / 1000 - (Gravity.SGToSugarConc(vCSg) * vCVol) / 1000 - vSugar;
      if (additionalSugars == null) {
        if (calculateAdditiveHoney) {
          let honeyAmount = 0;
          const quantityUnits =
            units === Constants.UNITS.METRIC ? Constants.HONEY_UNITS.KILOGRAMS : Constants.HONEY_UNITS.POUNDS;
          const sugarContent = Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].percent;
          const yanMultiplier = Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].yan;

          const testQuant = (amount) =>
            (Gravity.SGToSugarConc(vTSg) *
              (vTVol +
                (amount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion) /
                  Constants.HONEY_UNIT_INFO[Constants.HONEY_UNITS.LITERS].conversion)) /
              1000 -
            (Gravity.SGToSugarConc(vCSg) * vCVol) / 1000 -
            vSugar -
            (amount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion * sugarContent) / 100;

          while (testQuant(honeyAmount) > 0) {
            honeyAmount += 0.001;
          }

          additionalSugars = [
            {
              type: Constants.SUGAR_SOURCES.HONEY,
              quantity_amount: honeyAmount,
              quanity_amount_specified: true,
              quantity_units: quantityUnits,
              sugar_content: sugarContent,
              yan_multiplier: yanMultiplier,
              additive: true,
            },
          ];

          vTVol +=
            (honeyAmount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion) /
            Constants.HONEY_UNIT_INFO[Constants.HONEY_UNITS.LITERS].conversion;
          targetVolume +=
            (honeyAmount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion) /
            Constants.HONEY_UNIT_INFO[Gravity.volumeUnitsToHoneyUnits(targetVolumeUnits)].conversion;
          vSugar += (honeyAmount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion * sugarContent) / 100;
        } else {
          const quantityUnits =
            units === Constants.UNITS.METRIC ? Constants.HONEY_UNITS.KILOGRAMS : Constants.HONEY_UNITS.POUNDS;
          const sugarContent = Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].percent;
          const yanMultiplier = Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].yan;

          additionalSugars = [
            {
              type: Constants.SUGAR_SOURCES.HONEY,
              quantity_amount:
                Math.round(
                  (myQuant /
                    ((Number(Constants.HONEY_UNIT_INFO[quantityUnits].conversion) * Number(sugarContent)) / 100)) *
                    1000
                ) / 1000,
              quanity_amount_specified: true,
              quantity_units: quantityUnits,
              sugar_content: sugarContent,
              yan_multiplier: yanMultiplier,
            },
          ];
        }
      } else {
        let foundSugar = false;
        for (const sugar of additionalSugars) {
          if (!sugar.quantity_amount_specified) {
            if (foundSugar) {
              sugar.quantity_amount = 0;
            } else {
              sugar.quantity_amount =
                Math.round(
                  (myQuant /
                    ((Number(Constants.HONEY_UNIT_INFO[sugar.quantity_units].conversion) *
                      Number(sugar.sugar_content)) /
                      100)) *
                    1000
                ) / 1000;
              foundSugar = true;
            }
            sugar.quantity_amount_specified = true;
          }
        }
      }
    }

    let numberOfSteps = 0;
    let honeyVolsPerStep = 0;
    const honeyStepUnits =
      units === Constants.UNITS.METRIC ? Constants.HONEY_UNITS.KILOGRAMS : Constants.HONEY_UNITS.POUNDS;
    let volumeAfterSteps = 0;
    let stepAddSg = vTSg;
    if (targetStepFeedGravity != null) {
      if (vTSg < 1.08) {
        message.channel.send('Step feeding is not recommended for OG < 1.080.');
        return;
      }

      const stepSgDiff = vTSfSg - vTSg;
      numberOfSteps = Math.min(Math.ceil(stepSgDiff / 0.04), 3);

      let honeyPounds = 0;
      const quantityUnits = Constants.HONEY_UNITS.POUNDS;
      const sugarContent = Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].percent;

      const testQuant = (amount) =>
        (Gravity.SGToSugarConc(vTSfSg) *
          (vTVol +
            (amount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion) /
              Constants.HONEY_UNIT_INFO[Constants.HONEY_UNITS.LITERS].conversion)) /
          1000 -
        (Gravity.SGToSugarConc(vCSg) * vCVol) / 1000 -
        vSugar -
        (amount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion * sugarContent) / 100;

      while (testQuant(honeyPounds) > 0) {
        honeyPounds += 0.001;
      }

      honeyVolsPerStep =
        honeyStepUnits === Constants.HONEY_UNITS.POUNDS
          ? honeyPounds / numberOfSteps
          : (honeyPounds * Constants.HONEY_UNIT_INFO[Constants.HONEY_UNITS.POUNDS].conversion) / numberOfSteps;

      volumeAfterSteps =
        targetVolume +
        (honeyPounds * Constants.HONEY_UNIT_INFO[quantityUnits].conversion) /
          Constants.HONEY_UNIT_INFO[Gravity.volumeUnitsToHoneyUnits(targetVolumeUnits)].conversion;
      stepAddSg = stepAddSg - stepSgDiff / numberOfSteps - 0.01;
    }

    // values needed for yan calculations
    const og =
      targetStepFeedGravity == null
        ? Gravity.convToSG(targetGravity, targetGravityUnits)
        : Gravity.convToSG(targetStepFeedGravity, targetGravityUnits);

    let fg =
      og -
      Gravity.stormABVtoSG(targetAbvUnits === Constants.ABV_UNITS.ABV ? targetAbv : Gravity.ABWToABV(targetAbv)) +
      1;
    if (fg < dryFg) {
      fg = dryFg;
    }
    const gravityDropSg = og - fg + 1;

    // apply yan from fruit/grain...
    let fruitYanConcentrationPercent = 0;
    if (additionalSugars != null) {
      for (const sugar of additionalSugars) {
        if (sugar.yan_multiplier !== 0) {
          const sSugar = Gravity.getSugars(sugar);
          const sGpl = (sSugar * 1000 + Gravity.SGToSugarConc(vCSg - tempCoeff) * vCVol) / vTVol;
          const sSG = Gravity.sugarConcToSG(sGpl) + tempCoeff;

          let fruitPercent = (sugar.yan_multiplier * (sSG - 1)) / (gravityDropSg - 1);
          if (yanRequirement === Constants.YAN_REQUIREMENT.KVEIK) {
            fruitPercent = fruitPercent / 1.5;
          }

          fruitYanConcentrationPercent += fruitPercent;
        }
      }
    }

    // now calculate nutrients
    let targetFinalGravity = fg;
    if (targetGravityUnits === Constants.GRAVITY_UNITS.BAUME) {
      targetFinalGravity = Gravity.SGToBaume(fg);
    } else if (targetGravityUnits === Constants.GRAVITY_UNITS.BRIX) {
      targetFinalGravity = CalculatorAPI.ConvertSGToBrix(fg);
    }

    let deltaFG = og - fg + 1;
    if (targetStepFeedGravity != null) {
      deltaFG += 0.01;
    }
    let yan = Gravity.stormSGtoYAN(deltaFG, yanRequirement);
    const fruitYanContribution = Math.floor(yan * fruitYanConcentrationPercent);
    yan -= fruitYanContribution;

    const liters =
      (targetStepFeedGravity == null ? targetVolume : volumeAfterSteps) *
      Constants.VOLUME_UNIT_INFO[targetVolumeUnits].conversion;
    const gallons = liters / 3.784;

    let snaSchedule;
    if (targetStepFeedGravity != null) {
      if (yanRequirement === Constants.YAN_REQUIREMENT.KVEIK) {
        snaSchedule = ['pitch'];
        for (let j = 0; j < numberOfSteps + 1; j++) {
          snaSchedule.push(24 + 24 * j);
        }
      } else if (hot) {
        snaSchedule = [24];
        for (let j = 0; j <= numberOfSteps + 1; j++) {
          snaSchedule.push(48 + 24 * j);
        }
      } else {
        snaSchedule = ['24,0', '48,0', '72,0'];
        if (numberOfSteps >= 1) {
          snaSchedule.push('24,1');
        }
        if (numberOfSteps >= 2) {
          snaSchedule.push('48,1');
          snaSchedule.push('72,1');
          snaSchedule.push('24,2');
        }
      }
    } else if (yanRequirement === Constants.YAN_REQUIREMENT.KVEIK) {
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

    const gf = Nutrient.getGoferm(
      gallons,
      og,
      fruitYanContribution,
      useGoferm,
      yeastPackGrams,
      yanRequirement === Constants.YAN_REQUIREMENT.KVEIK
    );
    const gofermYanContribution = Math.floor((gf[2] * gofermYan) / liters);
    yan -= gofermYanContribution;
    if (yan < 0) {
      yan = 0;
    }

    const nutrients = Nutrient.getAdvancedNutrients(
      Constants.UNITS.METRIC,
      liters,
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

    const ogPts = og - 1;
    const fgPts = fg - 1;
    const sgDiff = ogPts - fgPts;
    const break3 = 1 + (fgPts + (sgDiff * 2) / 3);

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
