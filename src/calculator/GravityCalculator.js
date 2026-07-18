// Gravity/volume/temperature unit conversions used by the mead-brewing calculators.
const CalculatorAPI = require('./CalculatorAPI.js');
const Constants = CalculatorAPI.Constants;

function BrixToSG(brix) {
  return 1.00001 + Number(brix) / (258.6 - 0.89 * Number(brix));
}

function BaumeToSG(baume) {
  return 145 / (145 - baume);
}

function ABVToSG(abv) {
  return BaumeToSG(abv);
}

function SGToBaume(sg) {
  return 145 - 145 / Number(sg);
}

function SGToABV(sg) {
  return SGToBaume(sg);
}

function ABVToABW(abv) {
  return abv * 0.794;
}

function ABWToABV(abw) {
  return abw / 0.794;
}

function SGToABW(sg) {
  return ABVToABW(SGToBaume(sg));
}

function ABWToSG(abw) {
  return ABVToSG(ABWToABV(abw));
}

// convert a gravity value expressed in the given units to plain SG
function convToSG(value, units) {
  switch (units) {
    case Constants.GRAVITY_UNITS.BRIX:
      return BrixToSG(value);
    case Constants.GRAVITY_UNITS.BAUME:
      return BaumeToSG(value);
    default:
      return Number(value);
  }
}

// alias kept for readability at call sites that already have an SG value
const toSG = convToSG;

// convert an SG value to the given gravity units
function doConvertSG(fromUnits, toUnits, gravity) {
  const sg = toSG(gravity, fromUnits);

  if (toUnits === Constants.GRAVITY_UNITS.BRIX) {
    return CalculatorAPI.ConvertSGToBrix(sg);
  }
  if (toUnits === Constants.GRAVITY_UNITS.BAUME) {
    return SGToBaume(sg);
  }
  return sg;
}

// convert a volume value in the given units to liters
function toVol(units, volume) {
  return Number(volume) * Number(Constants.VOLUME_UNIT_INFO[units].conversion);
}

function getTempCoeff(temp, units) {
  let celsius = Number(temp);
  if (units === Constants.TEMPERATURE_UNITS.FAHRENHEIT) {
    celsius = (5 * (celsius - 32)) / 9;
  }
  return (
    -0.00469615 + 0.000377273 * celsius - 0.0000117144 * Math.pow(celsius, 2) + 0.000000229558 * Math.pow(celsius, 3)
  );
}

// sugar concentration (g/L) corresponding to a given SG
function SGToSugarConc(sg) {
  return Number(4 + 10 * sg * CalculatorAPI.ConvertSGToBrix(sg));
}

// SG corresponding to a given sugar concentration (g/L), via numeric search
function sugarConcToSG(gPerL) {
  let sg = 0.992;
  const loopLimit = 100000;

  for (let i = 0; i < loopLimit; i++) {
    const gpl = SGToSugarConc(sg);
    if (Math.round(gpl) === Math.round(gPerL)) {
      return sg < 1 ? 1.0 : sg;
    }
    const diff = Math.pow(10, -1 * (2 + String(Math.round(gpl)).length)) / 3;
    sg = sg * (1 + diff);
  }
  return NaN;
}

// total sugar (g) contributed by an additional-sugar entry
// { quantity_amount, quantity_units, sugar_content } (quantity in HONEY_UNITS, sugar_content as a percent)
function getSugars(sugar) {
  return (
    (sugar.quantity_amount * Constants.HONEY_UNIT_INFO[sugar.quantity_units].conversion * sugar.sugar_content) / 100
  );
}

function volumeUnitsToHoneyUnits(unit) {
  switch (unit) {
    case Constants.VOLUME_UNITS.LITERS:
      return Constants.HONEY_UNITS.LITERS;
    case Constants.VOLUME_UNITS.GALLONS_US:
      return Constants.HONEY_UNITS.GALLONS_US;
    case Constants.VOLUME_UNITS.GALLONS_IMP:
      return Constants.HONEY_UNITS.GALLONS_IMP;
    case Constants.VOLUME_UNITS.CUPS_US:
      return Constants.HONEY_UNITS.CUPS_US;
    case Constants.VOLUME_UNITS.CUPS_IMP:
      return Constants.HONEY_UNITS.CUPS_IMP;
    case Constants.VOLUME_UNITS.CUPS_METRIC:
      return Constants.HONEY_UNITS.CUPS_METRIC;
    case Constants.VOLUME_UNITS.FL_OUNCES_US:
      return Constants.HONEY_UNITS.FL_OUNCES_US;
    case Constants.VOLUME_UNITS.FL_OUNCES_IMP:
      return Constants.HONEY_UNITS.FL_OUNCES_IMP;
    case Constants.VOLUME_UNITS.PINTS_US:
      return Constants.HONEY_UNITS.PINTS_US;
    case Constants.VOLUME_UNITS.PINTS_IMP:
      return Constants.HONEY_UNITS.PINTS_IMP;
    case Constants.VOLUME_UNITS.QUARTS_US:
      return Constants.HONEY_UNITS.QUARTS_US;
    case Constants.VOLUME_UNITS.QUARTS_IMP:
      return Constants.HONEY_UNITS.QUARTS_IMP;
    default:
      return null;
  }
}

// functions adapted from Storm's mead-nutrient-calculation spreadsheet
function stormABVtoSG(abv) {
  let sgDelta = 1.0;
  while (CalculatorAPI.ConvertGravityDropToABV(sgDelta) < abv) {
    sgDelta += 0.001;
  }
  return sgDelta;
}

function stormSGtoYAN(sgDelta, yanRequirement) {
  return (
    (143.254 * Math.pow(sgDelta, 3) - 648.67 * Math.pow(sgDelta, 2) + 1125.805 * sgDelta - 620.389) *
    10 *
    sgDelta *
    Constants.NUTRIENT_FACTOR[yanRequirement]
  );
}

module.exports = {
  BrixToSG,
  BaumeToSG,
  ABVToSG,
  SGToBaume,
  SGToABV,
  ABVToABW,
  ABWToABV,
  SGToABW,
  ABWToSG,
  convToSG,
  toSG,
  doConvertSG,
  toVol,
  getTempCoeff,
  SGToSugarConc,
  sugarConcToSG,
  getSugars,
  volumeUnitsToHoneyUnits,
  stormABVtoSG,
  stormSGtoYAN,
};
