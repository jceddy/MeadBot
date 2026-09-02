const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Priming = require('../src/calculator/PrimingCalculator.js');
const CalculatorAPI = require('../src/calculator/CalculatorAPI.js');
const Constants = CalculatorAPI.Constants;

describe('getResidualCO2', () => {
  it('returns a higher residual CO2 for colder temperatures', () => {
    const cold = Priming.getResidualCO2(39, Constants.TEMPERATURE_UNITS.FAHRENHEIT);
    const warm = Priming.getResidualCO2(70, Constants.TEMPERATURE_UNITS.FAHRENHEIT);
    assert.ok(cold > warm);
  });

  it('matches commonly-published reference values in Fahrenheit', () => {
    // widely-cited priming/carbonation tables put these at ~1.7 vol at 32F and ~0.85 vol at 68F
    assert.ok(Math.abs(Priming.getResidualCO2(32, Constants.TEMPERATURE_UNITS.FAHRENHEIT) - 1.71) < 0.02);
    assert.ok(Math.abs(Priming.getResidualCO2(68, Constants.TEMPERATURE_UNITS.FAHRENHEIT) - 0.86) < 0.02);
  });

  it('gives the same result for equivalent Celsius and Fahrenheit inputs', () => {
    const f = Priming.getResidualCO2(68, Constants.TEMPERATURE_UNITS.FAHRENHEIT);
    const c = Priming.getResidualCO2(20, Constants.TEMPERATURE_UNITS.CELSIUS);
    assert.ok(Math.abs(f - c) < 0.01);
  });
});

describe('calculatePrimingSugar', () => {
  it('computes grams of corn sugar for a typical 5-gallon batch', () => {
    // 5 US gallons = ~18.93 L, fermented at 68F, targeting 2.5 volumes CO2
    const result = Priming.calculatePrimingSugar(
      18.93,
      68,
      Constants.TEMPERATURE_UNITS.FAHRENHEIT,
      2.5,
      Priming.SUGAR_TYPES.CORN_SUGAR
    );
    assert.ok(result.residualCO2 > 0.8 && result.residualCO2 < 0.9);
    // ~2.5 - 0.86 = 1.64 volumes to add; 1.64 * 18.93 L * 4 g/L/vol =~ 124g
    assert.ok(Math.abs(result.grams - 124) < 3, `expected ~124g, got ${result.grams}`);
  });

  it('needs less table sugar than corn sugar for the same CO2 target', () => {
    const args = [18.93, 68, Constants.TEMPERATURE_UNITS.FAHRENHEIT, 2.5];
    const corn = Priming.calculatePrimingSugar(...args, Priming.SUGAR_TYPES.CORN_SUGAR);
    const table = Priming.calculatePrimingSugar(...args, Priming.SUGAR_TYPES.TABLE_SUGAR);
    assert.ok(table.grams < corn.grams);
    assert.ok(table.grams / corn.grams > 0.85 && table.grams / corn.grams < 0.87);
  });

  it('never returns negative sugar when the target is below residual CO2', () => {
    // a batch cold-crashed to near-freezing already holds a lot of CO2
    const result = Priming.calculatePrimingSugar(
      18.93,
      34,
      Constants.TEMPERATURE_UNITS.FAHRENHEIT,
      1.0,
      Priming.SUGAR_TYPES.CORN_SUGAR
    );
    assert.equal(result.grams, 0);
  });

  it('scales linearly with batch volume', () => {
    const args = [68, Constants.TEMPERATURE_UNITS.FAHRENHEIT, 2.5, Priming.SUGAR_TYPES.CORN_SUGAR];
    const small = Priming.calculatePrimingSugar(10, ...args);
    const large = Priming.calculatePrimingSugar(20, ...args);
    assert.equal(Math.round(large.grams), Math.round(small.grams * 2));
  });
});
