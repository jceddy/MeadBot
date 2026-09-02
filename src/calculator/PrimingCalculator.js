// Priming-sugar math for bottle-conditioning a batch (e.g. a lightly sparkling or sparkling
// mead). Independent of Discord.js.
const CalculatorAPI = require('./CalculatorAPI.js');
const Constants = CalculatorAPI.Constants;

// Grams of pure dextrose needed per liter of beverage to add one volume of CO2. This constant
// (and the residual-CO2 polynomial below) are the standard formulas used by essentially every
// homebrew priming-sugar calculator (see e.g. Ray Daniels, "Designing Great Beers").
const DEXTROSE_G_PER_LITER_PER_CO2_VOLUME = 4;

const SUGAR_TYPES = { CORN_SUGAR: 0, TABLE_SUGAR: 1 };
const SUGAR_TYPE_NAMES = ['Corn Sugar (Dextrose)', 'Table Sugar (Sucrose)'];

// grams of this sugar needed per gram of corn sugar (dextrose monohydrate) for equivalent CO2
// production. Table sugar (sucrose, anhydrous) inverts into one glucose + one fructose per
// molecule on fermentation, and carries no water of crystallization the way dextrose
// monohydrate does, so a given weight of it yields more fermentable sugar: 342 g sucrose ferments
// to the same CO2 as 396 g dextrose monohydrate (342/396 = 0.8636).
const SUGAR_TYPE_FACTOR = [1.0, 342 / 396];

// getResidualCO2(temp, units) - volumes of CO2 already dissolved in the beverage, given the
// highest temperature it reached after fermentation finished (higher temperature holds less
// dissolved CO2, so more priming sugar is needed to reach a given target). The underlying
// polynomial is defined in Fahrenheit; a Celsius input is converted first.
function getResidualCO2(temp, units) {
  let fahrenheit = Number(temp);
  if (units === Constants.TEMPERATURE_UNITS.CELSIUS) {
    fahrenheit = (fahrenheit * 9) / 5 + 32;
  }
  return 3.0378 - 0.050062 * fahrenheit + 0.00026555 * Math.pow(fahrenheit, 2);
}

// calculatePrimingSugar(volumeLiters, temp, units, targetCO2, sugarType) - grams of the given
// sugar type needed to carbonate volumeLiters of beverage (currently holding residual CO2, per
// its highest post-fermentation temperature) up to targetCO2 volumes of dissolved CO2
function calculatePrimingSugar(volumeLiters, temp, units, targetCO2, sugarType) {
  const residualCO2 = getResidualCO2(temp, units);
  const co2ToAdd = targetCO2 - residualCO2;
  const gramsCornSugar = Math.max(0, co2ToAdd) * volumeLiters * DEXTROSE_G_PER_LITER_PER_CO2_VOLUME;
  const grams = gramsCornSugar * SUGAR_TYPE_FACTOR[sugarType];

  return {
    residualCO2,
    co2ToAdd,
    grams,
    sugarType,
    sugarTypeName: SUGAR_TYPE_NAMES[sugarType],
  };
}

module.exports = {
  SUGAR_TYPES,
  SUGAR_TYPE_NAMES,
  DEXTROSE_G_PER_LITER_PER_CO2_VOLUME,
  getResidualCO2,
  calculatePrimingSugar,
};
