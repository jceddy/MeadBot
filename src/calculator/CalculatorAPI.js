// CalculatorAPI.js

exports.Constants = require('./CalculatorAPI.Constants.js');

// RandomInteger(max) - returns a random integer in the range [0-max)
exports.RandomInteger = function (max) {
  return Math.floor(Math.random() * Math.floor(max));
};

// GetDaysBetween(date1, date2) - calculate the number of full days between date1 and date2
exports.GetDaysBetween = function (date1, date2) {
  var timeDifference = date2.getTime() - date1.getTime();
  return Math.abs(timeDifference / (1000 * 3600 * 24));
};

// GetMonthsBetween(date1, date2, roundUpFractionalMonths) - calculate the number of months between date1 and date2
//  if roundUpFractionalMonths is true, it will round fractional months to full months, otherwise it will ignore fractional months
exports.GetMonthsBetween = function (date1, date2, roundUpFractionalMonths) {
  // Months will be calculated between start and end dates.
  // Make sure start date is less than end date.
  // But remember if the difference should be negative.
  var startDate = date1;
  var endDate = date2;
  var inverse = false;
  if (date1 > date2) {
    startDate = date2;
    endDate = date1;
    inverse = true;
  }

  // Calculate the differences between the start and end dates
  var yearsDifference = endDate.getFullYear() - startDate.getFullYear();
  var monthsDifference = endDate.getMonth() - startDate.getMonth();
  var daysDifference = endDate.getDate() - startDate.getDate();

  var monthCorrection = 0;

  // If roundUpFractionalMonths is true, check if an extra month needs to be added from rounding up.
  // The difference is done by ceiling (round up), e.g. 3 months and 1 day will be 4 months.
  if (roundUpFractionalMonths === true && daysDifference > 0) {
    monthCorrection = 1;
  }

  // If the day difference between the 2 months is negative, the last month is not a whole month.
  else if (roundUpFractionalMonths !== true && daysDifference < 0) {
    monthCorrection = -1;
  }

  return (inverse ? -1 : 1) * (yearsDifference * 12 + monthsDifference + monthCorrection);
};

// create and return an object with the following fields:
//  - error - true
//  - errorMessage - value of "message" argument
//  - errorArgument - vaue of "argument" argument
//  - errorArgumentPosition - value of "argumentPosition" argument
//  - errorType - value of "type" argument
exports.MakeError = function (message, argument, argumentPosition, type) {
  return {
    error: true,
    errorMessage: message,
    errorArgument: argument,
    errorArgumentPosition: argumentPosition,
    errorType: type,
  };
};

// CalculateCalories(percentAlcohol, fg, bottleMl, servingMl) - estimate the caloric content of a beverage
//  - percentAlcohol = percentage of alcohol by volume in the beverage (i.e. 11.5 = 11.5% ABV)
//  - fg - specific gravity of the beverage (i.e. 1.035)
//  - bottleVolume - milliliters in a bottle of the beverage
//  - servingVolume - milliliters in a serving of the beverage
// returns an object with the following fields:
//  - error - true/false, depending on whether there was an error in the calculation, if true, errorMessage will be set and other fields may not be
//            if false, errorMessage will not be set
//  - errorMessage - a descriptive error message in case there was an error
//  - errorArgument - the name of the argument that cause the error (if known)
//  - errorType - set to some known values like isNaN, range
//  - percentAlcohol - percentage of alcohol by volume in the beverage (i.e. 11.5 = 11.5% ABV)
//  - fg - specific gravity of the beverage (i.e. 1.035)
//  - alcoholGramsLiter - grams of alcohol per liter of beverage
//  - alcoholCalories - calories per liter from alcohol
//  - bottleVolume - milliliters in a bottle of the beverage
//  - servingVolume - milliliters in a serving of the beverage
//  - residualSugar - grams of residual sugar per liter of beverage
//  - residualCalories - calories per liter from residual sugar
//  - totalCaloriesBottle - total estimated calories per bottle
//  - totalCalories250 - total estimated calories per 250 ml
//  - totalCaloriesServing - total estimated calories per serving
exports.CalculateCalories = function (percentAlcohol, fg, bottleVolume, servingVolume) {
  // validate percentAlcohol argument
  if (isNaN(percentAlcohol)) {
    return exports.MakeError(
      'percentAlcohol ' + percentAlcohol + ' is not a number.',
      'percentAlcohol',
      0,
      exports.Constants.ErrorTypes.IS_NAN
    );
  }
  if (percentAlcohol < 0 || percentAlcohol > 100) {
    return exports.MakeError(
      'Percent Alcohol is out of range: ' + percentAlcohol.toFixed(1),
      'percentAlcohol',
      0,
      exports.Constants.ErrorTypes.RANGE
    );
  }

  // validate fg argument
  if (isNaN(fg)) {
    return exports.MakeError('fg ' + fg + ' is not a number.', 'fg', 1, exports.Constants.ErrorTypes.IS_NAN);
  }
  if (fg < 0.99 || fg > 1.2) {
    return exports.MakeError(
      'Final Gravity is out of range: ' + fg.toFixed(3),
      'fg',
      1,
      exports.Constants.ErrorTypes.RANGE
    );
  }

  // validate bottleVolume argument
  if (isNaN(bottleVolume)) {
    return exports.MakeError(
      'bottleVolume ' + bottleVolume + ' is not a number.',
      'bottleVolume',
      2,
      exports.Constants.ErrorTypes.IS_NAN
    );
  }
  if (bottleVolume < 100 || bottleVolume > 5000) {
    return exports.MakeError(
      'Bottle ml is out of range: ' + bottleVolume.toFixed(1),
      'bottleVolume',
      2,
      exports.Constants.ErrorTypes.RANGE
    );
  }

  // validate servingVolume argument
  if (isNaN(servingVolume)) {
    return exports.MakeError(
      'servingVolume ' + servingVolume + ' is not a number.',
      'servingVolume',
      3,
      exports.Constants.ErrorTypes.IS_NAN
    );
  }
  if (servingVolume < 10 || servingVolume > 1000) {
    return exports.MakeError(
      'Serving ml is out of range: ' + servingVolume.toFixed(1),
      'servingVolume',
      3,
      exports.Constants.ErrorTypes.RANGE
    );
  }

  var alc_g_L = 0.8 * percentAlcohol;
  var alc_cal = alc_g_L * 7;
  var residual_sugar = (fg * 2641 - 2625) * (bottleVolume / 1000);
  var residual_calories = residual_sugar * 4;
  var total_calories_bottle = alc_cal * (bottleVolume / 100) + residual_calories;
  var total_calories_250 = alc_cal * 2.5 + residual_calories / (bottleVolume / 250);
  var total_calories_serving = alc_cal * (servingVolume / 100) + residual_calories / (bottleVolume / servingVolume);

  return {
    error: false,
    percentAlcohol: percentAlcohol,
    fg: fg,
    alcoholGramsLiter: alc_g_L,
    alcoholCalories: alc_cal,
    bottleVolume: bottleVolume,
    servingVolume: servingVolume,
    residualSugar: residual_sugar,
    residualCalories: residual_calories,
    totalCaloriesBottle: total_calories_bottle,
    totalCalories250: total_calories_250,
    totalCaloriesServing: total_calories_serving,
  };
};

// ConvertGravityDropToABV(sgDelta) - convert a gravity drop to a %ABV estimate
exports.ConvertGravityDropToABV = function (sgDelta) {
  return -109.7 * Math.pow(sgDelta, 2) + 361.84 * sgDelta - 252.1;
};

// EstimeateDryFG() - estimate the "dry" final gravity from an original gravity
//  - og - the original gravity
// returns the estimated final gravity you will get if all sugar is converted in a
// must with the specified original gravity
exports.EstimateDryFG = function (og) {
  if (og <= 1.0) {
    return og;
  }
  if (og >= exports.Constants.DRY_FG_OG_VALUES[exports.Constants.DRY_FG_OG_VALUES.length - 1]) {
    return exports.Constants.DRY_FG_FG_VALUES[exports.Constants.DRY_FG_FG_VALUES.length - 1];
  }
  var i = 1;
  while (og > exports.Constants.DRY_FG_OG_VALUES[i] && i < exports.Constants.DRY_FG_OG_VALUES.length) {
    i++;
  }

  // interpolate
  var mu =
    (og - exports.Constants.DRY_FG_OG_VALUES[i - 1]) /
    (exports.Constants.DRY_FG_OG_VALUES[i] - exports.Constants.DRY_FG_OG_VALUES[i - 1]);
  var fg = exports.Constants.DRY_FG_FG_VALUES[i - 1] * (1 - mu) + exports.Constants.DRY_FG_FG_VALUES[i] * mu + 0.0001;
  return Math.round(fg * 1000) / 1000;
};

// CalculateABV() - calculate estimated %ABV from an original and final gravity
//  - og - the original gravity
//  - fg - the final gravity (this is optional, if it is null, the method will generate an
//         estimated "dry" final gravity and use that)
// returns an object with the following fields:
//  - error - true/false, depending on whether there was an error in the calculation, if true, errorMessage will be set and other fields may not be
//            if false, errorMessage will not be set
//  - errorMessage - a descriptive error message in case there was an error
//  - errorArgument - the name of the argument that cause the error (if known)
//  - errorType - set to some known values like isNaN, range
//  - og - the og that was used for the calculation
//  - fg - the fg that was used for the calculation
//  - abv - the calculated %ABV (i.e. 11.5)
exports.CalculateABV = function (og, fg) {
  try {
    // validate og argument
    if (isNaN(og)) {
      return exports.MakeError('og ' + og + ' is not a number.', 'og', 0, exports.Constants.ErrorTypes.IS_NAN);
    }
    if (og < 0.99 || og > 1.4) {
      return exports.MakeError(
        'Original Gravity is out of range: ' + og.toFixed(3),
        'og',
        0,
        exports.Constants.ErrorTypes.RANGE
      );
    }

    // estimate "dry" fg if none was provided
    if (fg == null) {
      fg = exports.EstimateDryFG(og);
    } else {
      // validate fg
      if (isNaN(fg)) {
        return exports.MakeError('fg ' + fg + ' is not a number.', 'fg', 1, exports.Constants.ErrorTypes.IS_NAN);
      }
      if (fg < 0.99 || fg > 1.2) {
        return exports.MakeError(
          'Final Gravity is out of range: ' + fg.toFixed(3),
          'fg',
          1,
          exports.Constants.ErrorTypes.RANGE
        );
      }
    }

    if (og < fg) {
      return exports.MakeError(
        'Original Gravity cannot be less than Final Gravity: (' + og.toFixed(3) + ' < ' + fg.toFixed(3) + ')',
        null,
        null,
        exports.Constants.ErrorTypes.INVALID_ARGUMENTS
      );
    }

    var abv = exports.ConvertGravityDropToABV(og - fg + 1);

    return {
      error: false,
      og: og,
      fg: fg,
      abv: abv,
    };
  } catch (e) {
    return exports.MakeError(e.message, null, null, exports.Constants.ErrorTypes.UNKNOWN);
  }
};

// GetVolumeUnit(volume) - Get a numeric volume unit identifier from a string
exports.GetVolumeUnit = function (volume) {
  switch (volume) {
    case 'liters':
    case 'liter':
    case 'litres':
    case 'litre':
      return exports.Constants.VOLUME_UNITS.LITERS;
    case 'gallons_us':
    case 'gallon_us':
    case 'us_gallons':
    case 'us_gallon':
    case 'gallons':
    case 'gallon':
      return exports.Constants.VOLUME_UNITS.GALLONS_US;
    case 'gallons_imp':
    case 'gallon_imp':
    case 'imp_gallons':
    case 'imp_gallon':
    case 'gallons_imperial':
    case 'gallon_imperial':
    case 'imperial_gallons':
    case 'imperial_gallon':
      return exports.Constants.VOLUME_UNITS.GALLONS_IMP;
    case 'fl_ounces_us':
    case 'fl_ounce_us':
    case 'us_fl_ounces':
    case 'us_fl_ounce':
    case 'fl_oz_us':
    case 'us_fl_oz':
    case 'fluid_ounces_us':
    case 'us_fluid_ounces':
    case 'ounces':
    case 'oz':
      return exports.Constants.VOLUME_UNITS.FL_OUNCES_US;
    case 'fl_ounces_imp':
    case 'fl_ounce_imp':
    case 'imp_fl_ounces':
    case 'imp_fl_ounce':
    case 'fl_oz_imp':
    case 'imp_fl_oz':
    case 'fl_ounces_imperial':
    case 'fl_ounce_imperial':
    case 'imperial_fl_ounces':
    case 'imperial_fl_ounce':
      return exports.Constants.VOLUME_UNITS.FL_OUNCES_IMP;
    case 'pints_us':
    case 'pint_us':
    case 'us_pints':
    case 'us_pint':
    case 'pints':
    case 'pint':
      return exports.Constants.VOLUME_UNITS.PINTS_US;
    case 'pints_imp':
    case 'pint_imp':
    case 'imp_pints':
    case 'imp_pint':
    case 'pints_imperial':
    case 'pint_imperial':
    case 'imperial_pints':
    case 'imperial_pint':
      return exports.Constants.VOLUME_UNITS.PINTS_IMP;
    case 'quarts_us':
    case 'quart_us':
    case 'us_quarts':
    case 'us_quart':
    case 'quarts':
    case 'quart':
      return exports.Constants.VOLUME_UNITS.QUARTS_US;
    case 'quarts_imp':
    case 'quart_imp':
    case 'imp_quarts':
    case 'imp_quart':
    case 'quarts_imperial':
    case 'quart_imperial':
    case 'imperial_quarts':
    case 'imperial_quart':
      return exports.Constants.VOLUME_UNITS.QUARTS_IMP;
    case 'cups_us':
    case 'cup_us':
    case 'us_cups':
    case 'us_cup':
    case 'cups':
    case 'cup':
      return exports.Constants.VOLUME_UNITS.CUPS_US;
    case 'cups_imp':
    case 'cup_imp':
    case 'imp_cups':
    case 'imp_cup':
    case 'cups_imperial':
    case 'cup_imperial':
    case 'imperial_cups':
    case 'imperial_cup':
      return exports.Constants.VOLUME_UNITS.CUPS_IMP;
    case 'cups_metric':
    case 'cup_metric':
    case 'metric_cups':
    case 'metric_cup':
      return exports.Constants.VOLUME_UNITS.CUPS_METRIC;
    default:
      return null;
  }
};

// ConvertVolume(amount, fromUnit, toUnit) - convert a volume in fromUnit units to toUnit units (fromUnit and toUnit are strings)
// returns an object with the following fields:
//  - error - true/false, depending on whether there was an error in the calculation, if true, errorMessage will be set and other fields may not be
//            if false, errorMessage will not be set
//  - errorMessage - a descriptive error message in case there was an error
//  - errorArgument - the name of the argument that cause the error (if known)
//  - errorType - set to some known values like isNaN, range
//  - fromAmount - the amount being converted from
//  - fromUnit - the unit being converted from
//  - toAmount - the resulting amount after conversion
//  - toUnit - the unit being converted to
exports.ConvertVolume = function (amount, fromUnit, toUnit) {
  // validate amount argument
  if (isNaN(amount)) {
    return exports.MakeError(
      'amount ' + amount + ' is not a number.',
      'amount',
      0,
      exports.Constants.ErrorTypes.IS_NAN
    );
  }

  var from_unit = exports.GetVolumeUnit(fromUnit);
  if (from_unit == null) {
    // validate from_unit
    return exports.MakeError(
      'Unknown volume unit: ' + fromUnit,
      'fromUnit',
      1,
      exports.Constants.ErrorTypes.INVALID_ARGUMENTS
    );
  }

  var to_unit = exports.GetVolumeUnit(toUnit);
  if (to_unit == null) {
    // validate to_unit
    return exports.MakeError(
      'Unknown volume unit: ' + toUnit,
      'toUnit',
      2,
      exports.Constants.ErrorTypes.INVALID_ARGUMENTS
    );
  }

  from_unit = exports.Constants.VOLUME_UNIT_INFO[from_unit];
  to_unit = exports.Constants.VOLUME_UNIT_INFO[to_unit];

  var result = (amount / to_unit.conversion) * from_unit.conversion;

  return {
    error: false,
    fromAmount: amount,
    fromUnit: from_unit,
    toAmount: result,
    toUnit: to_unit,
  };
};

// GetHoneyUnit(unitString) - Get a numeric honey unit identifier from a string
exports.GetHoneyUnit = function (unitString) {
  switch (unitString) {
    case 'kilogram':
    case 'kilograms':
    case 'kilo':
    case 'kilos':
    case 'kg':
      return exports.Constants.HONEY_UNITS.KILOGRAMS;
    case 'pounds':
    case 'pound':
    case 'lbs':
    case 'lb':
      return exports.Constants.HONEY_UNITS.POUNDS;
    case 'liters':
    case 'liter':
    case 'litres':
    case 'litre':
    case 'l':
      return exports.Constants.HONEY_UNITS.LITERS;
    case 'gallons_us':
    case 'gallon_us':
    case 'us_gallons':
    case 'us_gallon':
    case 'gallons':
    case 'gallon':
    case 'gals':
    case 'gal':
      return exports.Constants.HONEY_UNITS.GALLONS_US;
    case 'gallons_imp':
    case 'gallon_imp':
    case 'gallons_imperial':
    case 'gallon_imperial':
    case 'imp_gallons':
    case 'imp_gallon':
    case 'imperial_gallons':
    case 'imperial_gallon':
      return exports.Constants.HONEY_UNITS.GALLONS_IMP;
    case 'ounces':
    case 'ounce':
    case 'oz':
      return exports.Constants.HONEY_UNITS.OUNCES;
    case 'cups_us':
    case 'cup_us':
    case 'us_cups':
    case 'us_cup':
    case 'cups':
    case 'cup':
    case 'c':
      return exports.Constants.HONEY_UNITS.CUPS_US;
    case 'cups_imp':
    case 'cup_imp':
    case 'cups_imperial':
    case 'cup_imperial':
    case 'imp_cups':
    case 'imp_cup':
    case 'imperial_cups':
    case 'imperial_cup':
      return exports.Constants.HONEY_UNITS.CUPS_IMP;
    case 'cups_metric':
    case 'cup_metric':
    case 'metric_cups':
    case 'metric_cup':
      return exports.Constants.HONEY_UNITS.CUPS_METRIC;
    case 'fl_ounces_us':
    case 'fl_ounce_us':
    case 'fl_oz_us':
    case 'us_fl_ounces':
    case 'us_fl_ounce':
    case 'us_fl_oz':
    case 'fl_ounces':
    case 'fl_ounce':
    case 'fl_oz':
    case 'fluid_ounces_us':
      return exports.Constants.HONEY_UNITS.FL_OUNCES_US;
    case 'fl_ounces_imp':
    case 'fl_ounce_imp':
    case 'fl_oz_imp':
    case 'imp_fl_ounces':
    case 'imp_fl_ounce':
    case 'imp_fl_oz':
    case 'imperial_fl_ounces':
    case 'imperial_fl_ounce':
    case 'imperial_fl_oz':
    case 'fluid_ounces_imp':
      return exports.Constants.HONEY_UNITS.FL_OUNCES_IMP;
    case 'pints_us':
    case 'pint_us':
    case 'us_pints':
    case 'us_pint':
    case 'pints':
    case 'pint':
      return exports.Constants.HONEY_UNITS.PINTS_US;
    case 'pints_imp':
    case 'pint_imp':
    case 'imp_pints':
    case 'imp_pint':
    case 'pints_imperial':
    case 'pint_imperial':
    case 'imperial_pints':
    case 'imperial_pint':
      return exports.Constants.HONEY_UNITS.PINTS_IMP;
    case 'quarts_us':
    case 'quart_us':
    case 'us_quarts':
    case 'us_quart':
    case 'quarts':
    case 'quart':
    case 'qt':
    case 'qt_us':
    case 'us_qt':
      return exports.Constants.HONEY_UNITS.QUARTS_US;
    case 'quarts_imp':
    case 'quart_imp':
    case 'imp_quarts':
    case 'imp_quart':
    case 'quarts_imperial':
    case 'quart_imperial':
    case 'imperial_quarts':
    case 'imperial_quart':
    case 'qt_imp':
    case 'qt_imperial':
      return exports.Constants.HONEY_UNITS.QUARTS_IMP;
    default:
      return null;
  }
};

// ConvertHoneyUnits(amount, fromUnit, toUnit) - convert an amount of honey in fromUnit units to toUnit units (fromUnit and toUnit are strings)
// returns an object with the following fields:
//  - error - true/false, depending on whether there was an error in the calculation, if true, errorMessage will be set and other fields may not be
//            if false, errorMessage will not be set
//  - errorMessage - a descriptive error message in case there was an error
//  - errorArgument - the name of the argument that cause the error (if known)
//  - errorType - set to some known values like isNaN, range
//  - fromAmount - the amount being converted from
//  - fromUnit - the unit being converted from
//  - toAmount - the resulting amount after conversion
//  - toUnit - the unit being converted to
exports.ConvertHoneyUnits = function (amount, fromUnit, toUnit) {
  // validate amount argument
  if (isNaN(amount)) {
    return exports.MakeError(
      'amount ' + amount + ' is not a number.',
      'amount',
      0,
      exports.Constants.ErrorTypes.IS_NAN
    );
  }

  var from_unit = exports.GetHoneyUnit(fromUnit);
  if (from_unit == null) {
    // validate from_unit
    return exports.MakeError(
      'Unknown honey unit: ' + fromUnit,
      'fromUnit',
      1,
      exports.Constants.ErrorTypes.INVALID_ARGUMENTS
    );
  }

  var to_unit = exports.GetHoneyUnit(toUnit);
  if (to_unit == null) {
    // validate to_unit
    return exports.MakeError(
      'Unknown honey unit: ' + toUnit,
      'toUnit',
      2,
      exports.Constants.ErrorTypes.INVALID_ARGUMENTS
    );
  }

  from_unit = exports.Constants.HONEY_UNIT_INFO[from_unit];
  to_unit = exports.Constants.HONEY_UNIT_INFO[to_unit];

  var result = (amount / to_unit.conversion) * from_unit.conversion;

  return {
    error: false,
    fromAmount: amount,
    fromUnit: from_unit,
    toAmount: result,
    toUnit: to_unit,
  };
};

// ConvertTemperature(fromTemperature, fromUnit) - convert a temperature from one unit to another (fromUnit is a string)
// returns an object with the following fields:
//  - error - true/false, depending on whether there was an error in the calculation, if true, errorMessage will be set and other fields may not be
//            if false, errorMessage will not be set
//  - errorMessage - a descriptive error message in case there was an error
//  - errorArgument - the name of the argument that cause the error (if known)
//  - errorType - set to some known values like isNaN, range
//  - fromTemperature - the temeprature being converted from
//  - fromUnit - the unit being converted from
//  - toTemperature - the resulting temperature after conversion
//  - toUnit - the unit being converted to
exports.ConvertTemperature = function (fromTemperature, fromUnit) {
  // validate fromTemperature argument
  if (isNaN(fromTemperature)) {
    return exports.MakeError(
      'fromTemperature ' + fromTemperature + ' is not a number.',
      'fromTemperature',
      0,
      exports.Constants.ErrorTypes.IS_NAN
    );
  }

  var from_unit = null;
  var to_unit = null;
  var to_temp;
  if (fromUnit == 'celcius' || fromUnit == 'c') {
    from_unit = exports.Constants.TEMPERATURE_UNITS.CELSIUS;
    to_unit = exports.Constants.TEMPERATURE_UNITS.FAHRENHEIT;
    to_temp = Math.round(((Number(fromTemperature) * 9) / 5 + 32) * 100) / 100;
  } else if (fromUnit == 'fahrenheit' || fromUnit == 'f') {
    from_unit = exports.Constants.TEMPERATURE_UNITS.FAHRENHEIT;
    to_unit = exports.Constants.TEMPERATURE_UNITS.CELSIUS;
    to_temp = Math.round((((Number(fromTemperature) - 32) * 5) / 9) * 100) / 100;
  }

  if (from_unit == null) {
    return exports.MakeError(
      'Unknown temperature unit: ' + fromUnit,
      'fromUnit',
      1,
      exports.Constants.ErrorTypes.INVALID_ARGUMENTS
    );
  }

  return {
    error: false,
    fromTemperature: fromTemperature,
    fromUnit: exports.Constants.TEMPERATURE_UNIT_NAMES[from_unit],
    toTemperature: to_temp,
    toUnit: exports.Constants.TEMPERATURE_UNIT_NAMES[to_unit],
  };
};

// ConvertSGToBrix(sg) - convert a specific gravity to BRIX
exports.ConvertSGToBrix = function (sg) {
  return 135.997 * Math.pow(Number(sg), 3) - 630.272 * Math.pow(Number(sg), 2) + 1111.14 * Number(sg) - 616.868;
};

// ComputeDelle(abv, sg) - compute an estimated Delle number from a provided %ABV and specific gravity
// returns an object with the following fields:
//  - error - true/false, depending on whether there was an error in the calculation, if true, errorMessage will be set and other fields may not be
//            if false, errorMessage will not be set
//  - errorMessage - a descriptive error message in case there was an error
//  - errorArgument - the name of the argument that cause the error (if known)
//  - errorType - set to some known values like isNaN, range
//  - abv - the %ABV used in the Delle calculation
//  - sg - the specific gravity used in the Delle calculation
//  - delle - the calculated Delle number
exports.ComputeDelle = function (abv, sg) {
  // validate abv argument
  if (isNaN(abv)) {
    return exports.MakeError('abv ' + abv + ' is not a number.', 'abv', 0, exports.Constants.ErrorTypes.IS_NAN);
  }
  abv = Math.round(abv * 10) / 10;

  // validate sg argument
  if (isNaN(sg)) {
    return exports.MakeError('sg ' + sg + ' is not a number.', 'sg', 1, exports.Constants.ErrorTypes.IS_NAN);
  }
  sg = Math.round(sg * 1000) / 1000;

  return {
    error: false,
    abv: abv,
    sg: sg,
    delle: 4.5 * abv + exports.ConvertSGToBrix(sg) * sg,
  };
};

// GetSugarSourceIdentifier(sugar) - return the sugar source identifier that corresponds to
//                             a provided string
exports.GetSugarSourceIdentifier = function (sugar) {
  switch (sugar) {
    case 'honey':
      return exports.Constants.SUGAR_SOURCES.HONEY;
    case 'sugar':
      return exports.Constants.SUGAR_SOURCES.SUGAR;
    case 'acerola':
      return exports.Constants.SUGAR_SOURCES.ACEROLA;
    case 'apples':
    case 'apple':
      return exports.Constants.SUGAR_SOURCES.APPLES;
    case 'apricots':
    case 'apricot':
      return exports.Constants.SUGAR_SOURCES.APRICOTS;
    case 'apricots_dried':
    case 'dried_apricots':
      return exports.Constants.SUGAR_SOURCES.APRICOTS_DRIED;
    case 'bananas':
    case 'banana':
      return exports.Constants.SUGAR_SOURCES.BANANAS;
    case 'blackberry':
      return exports.Constants.SUGAR_SOURCES.BLACKBERRY;
    case 'blueberry':
      return exports.Constants.SUGAR_SOURCES.BLUEBERRY;
    case 'boysenberry':
      return exports.Constants.SUGAR_SOURCES.BOYSENBERRY;
    case 'cantaloupe':
      return exports.Constants.SUGAR_SOURCES.CANTALOUPE;
    case 'carambola':
      return exports.Constants.SUGAR_SOURCES.CARAMBOLA;
    case 'carrots':
    case 'carrot':
      return exports.Constants.SUGAR_SOURCES.CARROTS;
    case 'casaba_melon':
      return exports.Constants.SUGAR_SOURCES.CASABA_MELON;
    case 'cashews':
    case 'cashew':
      return exports.Constants.SUGAR_SOURCES.CASHEWS;
    case 'celery':
      return exports.Constants.SUGAR_SOURCES.CELERY;
    case 'cherry_dark_sweet':
    case 'cherry_sweet':
    case 'dark_sweet_cherry':
    case 'sweet_cherry':
    case 'cherry_dark':
    case 'dark_cherry':
      return exports.Constants.SUGAR_SOURCES.CHERRY_DARK_SWEET;
    case 'cherry_montmorency':
    case 'montmorency_cherry':
    case 'cherry_tart':
    case 'tart_cherry':
      return exports.Constants.SUGAR_SOURCES.CHERRY_MONTMORENCY;
    case 'crabapples':
    case 'crabapple':
      return exports.Constants.SUGAR_SOURCES.CRABAPPLES;
    case 'cranberry':
      return exports.Constants.SUGAR_SOURCES.CRANBERRY;
    case 'currant_black':
    case 'black_currant':
      return exports.Constants.SUGAR_SOURCES.CURRANT_BLACK;
    case 'currant_red':
    case 'red_currant':
      return exports.Constants.SUGAR_SOURCES.CURRANT_RED;
    case 'dates':
    case 'date':
      return exports.Constants.SUGAR_SOURCES.DATES;
    case 'dates_dried':
    case 'dried_dates':
      return exports.Constants.SUGAR_SOURCES.DATES_DRIED;
    case 'dewberry':
      return exports.Constants.SUGAR_SOURCES.DEWBERRY;
    case 'elderberry':
      return exports.Constants.SUGAR_SOURCES.ELDERBERRY;
    case 'figs':
    case 'fig':
      return exports.Constants.SUGAR_SOURCES.FIGS;
    case 'figs_dried':
    case 'dried_figs':
      return exports.Constants.SUGAR_SOURCES.FIGS_DRIED;
    case 'gooseberry':
      return exports.Constants.SUGAR_SOURCES.GOOSEBERRY;
    case 'grape_concord':
    case 'concord_grape':
      return exports.Constants.SUGAR_SOURCES.GRAPE_CONCORD;
    case 'grapes':
    case 'grape':
      return exports.Constants.SUGAR_SOURCES.GRAPES;
    case 'grapefruit':
      return exports.Constants.SUGAR_SOURCES.GRAPEFRUIT;
    case 'guanabana':
      return exports.Constants.SUGAR_SOURCES.GUANABANA;
    case 'guavas':
    case 'guava':
      return exports.Constants.SUGAR_SOURCES.GUAVAS;
    case 'honeydew_melon':
      return exports.Constants.SUGAR_SOURCES.HONEYDEW_MELON;
    case 'jackfruit':
      return exports.Constants.SUGAR_SOURCES.JACKFRUIT;
    case 'kiwis':
    case 'kiwi':
      return exports.Constants.SUGAR_SOURCES.KIWIS;
    case 'lemon_juice':
      return exports.Constants.SUGAR_SOURCES.LEMON_JUICE;
    case 'lime_juice':
      return exports.Constants.SUGAR_SOURCES.LIME_JUICE;
    case 'lychee_litchi':
    case 'lychee':
    case 'litchi':
      return exports.Constants.SUGAR_SOURCES.LYCHEE_LITCHI;
    case 'loganberry':
      return exports.Constants.SUGAR_SOURCES.LOGANBERRY;
    case 'mangos':
    case 'mango':
      return exports.Constants.SUGAR_SOURCES.MANGOS;
    case 'maple_syrup':
      return exports.Constants.SUGAR_SOURCES.MAPLE_SYRUP;
    case 'maple_sap':
      return exports.Constants.SUGAR_SOURCES.MAPLE_SAP;
    case 'mulberry':
      return exports.Constants.SUGAR_SOURCES.MULBERRY;
    case 'nectarines':
      return exports.Constants.SUGAR_SOURCES.NECTARINES;
    case 'orange_juice':
      return exports.Constants.SUGAR_SOURCES.ORANGE_JUICE;
    case 'papaya':
      return exports.Constants.SUGAR_SOURCES.PAPAYA;
    case 'passionfruit':
      return exports.Constants.SUGAR_SOURCES.PASSIONFRUIT;
    case 'peaches':
    case 'peach':
      return exports.Constants.SUGAR_SOURCES.PEACHES;
    case 'pears':
    case 'pear':
      return exports.Constants.SUGAR_SOURCES.PEARS;
    case 'persimmon':
      return exports.Constants.SUGAR_SOURCES.PERSIMMON;
    case 'pineapples':
    case 'pineapple':
      return exports.Constants.SUGAR_SOURCES.PINEAPPLES;
    case 'plums':
    case 'plum':
      return exports.Constants.SUGAR_SOURCES.PLUMS;
    case 'pomegranates':
    case 'pomegranate':
      return exports.Constants.SUGAR_SOURCES.POMEGRANATES;
    case 'prickly_pear':
      return exports.Constants.SUGAR_SOURCES.PRICKLY_PEAR;
    case 'prunes_dried':
    case 'dried_prunes':
    case 'prunes':
      return exports.Constants.SUGAR_SOURCES.PRUNES_DRIED;
    case 'quinces':
    case 'quince':
      return exports.Constants.SUGAR_SOURCES.QUINCES;
    case 'raisins_dried':
    case 'dried_raisins':
    case 'raisins':
      return exports.Constants.SUGAR_SOURCES.RAISINS_DRIED;
    case 'raspberry_red':
    case 'red_raspberry':
      return exports.Constants.SUGAR_SOURCES.RASPBERRY_RED;
    case 'raspberry_black':
    case 'black_raspberry':
      return exports.Constants.SUGAR_SOURCES.RASPBERRY_BLACK;
    case 'rhubarb':
      return exports.Constants.SUGAR_SOURCES.RHUBARB;
    case 'strawberry':
      return exports.Constants.SUGAR_SOURCES.STRAWBERRY;
    case 'sultanas':
      return exports.Constants.SUGAR_SOURCES.SULTANAS;
    case 'tangerines':
    case 'tangerine':
      return exports.Constants.SUGAR_SOURCES.TANGERINES;
    case 'tangelo':
      return exports.Constants.SUGAR_SOURCES.TANGELO;
    case 'tomatoes':
    case 'tomato':
    case 'tomatos':
      return exports.Constants.SUGAR_SOURCES.TOMATOES;
    case 'watermelons':
    case 'watermelon':
      return exports.Constants.SUGAR_SOURCES.WATERMELONS;
    case 'youngberry':
      return exports.Constants.SUGAR_SOURCES.YOUNGBERRY;
    case 'dme':
    case 'dry_malt_extract':
      return exports.Constants.SUGAR_SOURCES.DME;
    case 'lme':
    case 'liquid_malt_extract':
      return exports.Constants.SUGAR_SOURCES.LME;
    case 'apple_juice':
    case 'aj':
      return exports.Constants.SUGAR_SOURCES.APPLE_JUICE;
    case 'cranberry_juice':
    case 'cran_juice':
      return exports.Constants.SUGAR_SOURCES.CRANBERRY_JUICE;
    default:
      return null;
  }
};

// MakeHoursString(timing, break3) - Make a human-readable string from SNA timing information and 1/3 sugar break SG
exports.MakeHoursString = function (timing, break3) {
  if (timing == 'pitch') {
    return 'At Pitch';
  } else if (timing == 'break') {
    return '1/3 Sugar Break (' + break3.toFixed(3) + ' - no later than 7 days)';
  } else if (timing.toString().includes(',')) {
    var t = timing.split(',');
    return t[0] + ' Hours after ' + (t[1] == 0 ? 'pitch' : 'honey addition #' + t[1]);
  } else {
    return timing + ' Hours';
  }
};
