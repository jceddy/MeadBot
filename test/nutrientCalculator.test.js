const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Nutrient = require('../src/calculator/NutrientCalculator.js');
const Constants = require('../src/calculator/CalculatorAPI.js').Constants;

describe('yanContributionFromGrams', () => {
  it('returns 0 when no grams were added', () => {
    assert.equal(Nutrient.yanContributionFromGrams(0, 77, 18.92), 0);
  });

  it('computes floor(grams * yanPpm / volumeInLiters)', () => {
    assert.equal(Nutrient.yanContributionFromGrams(6.25, 77, 18.92), 25);
  });
});

describe('calculateNutrients', () => {
  const baseOptions = {
    units: Constants.UNITS.US,
    volume: 5,
    yan: 175,
    fermOEffectiveness: 2.6,
    enforceLimits: true,
    dapLimit: 0.96,
    fermKLimit: 0.5,
    fermOLimit: 0.45,
    yanRatioDap: 35,
    yanRatioFermK: 25,
    yanRatioFermO: 40,
    fermKYan: 134,
    fillFkFirst: true,
    gofermYan: 77,
    gofermGrams: 0,
  };

  it('matches !calculate-nutrients default output (no goferm grams)', () => {
    const result = Nutrient.calculateNutrients(baseOptions);
    assert.equal(result.gofermYanContribution, 0);
    assert.equal(result.yan, 175);
    assert.equal(result.dapG, 5.52);
    assert.equal(result.fkG, 9.46);
    assert.equal(result.foG, 8.52);
  });

  it('subtracts the Go-Ferm YAN contribution from yan before computing the schedule', () => {
    const result = Nutrient.calculateNutrients({ ...baseOptions, gofermGrams: 6.25 });
    assert.equal(result.gofermYanContribution, 25);
    assert.equal(result.yan, 150);
    assert.equal(result.dapG, 3.26);
  });

  it('uses a fixed [24, 48, 72, break] SNA schedule', () => {
    const result = Nutrient.calculateNutrients(baseOptions);
    const timings = result.sna.additions.map((a) => a.timing);
    assert.deepEqual(timings, [24, 48, 72, 'break']);
  });

  it('handles METRIC units (volume already in liters)', () => {
    const result = Nutrient.calculateNutrients({
      ...baseOptions,
      units: Constants.UNITS.METRIC,
      volume: 19,
      gofermGrams: 6.25,
    });
    assert.equal(result.gofermYanContribution, 25);
  });
});
