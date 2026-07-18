// Blending math for combining two liquids of different gravity/ABV/etc into a target value.
const CalculatorAPI = require('./CalculatorAPI.js');
const Constants = CalculatorAPI.Constants;

function right(str, n) {
  if (n <= 0) {
    return '';
  }
  if (n > String(str).length) {
    return str;
  }
  const len = String(str).length;
  return String(str).substring(len, len - n);
}

// round val to sigFigures decimal places, trimming trailing zeros in the fractional part
function displayNumber(val, sigFigures) {
  const neg = Number(val) < 0 ? '-' : '';
  const i = Math.floor(Math.round(Math.pow(10, sigFigures) * Number(Math.abs(val))) / Math.pow(10, sigFigures));
  const x = right('000' + Math.round(Math.pow(10, sigFigures) * (Math.abs(Number(val)) - Math.abs(i))), sigFigures);
  return Number(neg + i + '.' + x);
}

function displayNrTrim(val, sigFigures) {
  const v = displayNumber(val, sigFigures) - Math.floor(Number(val));
  return Math.floor(Number(val)) + Number(v);
}

// Given any 4 of { value1, value2, blendedValue, volume1, volume2, totalVolume }, solve for
// `fieldToCalculate`. Returns { error, errorMessage } on failure, or the resolved fields on success.
function calculateBlend(fieldToCalculate, { value1, value2, blendedValue, volume1, volume2, totalVolume }) {
  const vA = value1;
  const vB = value2;
  let vC = volume1;
  let vD = volume2;
  let vM = blendedValue;
  let vCD = totalVolume;

  if (fieldToCalculate === Constants.BLEND_FIELDS.VALUE1) {
    if (vB != null && vC != null && vD != null && vM != null) {
      value1 = Number(displayNrTrim((vM * vC + vM * vD - vB * vD) / vC, 3));
    } else {
      return { error: true, errorMessage: 'More fields are required to calculate Value #1.' };
    }
  } else if (fieldToCalculate === Constants.BLEND_FIELDS.VOLUME1) {
    if (vA != null && vB != null && vD != null && vM != null) {
      vC = Number(displayNrTrim((vD * (1 - vB / vM)) / (vA / vM - 1), 3));
      volume1 = vC;
    } else if (vA != null && vB != null && vCD != null && vM != null) {
      vC = Number(displayNrTrim((vCD * (vB - vM)) / (vB - vA), 3));
      volume1 = vC;
      vD = Number(displayNrTrim((vCD * (vM - vA)) / (vB - vA), 3));
      volume2 = vD;
    } else {
      return { error: true, errorMessage: 'Please specify Volume #2 or total volume.' };
    }
  } else if (fieldToCalculate === Constants.BLEND_FIELDS.BLENDED_VALUE) {
    if (vA != null && vB != null && vC != null && vD != null) {
      vM = Number(displayNrTrim((vA * vC + vB * vD) / (vC + vD), 3));
      blendedValue = vM;
    } else {
      return { error: true, errorMessage: 'More fields are required to calculate blended value.' };
    }
  } else if (fieldToCalculate === Constants.BLEND_FIELDS.VALUE2) {
    if (vA != null && vC != null && vD != null && vM != null) {
      value2 = Number(displayNrTrim((vM * vC + vM * vD - vA * vC) / vD, 3));
    } else {
      return { error: true, errorMessage: 'More fields are required to calculate Value #2.' };
    }
  } else if (fieldToCalculate === Constants.BLEND_FIELDS.VOLUME2) {
    if (vA != null && vB != null && vC != null && vM != null) {
      vD = Number(displayNrTrim((vC * (vA / vM - 1)) / (1 - vB / vM), 3));
      volume2 = vD;
    } else if (vA != null && vB != null && vCD != null && vM != null) {
      vC = Number(displayNrTrim((vCD * (vB - vM)) / (vB - vA), 3));
      volume1 = vC;
      vD = Number(displayNrTrim((vCD * (vM - vA)) / (vB - vA), 3));
      volume2 = vD;
    } else {
      return { error: true, errorMessage: 'Please specify Volume #1 or total volume.' };
    }
  } else if (fieldToCalculate === Constants.BLEND_FIELDS.TOTAL_VOLUME) {
    if (vA != null && vB != null && vM != null) {
      if (vC != null && vD == null) {
        vD = Number(displayNrTrim((vC * (vA / vM - 1)) / (1 - vB / vM), 3));
        volume2 = vD;
        vCD = Number(displayNrTrim(0 + vC + vD, 3));
        totalVolume = vCD;
      } else if (vC == null && vD != null) {
        vC = Number(displayNrTrim((vD * (1 - vB / vM)) / (vA / vM - 1), 3));
        volume1 = vC + 0;
        vCD = Number(displayNrTrim(0.0 + vC + vD, 3));
        totalVolume = vCD + 0;
      } else if (vC == null && vD == null && vCD != null) {
        vC = Number(displayNrTrim((vCD * (vB - vM)) / (vB - vA), 3));
        volume1 = vC;
        vD = Number(displayNrTrim((vCD * (vM - vA)) / (vB - vA), 3));
        volume2 = vD;
      } else {
        return { error: true, errorMessage: 'Please specify a volume.' };
      }
    }
  }

  if (vCD !== vC + vD && vC > 0 && vD > 0) {
    vCD = Number(displayNrTrim(vC + vD, 3));
    totalVolume = vCD;
  }

  return {
    error: false,
    value1: value1 == null ? '' : value1,
    value2: value2 == null ? '' : value2,
    blendedValue: blendedValue == null ? '' : blendedValue,
    volume1: volume1 == null ? '' : volume1,
    volume2: volume2 == null ? '' : volume2,
    totalVolume: totalVolume == null ? '' : totalVolume,
  };
}

module.exports = {
  displayNumber,
  displayNrTrim,
  calculateBlend,
};
