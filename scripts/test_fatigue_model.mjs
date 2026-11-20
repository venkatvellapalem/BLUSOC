import test from "node:test";
import assert from "node:assert/strict";
import { calculateFatigueImpact, FATIGUE_MODEL } from "../web/src/lib/fatigue-model.mjs";

test("raw and tuned model outputs agree with the same event counts", () => {
  const raw = calculateFatigueImpact(0);
  assert.equal(raw.dailyVolume, 14280);
  assert.equal(raw.mttrMinutes, 42);
  assert.equal(raw.signalToNoiseRatio, "1 : 78");
  assert.equal(raw.hoursSaved, 0);
  const tuned = calculateFatigueImpact(FATIGUE_MODEL.baselineVolume - FATIGUE_MODEL.tunedVolume);
  assert.equal(tuned.dailyVolume, 184);
  assert.equal(tuned.falsePositiveRate.toFixed(1), "2.2");
  assert.equal(tuned.signalToNoiseRatio, "45 : 1");
  assert.equal(tuned.mttrMinutes, 8);
});

test("partial tuning preserves signals and improves each modeled outcome", () => {
  const raw = calculateFatigueImpact(0);
  const partial = calculateFatigueImpact(6840);
  assert.ok(partial.dailyVolume > FATIGUE_MODEL.trueSignals);
  assert.ok(partial.falsePositiveRate < raw.falsePositiveRate);
  assert.ok(partial.mttrMinutes < raw.mttrMinutes);
  assert.ok(partial.hoursSaved > 0);
  assert.ok(partial.suppressionPct > 0 && partial.suppressionPct < 100);
});

test("invalid suppression cannot invent negative queues or losses of true signals", () => {
  for (const value of [-1, 14280, NaN, Infinity]) {
    assert.throws(() => calculateFatigueImpact(value), RangeError);
  }
});
