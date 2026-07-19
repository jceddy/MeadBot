const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calculateBlend, displayNumber, displayNrTrim } = require('../src/calculator/BlendCalculator.js');
const Constants = require('../src/calculator/CalculatorAPI.js').Constants;
const F = Constants.BLEND_FIELDS;

describe('calculateBlend', () => {
  it('solves volume2 from value1, value2, blendedValue, volume1', () => {
    const result = calculateBlend(F.VOLUME2, { value1: 11, value2: 15, blendedValue: 12, volume1: 3 });
    assert.equal(result.error, false);
    assert.equal(result.volume2, 1);
    assert.equal(result.totalVolume, 4);
  });

  it('solves volume1 and volume2 from value1, value2, blendedValue, totalVolume', () => {
    const result = calculateBlend(F.VOLUME1, { value1: 11, value2: 15, blendedValue: 12, totalVolume: 6 });
    assert.equal(result.error, false);
    assert.equal(result.volume1, 4.5);
    assert.equal(result.volume2, 1.5);
  });

  it('solves blendedValue from value1, value2, volume1, volume2', () => {
    const result = calculateBlend(F.BLENDED_VALUE, { value1: 11, value2: 15, volume1: 3, volume2: 3 });
    assert.equal(result.error, false);
    assert.equal(result.blendedValue, 13);
    assert.equal(result.totalVolume, 6);
  });

  it('solves value1 from value2, blendedValue, volume1, volume2', () => {
    const result = calculateBlend(F.VALUE1, { value2: 15, blendedValue: 12, volume1: 3, volume2: 3 });
    assert.equal(result.error, false);
    assert.equal(result.value1, 9);
  });

  it('solves value2 from value1, blendedValue, volume1, volume2', () => {
    const result = calculateBlend(F.VALUE2, { value1: 11, blendedValue: 12, volume1: 3, volume2: 3 });
    assert.equal(result.error, false);
    assert.equal(result.value2, 13);
  });

  it('solves totalVolume from value1, value2, blendedValue, volume1', () => {
    const result = calculateBlend(F.TOTAL_VOLUME, { value1: 11, value2: 15, blendedValue: 12, volume1: 3 });
    assert.equal(result.error, false);
    assert.equal(result.volume2, 1);
    assert.equal(result.totalVolume, 4);
  });

  it('errors with a descriptive message when required fields are missing', () => {
    const result = calculateBlend(F.VOLUME2, { value1: 11, blendedValue: 12, volume1: 3 });
    assert.equal(result.error, true);
    assert.equal(result.errorMessage, 'Please specify Volume #1 or total volume.');
  });
});

describe('displayNumber', () => {
  it('rounds to the given number of significant figures', () => {
    assert.equal(displayNumber(1.23456, 3), 1.235);
  });
});

describe('displayNrTrim', () => {
  it('matches displayNumber for values with a small fractional part', () => {
    assert.equal(displayNrTrim(1.23456, 3), 1.235);
  });
});
