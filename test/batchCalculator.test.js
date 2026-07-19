const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Batch = require('../src/calculator/BatchCalculator.js');
const Constants = require('../src/calculator/CalculatorAPI.js').Constants;

describe('pickSnaSchedule', () => {
  it('returns a single pitch addition for kveik regardless of og/hot', () => {
    assert.deepEqual(Batch.pickSnaSchedule(Constants.YAN_REQUIREMENT.KVEIK, false, 1.2), ['pitch']);
    assert.deepEqual(Batch.pickSnaSchedule(Constants.YAN_REQUIREMENT.KVEIK, true, 1.2), ['pitch']);
  });

  it('uses a shorter schedule when fermenting hot', () => {
    assert.deepEqual(Batch.pickSnaSchedule(Constants.YAN_REQUIREMENT.MEDIUM, true, 1.11), [24, 'break']);
    assert.deepEqual(Batch.pickSnaSchedule(Constants.YAN_REQUIREMENT.MEDIUM, true, 1.09), [24]);
    assert.deepEqual(Batch.pickSnaSchedule(Constants.YAN_REQUIREMENT.MEDIUM, true, 1.05), ['pitch']);
  });

  it('scales the default schedule with og', () => {
    assert.deepEqual(Batch.pickSnaSchedule(Constants.YAN_REQUIREMENT.MEDIUM, false, 1.13), [24, 48, 72, 'break']);
    assert.deepEqual(Batch.pickSnaSchedule(Constants.YAN_REQUIREMENT.MEDIUM, false, 1.11), [24, 48, 'break']);
    assert.deepEqual(Batch.pickSnaSchedule(Constants.YAN_REQUIREMENT.MEDIUM, false, 1.09), [24, 'break']);
    assert.deepEqual(Batch.pickSnaSchedule(Constants.YAN_REQUIREMENT.MEDIUM, false, 1.07), [24]);
    assert.deepEqual(Batch.pickSnaSchedule(Constants.YAN_REQUIREMENT.MEDIUM, false, 1.05), ['pitch']);
  });
});

describe('buildBatch', () => {
  const baseOptions = {
    units: Constants.UNITS.US,
    volume: 5,
    yeastAbv: 18,
    residualSugar: 1.02,
    yanRequirement: Constants.YAN_REQUIREMENT.MEDIUM,
    nutrientRegimen: Constants.NUTRIENT_REGIMEN.BLOUNT_ELLIOTT,
    ogOverride: 0,
    pitchRateOverride: 0,
    fruitSg: 0,
    yanOverride: 0,
    fermOEffectiveness: 2.6,
    enforceLimits: true,
    dapLimit: 0.96,
    fermKLimit: 0.5,
    fermOLimit: 0.45,
    yanRatioDap: 35,
    yanRatioFermK: 25,
    yanRatioFermO: 40,
    fermKYan: 134,
    gofermYan: 77,
    fillFkFirst: true,
    hot: false,
    snaScheduleOverride: null,
  };

  it('matches !build-batch default output (BLOUNT_ELLIOTT regimen)', () => {
    const result = Batch.buildBatch(baseOptions);
    assert.equal(result.error, false);
    assert.equal(result.og, 1.162);
    assert.equal(result.fg, 1.02);
    assert.equal(result.abv, 18);
    assert.equal(result.gofermYanContribution, 76);
    assert.equal(result.honey.weight + result.honey.unit, '23.1lbs');
    assert.equal(result.goferm.numPackets, 3);
    assert.equal(result.nut.additions.length, 4);
  });

  it('clamps fg to 1 and recomputes abv when ogOverride would drive fg below 1', () => {
    const result = Batch.buildBatch({ ...baseOptions, yeastAbv: 20, ogOverride: 1.05 });
    assert.equal(result.error, false);
    assert.equal(result.og, 1.05);
    assert.equal(result.fg, 1);
    assert.ok(result.abv < 20, 'abv should have been recomputed down from the 20% input');
  });

  it('errors when fruitSg exceeds og', () => {
    const result = Batch.buildBatch({ ...baseOptions, fruitSg: 1.2 });
    assert.equal(result.error, true);
    assert.match(result.errorMessage, /Fruit SG can't be higher than OG/);
  });

  it('subtracts fruit YAN contribution when fruitSg is below og', () => {
    const result = Batch.buildBatch({ ...baseOptions, fruitSg: 1.01 });
    assert.equal(result.error, false);
    assert.ok(result.fruitPercent > 0);
    assert.ok(result.fruitYanContribution > 0);
  });

  it('uses a fixed pitch-rate calculation when pitchRateOverride is set', () => {
    const result = Batch.buildBatch({ ...baseOptions, pitchRateOverride: 4 });
    assert.equal(result.error, false);
    assert.equal(result.goferm.minGrams, 4 * baseOptions.volume);
  });

  it('populates advancedNutrients only for the ADVANCED regimen', () => {
    const advanced = Batch.buildBatch({
      ...baseOptions,
      nutrientRegimen: Constants.NUTRIENT_REGIMEN.ADVANCED,
    });
    assert.equal(advanced.error, false);
    assert.ok(advanced.advancedNutrients !== null);

    const tosna = Batch.buildBatch({ ...baseOptions, nutrientRegimen: Constants.NUTRIENT_REGIMEN.TOSNA });
    assert.equal(tosna.advancedNutrients, null);
  });

  it('overrides target YAN for the ADVANCED regimen when yanOverride is set', () => {
    const result = Batch.buildBatch({
      ...baseOptions,
      nutrientRegimen: Constants.NUTRIENT_REGIMEN.ADVANCED,
      yanOverride: 250,
    });
    assert.equal(result.error, false);
    assert.equal(result.nut.nitrogen + result.gofermYanContribution, 250);
  });

  it('handles METRIC units', () => {
    const result = Batch.buildBatch({ ...baseOptions, units: Constants.UNITS.METRIC, volume: 18.9 });
    assert.equal(result.error, false);
    assert.equal(result.honey.unit, 'kg');
  });

  it('respects an explicit SNA schedule override', () => {
    const result = Batch.buildBatch({ ...baseOptions, snaScheduleOverride: ['pitch', 24, 48, 'break'] });
    assert.equal(result.error, false);
    assert.equal(result.nut.additions.length, 4);
    assert.equal(result.nut.additions[0].timing, 'pitch');
  });
});
