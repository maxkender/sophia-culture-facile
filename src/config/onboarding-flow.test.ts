import { describe, expect, it } from "vitest";
import { ACTIVE_STEPS, DOT_STEPS } from "./onboarding";

describe("/start default flow", () => {
  it("runs the 12 agreed screens in order, then success", () => {
    expect(ACTIVE_STEPS).toEqual([
      "welcome", "topics", "goals", "knowledge", "phoneTime", "years", "swipe",
      "loading", "profile", "account", "paywallA", "paywallB", "success",
    ]);
  });
  it("shows the progress bar on screens 2 to 9 only", () => {
    expect(DOT_STEPS).toEqual(ACTIVE_STEPS.slice(1, 9));
  });
});
