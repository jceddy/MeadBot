// Full-recipe orchestration (honey/yeast/nutrients) shared by the build-batch and
// calculate-mead commands.
const CalculatorAPI = require('./CalculatorAPI.js');
const Gravity = require('./GravityCalculator.js');
const Nutrient = require('./NutrientCalculator.js');
const Constants = CalculatorAPI.Constants;

// pickSnaSchedule(yanRequirement, hot, og) - the default staggered-nutrient-addition schedule
// for a batch, absent an explicit override
function pickSnaSchedule(yanRequirement, hot, og) {
  if (yanRequirement === Constants.YAN_REQUIREMENT.KVEIK) {
    return ['pitch'];
  }
  if (hot) {
    if (og >= 1.1) {
      return [24, 'break'];
    }
    if (og >= 1.08) {
      return [24];
    }
    return ['pitch'];
  }
  if (og >= 1.12) {
    return [24, 48, 72, 'break'];
  }
  if (og >= 1.1) {
    return [24, 48, 'break'];
  }
  if (og >= 1.08) {
    return [24, 'break'];
  }
  if (og >= 1.06) {
    return [24];
  }
  return ['pitch'];
}

/**
 * buildBatch(options) - orchestrates !build-batch's full computation (target OG/FG/ABV, SNA
 * schedule selection, fruit YAN contribution, honey weight, yeast/Go-Ferm requirements, and the
 * nutrient schedule for whichever regimen was selected) from already-parsed/defaulted options:
 *  - units - Constants.UNITS.US or Constants.UNITS.METRIC
 *  - volume - batch volume, in gallons (US) or liters (METRIC)
 *  - yeastAbv - the yeast's expected %ABV tolerance
 *  - residualSugar - target FG (used as-is unless ogOverride causes it to be re-derived)
 *  - yanRequirement, nutrientRegimen - Constants.YAN_REQUIREMENT.* / Constants.NUTRIENT_REGIMEN.*
 *  - ogOverride - target OG; if > 0, overrides residualSugar (0 means "not specified")
 *  - pitchRateOverride - yeast g/gallon (US) or g/L (METRIC); if > 0, overrides the
 *    Go-Ferm/pitch-rate calculation normally derived from getGoferm (0 means "not specified")
 *  - fruitSg - gravity contribution from fruit/grains (0 means "not specified")
 *  - yanOverride - total target YAN, used only for the ADVANCED regimen (0 means "not specified")
 *  - fermOEffectiveness, enforceLimits, dapLimit, fermKLimit, fermOLimit, yanRatioDap,
 *    yanRatioFermK, yanRatioFermO - ADVANCED-regimen tunables, passed through to
 *    getAdvancedNutrients
 *  - fermKYan, gofermYan, fillFkFirst - nutrient-source YAN concentrations/preferences
 *  - hot - whether fermenting hot (affects the default SNA schedule)
 *  - snaScheduleOverride - explicit SNA schedule, or null to use the default for
 *    yanRequirement/hot/og
 * Returns {error: true, errorMessage} on failure (fruitSg > og, or an unrecognized
 * nutrientRegimen), or a result object with the resolved og/fg/abv, yan/nutrient breakdown,
 * honey/yeast/Go-Ferm requirements, and (for ADVANCED) the full getAdvancedNutrients result.
 */
function buildBatch(options) {
  const {
    units,
    volume,
    yeastAbv,
    residualSugar,
    yanRequirement,
    nutrientRegimen,
    ogOverride,
    pitchRateOverride,
    fruitSg,
    yanOverride,
    fermOEffectiveness,
    enforceLimits,
    dapLimit,
    fermKLimit,
    fermOLimit,
    yanRatioDap,
    yanRatioFermK,
    yanRatioFermO,
    fermKYan,
    gofermYan,
    fillFkFirst,
    hot,
    snaScheduleOverride,
  } = options;

  let fg = residualSugar;
  let abv = yeastAbv;
  let bV = volume;
  if (units === Constants.UNITS.METRIC) {
    bV = bV / 3.784; // convert to gallons
  }

  let og;
  if (ogOverride > 0) {
    og = ogOverride;
    const sg = Gravity.stormABVtoSG(abv);
    fg = og - sg + 1;
    if (fg < 1) {
      fg = 1;
      abv = CalculatorAPI.ConvertGravityDropToABV(og);
    }
  } else {
    const sg = Gravity.stormABVtoSG(abv);
    og = sg + fg - 1;
  }

  const sgDelta = og - fg + 1;
  let yan = Gravity.stormSGtoYAN(sgDelta, yanRequirement);

  const snaSchedule = snaScheduleOverride == null ? pickSnaSchedule(yanRequirement, hot, og) : snaScheduleOverride;

  let fruitPercent = 0;
  let fruitPercent100 = 0;
  let fruitYanContribution = 0;
  if (fruitSg > 0) {
    if (fruitSg > og) {
      return {
        error: true,
        errorMessage: "Fruit SG can't be higher than OG. (" + fruitSg.toFixed(3) + ' > ' + og.toFixed(3) + ')',
      };
    }
    fruitPercent = (fruitSg - 1) / (og - 1);
    if (yanRequirement === Constants.YAN_REQUIREMENT.KVEIK) {
      fruitPercent = fruitPercent / 1.5;
    }
    fruitPercent100 = fruitPercent * 100;
    fruitYanContribution = Math.floor(yan * fruitPercent);
    yan -= fruitYanContribution;
  }

  const ho = Nutrient.hoCalc(og, bV, units);
  if (ho == null) {
    return { error: true, errorMessage: 'Error calculating Honey Weight: Unknown Units.' };
  }
  og = Math.round(og * 1000) / 1000;

  let gf;
  if (pitchRateOverride > 0) {
    const yst = pitchRateOverride * volume;
    const numPacket = Math.ceil(yst / 5);
    const gfGrams = 1.25 * numPacket * 5;
    const reh = gfGrams * 20;
    gf = [yst, numPacket, gfGrams, reh];
  } else {
    gf = Nutrient.getGoferm(bV, og, fruitYanContribution);
  }

  const gofermYanContribution = Nutrient.yanContributionFromGrams(gf[2], gofermYan, bV * 3.784);
  yan -= gofermYanContribution;

  let honeyWeight = ho[0];
  if (honeyWeight > 100) {
    honeyWeight = Math.round(honeyWeight);
  } else if (honeyWeight > 10) {
    honeyWeight = Math.round(honeyWeight * 10) / 10;
  } else {
    honeyWeight = Math.round(honeyWeight * 100) / 100;
  }

  let nut;
  let advancedNutrients = null;
  switch (nutrientRegimen) {
    case Constants.NUTRIENT_REGIMEN.TOSNA:
      nut = Nutrient.getFermO(bV, yan, snaSchedule);
      break;
    case Constants.NUTRIENT_REGIMEN.K_DAP:
      nut = Nutrient.getFermKdap(bV, yan, snaSchedule, fermKYan);
      break;
    case Constants.NUTRIENT_REGIMEN.BLOUNT_ELLIOTT:
      nut = Nutrient.getNutrients(bV, abv, yan, snaSchedule, fermKYan, fermOEffectiveness);
      break;
    case Constants.NUTRIENT_REGIMEN.TOSNA_K:
      nut = Nutrient.getFermK(bV, yan, snaSchedule);
      break;
    case Constants.NUTRIENT_REGIMEN.O_K:
      nut = Nutrient.getFermOK(bV, yan, snaSchedule);
      break;
    case Constants.NUTRIENT_REGIMEN.ADVANCED: {
      const advYan = yanOverride > 0 ? yanOverride - gofermYanContribution : yan;
      advancedNutrients = Nutrient.getAdvancedNutrients(
        units,
        volume,
        advYan,
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
      );
      nut = advancedNutrients.sna;
      break;
    }
    default:
      return { error: true, errorMessage: 'Calculation failed: Unknown Nutrient Regimen.' };
  }

  const ogPts = og - 1;
  const fgPts = fg - 1;
  const sgDiff = ogPts - fgPts;
  const break3 = 1 + (fgPts + (sgDiff * 2) / 3);

  return {
    error: false,
    volume,
    units,
    og,
    fg,
    abv,
    yanRequirement,
    nutrientRegimen,
    gofermYanContribution,
    fruitPercent,
    fruitPercent100,
    fruitYanContribution,
    honey: { weight: honeyWeight, unit: ho[1] },
    goferm: { minGrams: gf[0], numPackets: gf[1], grams: gf[2], dilutionWaterMl: gf[3] },
    nut,
    advancedNutrients,
    break3,
  };
}

module.exports = {
  pickSnaSchedule,
  buildBatch,
};
