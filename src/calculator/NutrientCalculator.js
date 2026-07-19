// Yeast/nutrient-schedule math shared by the build-batch, calculate-nutrients, and
// calculate-mead commands. Ported from Storm's mead-nutrient-calculation spreadsheet.
const CalculatorAPI = require('./CalculatorAPI.js');
const Constants = CalculatorAPI.Constants;

// honey weight (and its unit label) needed to hit a given OG for a batch of volume bV
function hoCalc(og, bV, unit) {
  const hV = (og - 1) / 0.41204; // honey weight in lbs, per gallon-equivalent

  switch (unit) {
    case Constants.UNITS.US:
      return [hV * 11.76088 * bV, 'lbs'];
    case Constants.UNITS.METRIC:
      return [(hV * 11.76088 * bV) / 2.2046, 'kg'];
    default:
      return null;
  }
}

// dry yeast / Go-Ferm requirements for a batch
function getGoferm(vol, og, fruitYan, useGoferm = true, yeastPackGrams = 5, doKveik = false) {
  const volume = parseFloat(vol.toFixed(3));

  let pitch = 2;
  if (doKveik) {
    pitch = 1;
    yeastPackGrams = 0;
  } else if (og >= 1.144 || fruitYan < 0) {
    pitch = 3;
  }

  const yst = Math.ceil(pitch * volume);
  let numPacket = 0;
  let gf = 1.25 * yst;
  if (yeastPackGrams > 0) {
    numPacket = Math.ceil(yst / yeastPackGrams);
    gf = 1.25 * numPacket * yeastPackGrams;
  }
  if (!useGoferm) {
    gf = 0;
  }
  const reh = gf * 20;

  return [yst, numPacket, gf, reh, yeastPackGrams];
}

function getFermO(vol, nit, snaSchedule) {
  const fermO = Math.round(((nit * vol) / 50) * 10) / 10;
  const fermN = Math.round((fermO / snaSchedule.length) * 10) / 10;
  const lastFerm = Math.round((fermO - fermN * (snaSchedule.length - 1)) * 10) / 10;

  const additions = [];
  for (let i = 0; i < snaSchedule.length - 1; i++) {
    additions.push({ timing: snaSchedule[i], fermO: fermN, fermK: 0, dap: 0 });
  }
  additions.push({ timing: snaSchedule[snaSchedule.length - 1], fermO: lastFerm, fermK: 0, dap: 0 });

  return { nitrogen: nit, totalFermO: fermO, totalFermK: 0, totalDAP: 0, additions };
}

function getFermK(vol, nit, snaSchedule) {
  const fermK = Math.round(((nit * vol) / 50 / 2) * 10) / 10;
  const fermN = Math.round((fermK / snaSchedule.length) * 10) / 10;
  const lastFerm = Math.round((fermK - fermN * (snaSchedule.length - 1)) * 10) / 10;

  const additions = [];
  for (let i = 0; i < snaSchedule.length - 1; i++) {
    additions.push({ timing: snaSchedule[i], fermO: 0, fermK: fermN, dap: 0 });
  }
  additions.push({ timing: snaSchedule[snaSchedule.length - 1], fermO: 0, fermK: lastFerm, dap: 0 });

  return { nitrogen: nit, totalFermO: 0, totalFermK: fermK, totalDAP: 0, additions };
}

function getFermOK(vol, nit, snaSchedule) {
  const additions = [];
  let fermO;
  let fermK;

  if (snaSchedule.length === 1) {
    fermO = Math.round(((nit * vol) / 50 / 2) * 10) / 10;
    fermK = Math.round(((nit * vol) / 50 / 4) * 10) / 10;

    additions.push({ timing: snaSchedule[0], fermO, fermK, dap: 0 });
  } else if (snaSchedule.length === 2) {
    fermO = Math.round(((nit * vol) / 50 / 2) * 10) / 10;
    const fermO2 = Math.round((fermO / 2) * 10) / 10;
    const lastFermO = Math.round((fermO - fermO2) * 10) / 10;
    fermK = Math.round(((nit * vol) / 50 / 4) * 10) / 10;
    const fermK2 = Math.round((fermK / 2) * 10) / 10;
    const lastFermK = Math.round((fermK - fermK2) * 10) / 10;

    additions.push({ timing: snaSchedule[0], fermO: fermO2, fermK: fermK2, dap: 0 });
    additions.push({ timing: snaSchedule[1], fermO: lastFermO, fermK: lastFermK, dap: 0 });
  } else if (snaSchedule.length === 3) {
    fermO = Math.round((((nit * vol) / 50) * 10 * (2 / 3)) / 10);
    fermK = Math.round((((nit * vol) / 50 / 2) * 10 * (1 / 3)) / 10);
    const fermO2 = Math.round((fermO / 2) * 10) / 10;
    const lastFermO = Math.round((fermO - fermO2) * 10) / 10;

    additions.push({ timing: snaSchedule[0], fermO: fermO2, fermK: 0, dap: 0 });
    additions.push({ timing: snaSchedule[1], fermO: 0, fermK, dap: 0 });
    additions.push({ timing: snaSchedule[2], fermO: lastFermO, fermK: 0, dap: 0 });
  } else if (snaSchedule.length === 4) {
    fermO = Math.round(((nit * vol) / 50 / 2) * 10) / 10;
    const fermO2 = Math.round((fermO / 2) * 10) / 10;
    const lastFermO = Math.round((fermO - fermO2) * 10) / 10;
    fermK = Math.round(((nit * vol) / 50 / 4) * 10) / 10;
    const fermK2 = Math.round((fermK / 2) * 10) / 10;
    const lastFermK = Math.round((fermK - fermK2) * 10) / 10;

    additions.push({ timing: snaSchedule[0], fermO: fermO2, fermK: 0, dap: 0 });
    additions.push({ timing: snaSchedule[1], fermO: 0, fermK: fermK2, dap: 0 });
    additions.push({ timing: snaSchedule[2], fermO: 0, fermK: lastFermK, dap: 0 });
    additions.push({ timing: snaSchedule[3], fermO: lastFermO, fermK: 0, dap: 0 });
  } else {
    fermK = Math.round((((nit * vol) / 50 / 2) * 10 * ((snaSchedule.length - 2) / snaSchedule.length)) / 10);
    fermO = Math.round(((nit * vol) / 50 / 2) * 10) / 10;
    const fermO2 = Math.round((fermO / 2) * 10) / 10;
    const lastFermO = Math.round((fermO - fermO2) * 10) / 10;
    const fermKN = Math.round((fermK / (snaSchedule.length - 2)) * 10) / 10;
    const lastFermK = Math.round((fermK - fermKN * (snaSchedule.length - 3)) * 10) / 10;

    additions.push({ timing: snaSchedule[0], fermO: fermO2, fermK: 0, dap: 0 });
    for (let i = 1; i < snaSchedule.length - 2; i++) {
      additions.push({ timing: snaSchedule[i], fermO: 0, fermK: fermKN, dap: 0 });
    }
    additions.push({ timing: snaSchedule[snaSchedule.length - 2], fermO: 0, fermK: lastFermK, dap: 0 });
    additions.push({ timing: snaSchedule[snaSchedule.length - 1], fermO: lastFermO, fermK: 0, dap: 0 });
  }

  return { nitrogen: nit, totalFermO: fermO, totalFermK: fermK, totalDAP: 0, additions };
}

function getFermKdap(vol, nit, snaSchedule, fermKYan) {
  if (nit > 250) {
    nit = 250;
  }
  const fk = Math.round(((nit * 0.2) / fermKYan) * 3.7854 * vol * 10) / 10;
  const dap = Math.round(((nit * 0.8) / 210) * 3.7854 * vol * 10) / 10;

  const fkN = Math.round((fk / snaSchedule.length) * 10) / 10;
  const dapN = Math.round((dap / snaSchedule.length) * 10) / 10;
  const lastFk = Math.round((fk - fkN * (snaSchedule.length - 1)) * 10) / 10;
  const lastDap = Math.round((dap - dapN * (snaSchedule.length - 1)) * 10) / 10;

  const additions = [];
  for (let i = 0; i < snaSchedule.length - 1; i++) {
    additions.push({ timing: snaSchedule[i], fermO: 0, fermK: fkN, dap: dapN });
  }
  additions.push({ timing: snaSchedule[snaSchedule.length - 1], fermO: 0, fermK: lastFk, dap: lastDap });

  return { nitrogen: nit, totalFermO: 0, totalFermK: fk, totalDAP: dap, additions };
}

// Blount-Elliott style nutrient split across Fermaid O, Fermaid K, and DAP
function getNutrients(vol, abv, yan, snaSchedule, fermKYan, fermOEffectiveness) {
  vol = vol * 3.784; // volume in liters
  const foe = fermOEffectiveness;

  const foMaxGL = 0.45; // Lallemand recommendation
  const fkMaxGL = 0.5; // US legal limit
  const dapMaxGL = 0.96; // US legal limit

  const foMaxYan = foMaxGL * 40 * foe;
  const fkMaxYan = fkMaxGL * fermKYan;
  const dapMaxYan = dapMaxGL * 210;

  const maxYan = Number(foMaxYan) + Number(fkMaxYan) + Number(dapMaxYan);
  const fofkMaxYan = Number(foMaxYan) + Number(fkMaxYan);

  let fkGL, dapGL, yanRem, foGL;

  if (yan > maxYan) {
    fkGL = fkMaxGL;
    dapGL = dapMaxGL;
    yanRem = yan - (fkMaxYan + dapMaxYan);
    foGL = yanRem / (40 * foe);
  } else if (yan > fofkMaxYan) {
    foGL = foMaxGL;
    fkGL = fkMaxGL;
    yanRem = yan - (fkMaxYan + foMaxYan);
    dapGL = yanRem / 210;
  } else if (yan > foMaxYan) {
    foGL = foMaxGL;
    yanRem = yan - foMaxYan;
    fkGL = yanRem / fermKYan;
    dapGL = 0;
  } else {
    foGL = yan / (40 * foe);
    fkGL = 0;
    dapGL = 0;
  }

  const fo = Math.round(foGL * vol * 10) / 10;
  const fk = Math.round(fkGL * vol * 10) / 10;
  const dap = Math.round(dapGL * vol * 10) / 10;

  const additions = [];
  if (snaSchedule.length % 2 === 0) {
    const half = snaSchedule.length / 2;
    const foN = Math.round((fo / half) * 10) / 10;
    const lastFo = Math.round((fo - foN * (half - 1)) * 10) / 10;
    const fkN = Math.round((fk / half) * 10) / 10;
    const lastFk = Math.round((fk - fkN * (half - 1)) * 10) / 10;
    const dapN = Math.round((dap / half) * 10) / 10;
    const lastDap = Math.round((dap - dapN * (half - 1)) * 10) / 10;

    for (let i = 0; i < half - 1; i++) {
      additions.push({ timing: snaSchedule[i], fermO: foN, fermK: 0, dap: 0 });
    }
    additions.push({ timing: snaSchedule[half - 1], fermO: lastFo, fermK: 0, dap: 0 });
    for (let i = half; i < snaSchedule.length - 1; i++) {
      additions.push({ timing: snaSchedule[i], fermO: 0, fermK: fkN, dap: dapN });
    }
    additions.push({ timing: snaSchedule[snaSchedule.length - 1], fermO: 0, fermK: lastFk, dap: lastDap });
  } else {
    const foN = Math.round((fo / snaSchedule.length) * 10) / 10;
    const lastFo = Math.round((fo - foN * (snaSchedule.length - 1)) * 10) / 10;
    const fkN = Math.round((fk / snaSchedule.length) * 10) / 10;
    const lastFk = Math.round((fk - fkN * (snaSchedule.length - 1)) * 10) / 10;
    const dapN = Math.round((dap / snaSchedule.length) * 10) / 10;
    const lastDap = Math.round((dap - dapN * (snaSchedule.length - 1)) * 10) / 10;
    const half = snaSchedule.length / 2;

    for (let i = 0; i < half - 1; i++) {
      additions.push({ timing: snaSchedule[i], fermO: foN * 2, fermK: 0, dap: 0 });
    }
    additions.push({
      timing: snaSchedule[Math.ceil(half) - 1],
      fermO: lastFo,
      fermK: lastFk,
      dap: lastDap,
    });
    for (let i = Math.ceil(half); i < snaSchedule.length; i++) {
      additions.push({ timing: snaSchedule[i], fermO: 0, fermK: fkN * 2, dap: dapN * 2 });
    }
  }

  return { nitrogen: yan, totalFermO: fo, totalFermK: fk, totalDAP: dap, additions };
}

function getYanRatio(yan, ratio, totalRatio) {
  return (yan * ratio) / totalRatio;
}

// nutrient split with configurable per-source limits/ratios, used by calculate-nutrients
// and calculate-mead's "advanced" regimen
function getAdvancedNutrients(
  units,
  volume,
  yan,
  fermOEffectiveness,
  enforceLimits,
  dapLimit,
  fermKLimit,
  fermOLimit,
  yanRatioDap,
  yanRatioFermK,
  yanRatioFermO,
  snaSchedule,
  fermKYan,
  fillFkFirst
) {
  let dapR = yanRatioDap;
  let fkR = yanRatioFermK;
  let foR = yanRatioFermO;
  const rt = Number(dapR) + Number(fkR) + Number(foR);
  let vol = volume;
  const foe = fermOEffectiveness;

  if (units === Constants.UNITS.US) {
    vol = vol * 3.78541;
  }

  let fkGL, fkYan, dapGL, dapYan, yanRem, foGL, foYan;
  let debug;

  if (enforceLimits) {
    const foMaxGL = fermOLimit;
    const fkMaxGL = fermKLimit;
    const dapMaxGL = dapLimit;

    const foMaxYan = foMaxGL * 40 * foe;
    const fkMaxYan = fkMaxGL * fermKYan;
    const dapMaxYan = dapMaxGL * 210;

    const maxYan = Number(foMaxYan) + Number(fkMaxYan) + Number(dapMaxYan);
    const fofkMaxYan = Number(foMaxYan) + Number(fkMaxYan);

    if (yan > maxYan) {
      debug = 'calculate all three with fo remainder';
      fkGL = fkMaxGL;
      fkYan = fkMaxYan;
      dapGL = dapMaxGL;
      dapYan = dapMaxYan;
      yanRem = yan - (fkMaxYan + dapMaxYan);
      foGL = yanRem / (40 * foe);
      foYan = yanRem;
    } else if (yan > fofkMaxYan) {
      debug = 'calculate all three with dap remainder';
      foGL = foMaxGL;
      foYan = foMaxYan;
      fkGL = fkMaxGL;
      fkYan = fkMaxYan;
      yanRem = yan - (fkMaxYan + foMaxYan);
      dapGL = yanRem / 210;
      dapYan = yanRem;
    } else if (fillFkFirst) {
      if (yan > fkMaxYan) {
        debug = 'calculate fk and fo remainder';
        fkGL = fkMaxGL;
        fkYan = fkMaxYan;
        yanRem = yan - fkMaxYan;
        foGL = yanRem / (40 * foe);
        foYan = yanRem;
        dapGL = 0;
        dapYan = 0;
      } else {
        debug = 'calculate fk only';
        fkGL = yan / fermKYan;
        fkYan = yan;
        foGL = 0;
        foYan = 0;
        dapGL = 0;
        dapYan = 0;
      }
    } else if (yan > foMaxYan) {
      debug = 'calculate fo and fk remainder';
      foGL = foMaxGL;
      foYan = foMaxYan;
      yanRem = yan - foMaxYan;
      fkGL = yanRem / fermKYan;
      fkYan = yanRem;
      dapGL = 0;
      dapYan = 0;
    } else {
      debug = 'calculate fo only';
      foGL = yan / (40 * foe);
      foYan = yan;
      fkGL = 0;
      fkYan = 0;
      dapGL = 0;
      dapYan = 0;
    }

    yanRatioFermK = Math.ceil((fkYan / yan) * 1000) / 1000;
    yanRatioFermO = Math.ceil((foYan / yan) * 1000) / 1000;
    yanRatioDap = Math.ceil((dapYan / yan) * 1000) / 1000;
  } else {
    debug = 'custom limits';
    dapYan = getYanRatio(yan, dapR, rt);
    fkYan = getYanRatio(yan, fkR, rt);
    foYan = getYanRatio(yan, foR, rt);

    dapGL = dapYan / 210;
    fkGL = fkYan / fermKYan;
    foGL = foYan / (40 * foe);
  }

  let dapG = dapGL * vol;
  let fkG = fkGL * vol;
  let foG = foGL * vol;

  dapYan = Math.round(dapYan * 100) / 100;
  fkYan = Math.round(fkYan * 100) / 100;
  foYan = Math.round(foYan * 100) / 100;
  dapGL = Math.round(dapGL * 100) / 100;
  fkGL = Math.round(fkGL * 100) / 100;
  foGL = Math.round(foGL * 100) / 100;
  dapG = Math.round(dapG * 100) / 100;
  fkG = Math.round(fkG * 100) / 100;
  foG = Math.round(foG * 100) / 100;

  const additions = [];
  if (snaSchedule.length > 4 && (fkG > 0 || dapG > 0)) {
    const fkG1 = Math.round((fkG * 100) / 2) / 100;
    const fkG2 = Math.round((fkG - fkG1) * 100) / 100;
    const foG1 = Math.round((foG * 100) / 2) / 100;
    const foG2 = Math.round((foG - foG1) * 100) / 100;

    const stepDiv = Math.floor((snaSchedule.length - 1) / 2);

    const dapN = Math.round((dapG / stepDiv) * 100) / 100;
    const finalDap = Math.round((dapG - dapN * (stepDiv - 1)) * 100) / 100;
    const fkN1 = Math.round((fkG1 / stepDiv) * 100) / 100;
    const finalFk1 = Math.round((fkG1 - fkN1 * (stepDiv - 1)) * 100) / 100;
    const fkN2 = Math.round((fkG2 / stepDiv) * 100) / 100;
    const finalFk2 = Math.round((fkG2 - fkN2 * (stepDiv - 1)) * 100) / 100;
    const foN1 = Math.round((foG1 / stepDiv) * 100) / 100;
    const finalFo1 = Math.round((foG1 - foN1 * (stepDiv - 1)) * 100) / 100;

    let i = 0;
    for (let j = 0; j < stepDiv - 1; j++) {
      additions.push({ timing: snaSchedule[i], fermO: 0, fermK: fkN1, dap: dapN });
      i++;
    }
    additions.push({ timing: snaSchedule[i], fermO: 0, fermK: finalFk1, dap: finalDap });
    i++;
    for (let j = 0; j < stepDiv - 1; j++) {
      additions.push({ timing: snaSchedule[i], fermO: foN1, fermK: fkN2, dap: 0 });
      i++;
    }
    additions.push({ timing: snaSchedule[i], fermO: finalFo1, fermK: finalFk2, dap: 0 });
    i++;
    additions.push({ timing: snaSchedule[i], fermO: foG2, fermK: 0, dap: 0 });
  } else {
    const foN = Math.ceil((100 * foG) / snaSchedule.length) / 100;
    const fkN = Math.ceil((100 * fkG) / snaSchedule.length) / 100;
    const dapN = Math.ceil((100 * dapG) / snaSchedule.length) / 100;
    const finalFo = Math.round(100 * (foG - foN * (snaSchedule.length - 1))) / 100;
    const finalFk = Math.round(100 * (fkG - fkN * (snaSchedule.length - 1))) / 100;
    const finalDap = Math.round(100 * (dapG - dapN * (snaSchedule.length - 1))) / 100;

    for (let i = 0; i < snaSchedule.length - 1; i++) {
      additions.push({ timing: snaSchedule[i], fermO: foN, fermK: fkN, dap: dapN });
    }
    additions.push({ timing: snaSchedule[snaSchedule.length - 1], fermO: finalFo, fermK: finalFk, dap: finalDap });
  }

  return {
    yan,
    volume,
    units,
    foe,
    dap_limit: dapLimit,
    fermK_limit: fermKLimit,
    fermO_limit: fermOLimit,
    yan_ratio_dap: yanRatioDap,
    yan_ratio_fermK: yanRatioFermK,
    yan_ratio_fermO: yanRatioFermO,
    dapGL,
    fkGL,
    foGL,
    dapYan,
    fkYan,
    foYan,
    dapG,
    fkG,
    foG,
    enforce: enforceLimits,
    debug,
    sna: { nitrogen: yan, totalFermO: foG, totalFermK: fkG, totalDAP: dapG, additions },
  };
}

// human-readable "Xg Fermaid O\nYg Fermaid K\n..." string for one nutrient addition
function makeNutString(addition) {
  const parts = [];
  if (addition.fermO > 0) {
    parts.push(addition.fermO + 'g Fermaid O');
  }
  if (addition.fermK > 0) {
    parts.push(addition.fermK + 'g Fermaid K');
  }
  if (addition.dap > 0) {
    parts.push(addition.dap + 'g DAP');
  }
  return parts.length > 0 ? parts.join('\n') : 'No nutrients required.';
}

// yanContributionFromGrams(grams, yanPpm, volumeInLiters) - ppm YAN contributed by adding a
// nutrient source (e.g. Go-Ferm) of the given YAN concentration (in parts per million) to a must
// of the given volume, in grams added
function yanContributionFromGrams(grams, yanPpm, volumeInLiters) {
  if (grams <= 0) {
    return 0;
  }
  return Math.floor((grams * yanPpm) / volumeInLiters);
}

// calculateNutrients(options) - orchestrates !calculate-nutrients' full computation (Go-Ferm YAN
// contribution, then a staggered-nutrient-addition schedule fixed at [24, 48, 72, 'break']) from
// already-parsed/defaulted options:
//  - units - Constants.UNITS.US or Constants.UNITS.METRIC
//  - volume - must volume, in gallons (US) or liters (METRIC)
//  - yan - target total YAN (ppm), before any Go-Ferm contribution is subtracted
//  - fermOEffectiveness, enforceLimits, dapLimit, fermKLimit, fermOLimit, yanRatioDap,
//    yanRatioFermK, yanRatioFermO, fermKYan, fillFkFirst - passed through to getAdvancedNutrients
//  - gofermYan - YAN (ppm) provided by the Go-Ferm product in use
//  - gofermGrams - grams of Go-Ferm already accounted for elsewhere (e.g. for rehydration); its
//    YAN contribution is subtracted from yan before computing the nutrient schedule
// Returns getAdvancedNutrients' result plus a top-level gofermYanContribution field.
function calculateNutrients(options) {
  const {
    units,
    volume,
    yan,
    fermOEffectiveness,
    enforceLimits,
    dapLimit,
    fermKLimit,
    fermOLimit,
    yanRatioDap,
    yanRatioFermK,
    yanRatioFermO,
    fermKYan,
    fillFkFirst,
    gofermYan,
    gofermGrams,
  } = options;

  const volumeInLiters = units === Constants.UNITS.US ? volume * 3.784 : volume;
  const gofermYanContribution = yanContributionFromGrams(gofermGrams, gofermYan, volumeInLiters);

  const nutrients = getAdvancedNutrients(
    units,
    volume,
    yan - gofermYanContribution,
    fermOEffectiveness,
    enforceLimits,
    dapLimit,
    fermKLimit,
    fermOLimit,
    yanRatioDap,
    yanRatioFermK,
    yanRatioFermO,
    [24, 48, 72, 'break'],
    fermKYan,
    fillFkFirst
  );

  return { ...nutrients, gofermYanContribution };
}

module.exports = {
  hoCalc,
  getGoferm,
  getFermO,
  getFermK,
  getFermOK,
  getFermKdap,
  getNutrients,
  getYanRatio,
  getAdvancedNutrients,
  makeNutString,
  yanContributionFromGrams,
  calculateNutrients,
};
