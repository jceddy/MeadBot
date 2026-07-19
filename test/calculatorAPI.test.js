const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const CalculatorAPI = require('../src/calculator/CalculatorAPI.js');

describe('GetDaysBetween', () => {
  it('computes the absolute number of days between two dates', () => {
    const days = CalculatorAPI.GetDaysBetween(new Date('2024-01-01'), new Date('2024-01-11'));
    assert.equal(days, 10);
  });

  it('is order-independent', () => {
    const forward = CalculatorAPI.GetDaysBetween(new Date('2024-01-01'), new Date('2024-01-11'));
    const backward = CalculatorAPI.GetDaysBetween(new Date('2024-01-11'), new Date('2024-01-01'));
    assert.equal(forward, backward);
  });
});

describe('GetMonthsBetween', () => {
  it('computes whole months between two dates', () => {
    assert.equal(CalculatorAPI.GetMonthsBetween(new Date('2024-01-01'), new Date('2024-04-01')), 3);
  });

  it('returns a negative value when date1 is after date2', () => {
    assert.equal(CalculatorAPI.GetMonthsBetween(new Date('2024-04-01'), new Date('2024-01-01')), -3);
  });

  it('rounds down a fractional month when roundUpFractionalMonths is not set', () => {
    assert.equal(CalculatorAPI.GetMonthsBetween(new Date('2024-01-01'), new Date('2024-04-15')), 3);
  });

  it('rounds up a fractional month when roundUpFractionalMonths is true', () => {
    assert.equal(CalculatorAPI.GetMonthsBetween(new Date('2024-01-01'), new Date('2024-04-15'), true), 4);
  });
});

describe('CalculateCalories', () => {
  it('calculates calories for a valid mead', () => {
    const result = CalculatorAPI.CalculateCalories(12, 1.0, 750, 150);
    assert.equal(result.error, false);
    assert.ok(result.totalCaloriesBottle > 0);
    assert.ok(result.totalCaloriesServing > 0);
  });

  it('errors when percentAlcohol is not a number', () => {
    const result = CalculatorAPI.CalculateCalories('abc', 1.0, 750, 150);
    assert.equal(result.error, true);
    assert.equal(result.errorType, CalculatorAPI.Constants.ErrorTypes.IS_NAN);
    assert.equal(result.errorArgument, 'percentAlcohol');
  });

  it('errors when fg is out of range', () => {
    const result = CalculatorAPI.CalculateCalories(12, 2.0, 750, 150);
    assert.equal(result.error, true);
    assert.equal(result.errorType, CalculatorAPI.Constants.ErrorTypes.RANGE);
    assert.equal(result.errorArgument, 'fg');
  });
});

describe('EstimateDryFG', () => {
  it('returns the original gravity unchanged when already at or below 1.000', () => {
    assert.equal(CalculatorAPI.EstimateDryFG(1.0), 1.0);
  });

  it('interpolates between known OG/FG data points', () => {
    const fg = CalculatorAPI.EstimateDryFG(1.07);
    assert.ok(fg > 0.995 && fg < 1.0);
  });
});

describe('CalculateABV', () => {
  it('calculates ABV from OG and FG', () => {
    const result = CalculatorAPI.CalculateABV(1.09, 1.01);
    assert.equal(result.error, false);
    assert.ok(result.abv > 10 && result.abv < 11.5);
  });

  it('estimates a dry FG when fg is not provided', () => {
    const result = CalculatorAPI.CalculateABV(1.09, null);
    assert.equal(result.error, false);
    assert.ok(result.fg < 1.09);
  });

  it('errors when og is less than fg', () => {
    const result = CalculatorAPI.CalculateABV(1.0, 1.05);
    assert.equal(result.error, true);
    assert.equal(result.errorType, CalculatorAPI.Constants.ErrorTypes.INVALID_ARGUMENTS);
  });

  it('errors when og is out of range', () => {
    const result = CalculatorAPI.CalculateABV(2.0, 1.0);
    assert.equal(result.error, true);
    assert.equal(result.errorType, CalculatorAPI.Constants.ErrorTypes.RANGE);
  });
});

describe('GetVolumeUnit / ConvertVolume', () => {
  it('resolves common unit aliases', () => {
    assert.equal(CalculatorAPI.GetVolumeUnit('gallon'), CalculatorAPI.Constants.VOLUME_UNITS.GALLONS_US);
    assert.equal(CalculatorAPI.GetVolumeUnit('litre'), CalculatorAPI.Constants.VOLUME_UNITS.LITERS);
  });

  it('returns null for an unknown unit', () => {
    assert.equal(CalculatorAPI.GetVolumeUnit('parsecs'), null);
  });

  it('converts 1 US gallon to liters', () => {
    const result = CalculatorAPI.ConvertVolume(1, 'gallon', 'liters');
    assert.equal(result.error, false);
    assert.ok(Math.abs(result.toAmount - 3.785411) < 0.0001);
  });

  it('errors on an unknown fromUnit', () => {
    const result = CalculatorAPI.ConvertVolume(1, 'parsecs', 'liters');
    assert.equal(result.error, true);
    assert.equal(result.errorArgument, 'fromUnit');
  });
});

describe('GetHoneyUnit / ConvertHoneyUnits', () => {
  it('converts 1 pound of honey to kilograms', () => {
    const result = CalculatorAPI.ConvertHoneyUnits(1, 'lb', 'kg');
    assert.equal(result.error, false);
    assert.ok(Math.abs(result.toAmount - 0.453592) < 0.0001);
  });

  it('errors on an unknown honey unit', () => {
    const result = CalculatorAPI.ConvertHoneyUnits(1, 'stones', 'kg');
    assert.equal(result.error, true);
    assert.equal(result.errorArgument, 'fromUnit');
  });
});

describe('ConvertTemperature', () => {
  it('converts Fahrenheit to Celsius', () => {
    const result = CalculatorAPI.ConvertTemperature(32, 'f');
    assert.equal(result.error, false);
    assert.equal(result.toTemperature, 0);
    assert.equal(result.toUnit, 'Celsius');
  });

  it('converts Celsius to Fahrenheit', () => {
    const result = CalculatorAPI.ConvertTemperature(100, 'c');
    assert.equal(result.error, false);
    assert.equal(result.toTemperature, 212);
    assert.equal(result.toUnit, 'Fahrenheit');
  });

  it('does not leak an implicit global for repeated conversions', () => {
    CalculatorAPI.ConvertTemperature(50, 'f');
    assert.equal(typeof globalThis.to_temp, 'undefined');
  });

  it('errors on an unknown unit', () => {
    const result = CalculatorAPI.ConvertTemperature(50, 'kelvin');
    assert.equal(result.error, true);
    assert.equal(result.errorArgument, 'fromUnit');
  });
});

describe('ComputeDelle', () => {
  it('computes a Delle number for a valid ABV/SG pair', () => {
    const result = CalculatorAPI.ComputeDelle(12.5, 1.0);
    assert.equal(result.error, false);
    assert.ok(typeof result.delle === 'number');
  });
});

describe('GetSugarSourceIdentifier', () => {
  it('resolves common fruit aliases', () => {
    assert.equal(CalculatorAPI.GetSugarSourceIdentifier('honey'), CalculatorAPI.Constants.SUGAR_SOURCES.HONEY);
    assert.equal(CalculatorAPI.GetSugarSourceIdentifier('apple'), CalculatorAPI.Constants.SUGAR_SOURCES.APPLES);
  });

  it('resolves tangerine to SUGAR_SOURCES.TANGERINES', () => {
    assert.equal(CalculatorAPI.GetSugarSourceIdentifier('tangerine'), CalculatorAPI.Constants.SUGAR_SOURCES.TANGERINES);
    assert.equal(
      CalculatorAPI.GetSugarSourceIdentifier('tangerines'),
      CalculatorAPI.Constants.SUGAR_SOURCES.TANGERINES
    );
  });

  it('returns null for an unknown sugar source', () => {
    assert.equal(CalculatorAPI.GetSugarSourceIdentifier('unobtainium'), null);
  });
});

describe('MakeHoursString', () => {
  it('formats "pitch" timing', () => {
    assert.equal(CalculatorAPI.MakeHoursString('pitch'), 'At Pitch');
  });

  it('formats "break" timing with the 1/3 sugar break gravity', () => {
    assert.equal(CalculatorAPI.MakeHoursString('break', 1.03), '1/3 Sugar Break (1.030 - no later than 7 days)');
  });

  it('formats a numeric hours-after-addition timing', () => {
    assert.equal(CalculatorAPI.MakeHoursString('24,0'), '24 Hours after pitch');
    assert.equal(CalculatorAPI.MakeHoursString('24,2'), '24 Hours after honey addition #2');
  });

  it('formats a plain hour count', () => {
    assert.equal(CalculatorAPI.MakeHoursString(24), '24 Hours');
  });
});

describe('ListVolumeUnits', () => {
  it('lists every VOLUME_UNITS entry with its display name, lowercased key first', () => {
    const list = CalculatorAPI.ListVolumeUnits();

    assert.equal(list.length, Object.keys(CalculatorAPI.Constants.VOLUME_UNITS).length);
    assert.deepEqual(list[0], { unit: 'liters', name: 'Liter(s)' });
    assert.deepEqual(
      list.find((entry) => entry.unit === 'gallons_us'),
      { unit: 'gallons_us', name: 'Gallon(s) US' }
    );
  });
});

describe('ListYeastRequirements', () => {
  it('lists every YAN_REQUIREMENT_BY_YEAST entry with its human-readable requirement', () => {
    const list = CalculatorAPI.ListYeastRequirements();

    assert.equal(list.length, Object.keys(CalculatorAPI.Constants.YAN_REQUIREMENT_BY_YEAST).length);
    assert.deepEqual(
      list.find((entry) => entry.yeast === 'Lalvin 71B'),
      { yeast: 'Lalvin 71B', requirement: 'Low' }
    );
    assert.deepEqual(
      list.find((entry) => entry.yeast === 'Kveik'),
      { yeast: 'Kveik', requirement: 'Kveik' }
    );
  });
});
