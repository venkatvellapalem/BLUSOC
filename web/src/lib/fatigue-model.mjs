/** Shared, illustrative assumptions for the fatigue lab. These are not measurements. */
export const FATIGUE_MODEL = Object.freeze({
  baselineVolume: 14280,
  tunedVolume: 184,
  trueSignals: 180,
  baselineResponseMinutes: 42,
  tunedResponseMinutes: 8,
  maximumHoursRecovered: 32.5,
});

/** @param {number} suppressedVolume */
export function calculateFatigueImpact(suppressedVolume) {
  const model = FATIGUE_MODEL;
  const maximumSuppression = model.baselineVolume - model.tunedVolume;
  if (
    !Number.isFinite(suppressedVolume) ||
    suppressedVolume < 0 ||
    suppressedVolume > maximumSuppression
  ) {
    throw new RangeError("Suppression must stay within the modeled known-noise volume.");
  }
  const dailyVolume = model.baselineVolume - suppressedVolume;
  const remainingNoise = dailyVolume - model.trueSignals;
  const fraction = suppressedVolume / maximumSuppression;
  return {
    dailyVolume,
    falsePositiveRate: (remainingNoise / dailyVolume) * 100,
    mttrMinutes: Math.round(
      model.tunedResponseMinutes +
        (1 - fraction) * (model.baselineResponseMinutes - model.tunedResponseMinutes),
    ),
    hoursSaved: Number((fraction * model.maximumHoursRecovered).toFixed(1)),
    signalToNoiseRatio:
      remainingNoise > model.trueSignals
        ? `1 : ${Math.round(remainingNoise / model.trueSignals)}`
        : `${Math.round(model.trueSignals / remainingNoise)} : 1`,
    suppressionPct: (suppressedVolume / (model.baselineVolume - model.trueSignals)) * 100,
  };
}
