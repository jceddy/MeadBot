const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Gravity = require('../src/calculator/GravityCalculator.js');
const CalculatorAPI = require('../src/calculator/CalculatorAPI.js');
const Constants = CalculatorAPI.Constants;

describe('resolveGravityAbvTrio', () => {
  it('solves fg when og and abv are both specified (SG units)', () => {
    const result = Gravity.resolveGravityAbvTrio(
      Constants.GRAVITY_UNITS.SG,
      Constants.ABV_UNITS.ABV,
      1.1,
      0.998,
      14.0,
      true,
      true
    );
    assert.equal(result.og, 1.1);
    assert.equal(result.abv, 14.0);
    assert.equal(Math.round(result.fg * 1000) / 1000, 0.993);
  });

  it('solves abv from og and fg when only og is specified', () => {
    const result = Gravity.resolveGravityAbvTrio(
      Constants.GRAVITY_UNITS.SG,
      Constants.ABV_UNITS.ABV,
      1.1,
      0.998,
      14.37,
      true,
      false
    );
    assert.equal(result.og, 1.1);
    assert.equal(result.fg, 0.998);
    assert.equal(Math.round(result.abv * 1000) / 1000, 13.428);
  });

  it('solves og from fg and abv when og is not specified', () => {
    const result = Gravity.resolveGravityAbvTrio(
      Constants.GRAVITY_UNITS.SG,
      Constants.ABV_UNITS.ABV,
      1.108,
      1.01,
      14.37,
      false,
      true
    );
    assert.equal(result.fg, 1.01);
    assert.equal(result.abv, 14.37);
    assert.equal(Math.round(result.og * 1000) / 1000, 1.12);
  });

  it('converts abv to abw for the solve-abv branch when abvUnits is ABW', () => {
    const abvResult = Gravity.resolveGravityAbvTrio(
      Constants.GRAVITY_UNITS.SG,
      Constants.ABV_UNITS.ABV,
      1.1,
      0.998,
      14.37,
      true,
      false
    );
    const abwResult = Gravity.resolveGravityAbvTrio(
      Constants.GRAVITY_UNITS.SG,
      Constants.ABV_UNITS.ABW,
      1.1,
      0.998,
      14.37,
      true,
      false
    );
    assert.equal(
      Math.round(abwResult.abv * 1000) / 1000,
      Math.round(abvResult.abv * Gravity.ABVToABW(1) * 1000) / 1000
    );
  });

  it('is consistent with !potential-alcohol default values when nothing is specified', () => {
    // matches the command's own defaults: og=1.108, fg=0.998, abv=14.37 (SG/ABV), with
    // ogSpecified=false triggering a re-derivation of og from the (default) fg and abv
    const result = Gravity.resolveGravityAbvTrio(
      Constants.GRAVITY_UNITS.SG,
      Constants.ABV_UNITS.ABV,
      1.108,
      0.998,
      14.37,
      false,
      false
    );
    assert.equal(Math.round(result.og * 1000) / 1000, 1.108);
  });

  it('converts a BRIX og to SG before solving fg from og and abv (regression)', () => {
    // previously produced a nonsensical fg (~1734301.697) because the raw BRIX og was used
    // directly in the SG-space delta computation instead of being converted first
    const result = Gravity.resolveGravityAbvTrio(
      Constants.GRAVITY_UNITS.BRIX,
      Constants.ABV_UNITS.ABV,
      25,
      -0.521,
      14.0,
      true,
      true
    );
    assert.ok(Math.abs(result.fg) < 100, `expected a plausible BRIX value, got ${result.fg}`);
    assert.equal(Math.round(result.fg * 1000) / 1000, -0.284);
  });

  it('converts a BAUME fg to SG before solving og from fg and abv (regression)', () => {
    const result = Gravity.resolveGravityAbvTrio(
      Constants.GRAVITY_UNITS.BAUME,
      Constants.ABV_UNITS.ABV,
      13,
      5,
      14.37,
      false,
      true
    );
    assert.ok(Math.abs(result.og) < 100, `expected a plausible BAUME value, got ${result.og}`);
  });
});
