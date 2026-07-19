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

// unitDefaults(units) - the must-temperature/target-volume defaults that !calculate-mead's own
// -u/--units handler sets as a side effect of selecting metric/us/imperial
function unitDefaults(units) {
  switch (units) {
    case Constants.UNITS.METRIC:
      return {
        mustTemperature: 20,
        mustTemperatureUnits: Constants.TEMPERATURE_UNITS.CELSIUS,
        targetVolume: 18.93,
        targetVolumeUnits: Constants.VOLUME_UNITS.LITERS,
        currentVolumeUnits: Constants.VOLUME_UNITS.LITERS,
      };
    case Constants.UNITS.IMPERIAL:
      return {
        mustTemperature: 68,
        mustTemperatureUnits: Constants.TEMPERATURE_UNITS.FAHRENHEIT,
        targetVolume: 5,
        targetVolumeUnits: Constants.VOLUME_UNITS.GALLONS_IMP,
        currentVolumeUnits: Constants.VOLUME_UNITS.GALLONS_IMP,
      };
    default:
      return {
        mustTemperature: 68,
        mustTemperatureUnits: Constants.TEMPERATURE_UNITS.FAHRENHEIT,
        targetVolume: 5,
        targetVolumeUnits: Constants.VOLUME_UNITS.GALLONS_US,
        currentVolumeUnits: Constants.VOLUME_UNITS.GALLONS_US,
      };
  }
}

// pickMeadSnaSchedule(yanRequirement, hot, og, targetStepFeedGravity, numberOfSteps) - the
// default staggered-nutrient-addition schedule for !calculate-mead, which (unlike build-batch's
// pickSnaSchedule) has its own step-feeding-aware branch
function pickMeadSnaSchedule(yanRequirement, hot, og, targetStepFeedGravity, numberOfSteps) {
  if (targetStepFeedGravity != null) {
    if (yanRequirement === Constants.YAN_REQUIREMENT.KVEIK) {
      const schedule = ['pitch'];
      for (let j = 0; j < numberOfSteps + 1; j++) {
        schedule.push(24 + 24 * j);
      }
      return schedule;
    }
    if (hot) {
      const schedule = [24];
      for (let j = 0; j <= numberOfSteps + 1; j++) {
        schedule.push(48 + 24 * j);
      }
      return schedule;
    }
    const schedule = ['24,0', '48,0', '72,0'];
    if (numberOfSteps >= 1) {
      schedule.push('24,1');
    }
    if (numberOfSteps >= 2) {
      schedule.push('48,1', '72,1', '24,2');
    }
    return schedule;
  }
  return pickSnaSchedule(yanRequirement, hot, og);
}

/**
 * calculateMead(options) - orchestrates !calculate-mead's full computation: resolving a target
 * OG/FG/ABV/volume (any two of gravity/volume/ABV may be given, with the third solved for; sugar
 * quantity is solved for when both gravity and volume are given without a full sugar
 * specification), optional step-feeding, fruit/grain YAN contribution, and the nutrient schedule.
 * See mead.js for the option field list (same keys, camelCase) — notably targetGravity/
 * targetVolume/targetAbv/currentGravity/currentVolume are nullable (null means "not specified,
 * use the default"), and additionalSugars is either null or an array of already-fully-resolved
 * sugar objects (each { type, quantity_amount, quantity_amount_specified, quantity_units,
 * sugar_content, additive, yan_multiplier }).
 * Returns {error: true, errorMessage} on failure, or a result object with the resolved
 * targets, step-feeding info (null unless targetStepFeedGravity was given), Go-Ferm/nutrient
 * breakdown, and the full getAdvancedNutrients result.
 */
function calculateMead(options) {
  const {
    units,
    mustTemperature: mustTemperatureInput,
    mustTemperatureUnits: mustTemperatureUnitsInput,
    targetGravity: targetGravityInput,
    targetGravityUnits: targetGravityUnitsInput,
    targetAbv: targetAbvInput,
    targetAbvUnits: targetAbvUnitsInput,
    targetVolume: targetVolumeInput,
    targetVolumeUnits: targetVolumeUnitsInput,
    additionalSugars: additionalSugarsInput,
    currentGravity: currentGravityInput,
    currentGravityUnits: currentGravityUnitsInput,
    currentVolume: currentVolumeInput,
    currentVolumeUnits: currentVolumeUnitsInput,
    targetStepFeedGravity,
    yeastAbv,
    yanRequirement,
    hot,
    calculateAdditiveHoney,
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
    useGoferm,
    yeastPackGrams,
  } = options;

  const defaults = unitDefaults(units);

  let targetGravitySpecified = targetGravityInput != null;
  const targetVolumeSpecified = targetVolumeInput != null;
  const targetAbvSpecified = targetAbvInput != null;
  const currentGravitySpecified = currentGravityInput != null;
  const currentVolumeSpecified = currentVolumeInput != null;

  let currentGravityUnits = currentGravityUnitsInput ?? Constants.GRAVITY_UNITS.SG;
  let currentGravity = currentGravityInput ?? 1.0;
  let currentVolumeUnits = currentVolumeUnitsInput ?? defaults.currentVolumeUnits;
  let currentVolume = currentVolumeInput ?? 0;
  let targetGravityUnits = targetGravityUnitsInput ?? Constants.GRAVITY_UNITS.SG;
  let targetGravity = targetGravityInput ?? 1.108;
  let targetVolumeUnits = targetVolumeUnitsInput ?? defaults.targetVolumeUnits;
  let targetVolume = targetVolumeInput ?? defaults.targetVolume;
  const targetAbvUnits = targetAbvUnitsInput ?? Constants.ABV_UNITS.ABV;
  let targetAbv = targetAbvInput ?? 14.13;
  const mustTemperature = mustTemperatureInput ?? defaults.mustTemperature;
  const mustTemperatureUnits = mustTemperatureUnitsInput ?? defaults.mustTemperatureUnits;
  let additionalSugars = additionalSugarsInput;

  let additionalSugarsVolumeCheck = 0;
  if (additionalSugars != null) {
    for (const sugar of additionalSugars) {
      const targetLiters =
        (sugar.quantity_amount / Constants.HONEY_UNIT_INFO[Constants.HONEY_UNITS.LITERS].conversion) *
        Constants.HONEY_UNIT_INFO[sugar.quantity_units].conversion;
      const sugarVolumeInTargetVolumeUnits = targetLiters / Constants.VOLUME_UNIT_INFO[targetVolumeUnits].conversion;

      if (sugar.additive) {
        targetVolume += sugarVolumeInTargetVolumeUnits;
      }
      additionalSugarsVolumeCheck += sugarVolumeInTargetVolumeUnits;
    }
  }
  if (additionalSugarsVolumeCheck >= targetVolume) {
    const targetVolumeUnitName = Constants.VOLUME_UNIT_INFO[targetVolumeUnits].name;
    return {
      error: true,
      errorMessage:
        'Total sugar volume (' +
        additionalSugarsVolumeCheck.toFixed(3) +
        ' ' +
        targetVolumeUnitName +
        ') is greater than total target volume (' +
        targetVolume.toFixed(3) +
        ' ' +
        targetVolumeUnitName +
        ').\nIt must be less than or equal.',
    };
  }

  let vSugar = 0;
  const vCSg = Number(Gravity.toSG(currentGravity, currentGravityUnits));
  const vCVol = Number(Gravity.toVol(currentVolumeUnits, currentVolume));
  let vTSg = Number(Gravity.toSG(targetGravity, targetGravityUnits));
  let vTVol = Number(Gravity.toVol(targetVolumeUnits, targetVolume));
  const tempCoeff = Gravity.getTempCoeff(mustTemperature, mustTemperatureUnits);
  let vTSfSg = null;
  if (targetStepFeedGravity != null) {
    vTSfSg = Number(Gravity.toSG(targetStepFeedGravity, targetGravityUnits));
    if (targetGravitySpecified && vTSfSg <= vTSg) {
      return { error: true, errorMessage: 'target_step_feed_gravity should be greater than target_gravity' };
    }
  }

  let dryFg = CalculatorAPI.EstimateDryFG(vTSg);

  if (targetStepFeedGravity != null) {
    targetAbv = CalculatorAPI.ConvertGravityDropToABV(vTSfSg);
    if (targetAbvUnits === Constants.ABV_UNITS.ABW) {
      targetAbv = Gravity.ABVToABW(targetAbv);
    }
    if (targetAbv > yeastAbv) {
      targetAbv = yeastAbv;
    }
  } else if (targetGravitySpecified) {
    targetAbv = CalculatorAPI.ConvertGravityDropToABV(vTSg - dryFg + 1);
    if (targetAbvUnits === Constants.ABV_UNITS.ABW) {
      targetAbv = Gravity.ABVToABW(targetAbv);
    }
    if (targetAbv > yeastAbv) {
      targetAbv = yeastAbv;
    }
  } else if (targetAbvSpecified) {
    vTSg =
      targetAbvUnits === Constants.ABV_UNITS.ABW
        ? Gravity.stormABVtoSG(Gravity.ABWToABV(targetAbv))
        : Gravity.stormABVtoSG(targetAbv);

    dryFg = CalculatorAPI.EstimateDryFG(vTSg);
    vTSg = targetGravity = vTSg + dryFg - 1;
    targetGravitySpecified = true; // we just specified it
  }

  let unspecifiedSugar = false;
  if (additionalSugars != null) {
    for (const sugar of additionalSugars) {
      if (sugar.quantity_amount_specified) {
        vSugar += Gravity.getSugars(sugar);
      } else {
        unspecifiedSugar = true;
      }
    }
  }

  // do the calculations
  if (targetVolumeSpecified && !targetGravitySpecified) {
    const mygpl = (vSugar * 1000 + Gravity.SGToSugarConc(vCSg - tempCoeff) * vCVol) / vTVol;
    vTSg = Gravity.sugarConcToSG(mygpl) + tempCoeff;
    targetGravity = Gravity.doConvertSG(Constants.GRAVITY_UNITS.SG, targetGravityUnits, vTSg);
    targetGravity = Math.round(targetGravity * 1000) / 1000;

    dryFg = CalculatorAPI.EstimateDryFG(vTSg);

    if (targetStepFeedGravity == null) {
      targetAbv =
        targetAbvUnits === Constants.ABV_UNITS.ABW
          ? Gravity.ABVToABW(CalculatorAPI.ConvertGravityDropToABV(vTSg - dryFg + 1))
          : CalculatorAPI.ConvertGravityDropToABV(vTSg - dryFg + 1);

      if (targetAbv > yeastAbv) {
        targetAbv = yeastAbv;
      }
    } else if (vTSfSg <= vTSg) {
      return { error: true, errorMessage: 'target_step_feed_gravity should be greater than target_gravity' };
    }
  } else if (!targetVolumeSpecified && targetGravitySpecified && additionalSugars != null) {
    vTVol = (vSugar * 1000 + Gravity.SGToSugarConc(vCSg) * vCVol) / Gravity.SGToSugarConc(vTSg);
    targetVolume = Number(vTVol / Constants.VOLUME_UNIT_INFO[targetVolumeUnits].conversion);
  } else if (targetGravitySpecified && targetVolumeSpecified && (additionalSugars == null || unspecifiedSugar)) {
    // calculate sugar quantity - we either add a honey specification, or specify an unspecified sugar
    const myQuant =
      (Gravity.SGToSugarConc(vTSg) * vTVol) / 1000 - (Gravity.SGToSugarConc(vCSg) * vCVol) / 1000 - vSugar;
    if (additionalSugars == null) {
      if (calculateAdditiveHoney) {
        let honeyAmount = 0;
        const quantityUnits =
          units === Constants.UNITS.METRIC ? Constants.HONEY_UNITS.KILOGRAMS : Constants.HONEY_UNITS.POUNDS;
        const sugarContent = Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].percent;
        const yanMultiplier = Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].yan;

        const testQuant = (amount) =>
          (Gravity.SGToSugarConc(vTSg) *
            (vTVol +
              (amount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion) /
                Constants.HONEY_UNIT_INFO[Constants.HONEY_UNITS.LITERS].conversion)) /
            1000 -
          (Gravity.SGToSugarConc(vCSg) * vCVol) / 1000 -
          vSugar -
          (amount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion * sugarContent) / 100;

        while (testQuant(honeyAmount) > 0) {
          honeyAmount += 0.001;
        }

        additionalSugars = [
          {
            type: Constants.SUGAR_SOURCES.HONEY,
            quantity_amount: honeyAmount,
            quanity_amount_specified: true,
            quantity_units: quantityUnits,
            sugar_content: sugarContent,
            yan_multiplier: yanMultiplier,
            additive: true,
          },
        ];

        vTVol +=
          (honeyAmount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion) /
          Constants.HONEY_UNIT_INFO[Constants.HONEY_UNITS.LITERS].conversion;
        targetVolume +=
          (honeyAmount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion) /
          Constants.HONEY_UNIT_INFO[Gravity.volumeUnitsToHoneyUnits(targetVolumeUnits)].conversion;
        vSugar += (honeyAmount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion * sugarContent) / 100;
      } else {
        const quantityUnits =
          units === Constants.UNITS.METRIC ? Constants.HONEY_UNITS.KILOGRAMS : Constants.HONEY_UNITS.POUNDS;
        const sugarContent = Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].percent;
        const yanMultiplier = Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].yan;

        additionalSugars = [
          {
            type: Constants.SUGAR_SOURCES.HONEY,
            quantity_amount:
              Math.round(
                (myQuant /
                  ((Number(Constants.HONEY_UNIT_INFO[quantityUnits].conversion) * Number(sugarContent)) / 100)) *
                  1000
              ) / 1000,
            quanity_amount_specified: true,
            quantity_units: quantityUnits,
            sugar_content: sugarContent,
            yan_multiplier: yanMultiplier,
          },
        ];
      }
    } else {
      let foundSugar = false;
      for (const sugar of additionalSugars) {
        if (!sugar.quantity_amount_specified) {
          if (foundSugar) {
            sugar.quantity_amount = 0;
          } else {
            sugar.quantity_amount =
              Math.round(
                (myQuant /
                  ((Number(Constants.HONEY_UNIT_INFO[sugar.quantity_units].conversion) * Number(sugar.sugar_content)) /
                    100)) *
                  1000
              ) / 1000;
            foundSugar = true;
          }
          sugar.quantity_amount_specified = true;
        }
      }
    }
  }

  let numberOfSteps = 0;
  let honeyVolsPerStep = 0;
  const honeyStepUnits =
    units === Constants.UNITS.METRIC ? Constants.HONEY_UNITS.KILOGRAMS : Constants.HONEY_UNITS.POUNDS;
  let volumeAfterSteps = 0;
  let stepAddSg = vTSg;
  if (targetStepFeedGravity != null) {
    if (vTSg < 1.08) {
      return { error: true, errorMessage: 'Step feeding is not recommended for OG < 1.080.' };
    }

    const stepSgDiff = vTSfSg - vTSg;
    numberOfSteps = Math.min(Math.ceil(stepSgDiff / 0.04), 3);

    let honeyPounds = 0;
    const quantityUnits = Constants.HONEY_UNITS.POUNDS;
    const sugarContent = Constants.SUGAR_SOURCE_INFO[Constants.SUGAR_SOURCES.HONEY].percent;

    const testQuant = (amount) =>
      (Gravity.SGToSugarConc(vTSfSg) *
        (vTVol +
          (amount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion) /
            Constants.HONEY_UNIT_INFO[Constants.HONEY_UNITS.LITERS].conversion)) /
        1000 -
      (Gravity.SGToSugarConc(vCSg) * vCVol) / 1000 -
      vSugar -
      (amount * Constants.HONEY_UNIT_INFO[quantityUnits].conversion * sugarContent) / 100;

    while (testQuant(honeyPounds) > 0) {
      honeyPounds += 0.001;
    }

    honeyVolsPerStep =
      honeyStepUnits === Constants.HONEY_UNITS.POUNDS
        ? honeyPounds / numberOfSteps
        : (honeyPounds * Constants.HONEY_UNIT_INFO[Constants.HONEY_UNITS.POUNDS].conversion) / numberOfSteps;

    volumeAfterSteps =
      targetVolume +
      (honeyPounds * Constants.HONEY_UNIT_INFO[quantityUnits].conversion) /
        Constants.HONEY_UNIT_INFO[Gravity.volumeUnitsToHoneyUnits(targetVolumeUnits)].conversion;
    stepAddSg = stepAddSg - stepSgDiff / numberOfSteps - 0.01;
  }

  // values needed for yan calculations
  const og =
    targetStepFeedGravity == null
      ? Gravity.convToSG(targetGravity, targetGravityUnits)
      : Gravity.convToSG(targetStepFeedGravity, targetGravityUnits);

  let fg =
    og - Gravity.stormABVtoSG(targetAbvUnits === Constants.ABV_UNITS.ABV ? targetAbv : Gravity.ABWToABV(targetAbv)) + 1;
  if (fg < dryFg) {
    fg = dryFg;
  }
  const gravityDropSg = og - fg + 1;

  // apply yan from fruit/grain...
  let fruitYanConcentrationPercent = 0;
  if (additionalSugars != null) {
    for (const sugar of additionalSugars) {
      if (sugar.yan_multiplier !== 0) {
        const sSugar = Gravity.getSugars(sugar);
        const sGpl = (sSugar * 1000 + Gravity.SGToSugarConc(vCSg - tempCoeff) * vCVol) / vTVol;
        const sSG = Gravity.sugarConcToSG(sGpl) + tempCoeff;

        let fruitPercent = (sugar.yan_multiplier * (sSG - 1)) / (gravityDropSg - 1);
        if (yanRequirement === Constants.YAN_REQUIREMENT.KVEIK) {
          fruitPercent = fruitPercent / 1.5;
        }

        fruitYanConcentrationPercent += fruitPercent;
      }
    }
  }

  // now calculate nutrients
  let targetFinalGravity = fg;
  if (targetGravityUnits === Constants.GRAVITY_UNITS.BAUME) {
    targetFinalGravity = Gravity.SGToBaume(fg);
  } else if (targetGravityUnits === Constants.GRAVITY_UNITS.BRIX) {
    targetFinalGravity = CalculatorAPI.ConvertSGToBrix(fg);
  }

  let deltaFG = og - fg + 1;
  if (targetStepFeedGravity != null) {
    deltaFG += 0.01;
  }
  let yan = Gravity.stormSGtoYAN(deltaFG, yanRequirement);
  const fruitYanContribution = Math.floor(yan * fruitYanConcentrationPercent);
  yan -= fruitYanContribution;

  const liters =
    (targetStepFeedGravity == null ? targetVolume : volumeAfterSteps) *
    Constants.VOLUME_UNIT_INFO[targetVolumeUnits].conversion;
  const gallons = liters / 3.784;

  const snaSchedule = pickMeadSnaSchedule(yanRequirement, hot, og, targetStepFeedGravity, numberOfSteps);

  const gf = Nutrient.getGoferm(
    gallons,
    og,
    fruitYanContribution,
    useGoferm,
    yeastPackGrams,
    yanRequirement === Constants.YAN_REQUIREMENT.KVEIK
  );
  const gofermYanContribution = Math.floor((gf[2] * gofermYan) / liters);
  yan -= gofermYanContribution;
  if (yan < 0) {
    yan = 0;
  }

  const nutrients = Nutrient.getAdvancedNutrients(
    Constants.UNITS.METRIC,
    liters,
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
  );

  const ogPts = og - 1;
  const fgPts = fg - 1;
  const sgDiff = ogPts - fgPts;
  const break3 = 1 + (fgPts + (sgDiff * 2) / 3);

  return {
    error: false,
    mustTemperature,
    mustTemperatureUnits,
    targetGravity,
    targetGravityUnits,
    targetStepFeedGravity,
    targetFinalGravity,
    targetAbv,
    targetAbvUnits,
    targetVolume,
    targetVolumeUnits,
    stepFeeding:
      targetStepFeedGravity == null ? null : { volumeAfterSteps, honeyVolsPerStep, numberOfSteps, stepAddSg },
    currentGravity,
    currentGravityUnits,
    currentGravitySpecified,
    currentVolume,
    currentVolumeUnits,
    currentVolumeSpecified,
    additionalSugars,
    goferm: { minGrams: gf[0], numPackets: gf[1], grams: gf[2], dilutionWaterMl: gf[3], yeastPackGrams: gf[4] },
    gofermYanContribution,
    fruitYanContribution,
    nutrients,
    break3,
  };
}

module.exports = {
  pickSnaSchedule,
  buildBatch,
  calculateMead,
};
