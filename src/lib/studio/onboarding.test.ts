import { describe, expect, it } from "vitest";
import { canDraftCourse, canSubmitCourse, creatorSlug, initialCreatorStatus, isValidSlug, nextStep, resumeStep, uniqueSlug } from "./onboarding";

describe("studio onboarding gates", () => {
  it("blocks submission before the agreement is signed", () => {
    expect(canSubmitCourse({ agreementSigned: false, creatorStatus: "approved" })).toEqual({ ok: false, reason: "agreement" });
  });
  it("lets a pending creator submit once signed", () => {
    expect(canSubmitCourse({ agreementSigned: true, creatorStatus: "pending" })).toEqual({ ok: true });
  });
  it("blocks a suspended creator from submitting and drafting", () => {
    expect(canSubmitCourse({ agreementSigned: true, creatorStatus: "suspended" }).ok).toBe(false);
    expect(canDraftCourse({ creatorStatus: "suspended" })).toBe(false);
  });
  it("allows drafting before the agreement", () => {
    expect(canDraftCourse({ creatorStatus: "pending" })).toBe(true);
  });
  it("self sign-ups start pending, invited profiles approved", () => {
    expect(initialCreatorStatus(true)).toBe("pending");
    expect(initialCreatorStatus(false)).toBe("approved");
  });
  it("resumes at the saved step and walks in order", () => {
    expect(resumeStep(null)).toBe("identity");
    expect(resumeStep("agreement")).toBe("agreement");
    expect(nextStep("agreement")).toBe("guide");
    expect(nextStep("done")).toBe("done");
  });
});

describe("creator slug", () => {
  it("strips accents and punctuation", () => {
    expect(creatorSlug("Élodie D'Aubigné")).toBe("elodie-d-aubigne");
  });
  it("is always 2–60 valid chars", () => {
    expect(isValidSlug(creatorSlug("x"))).toBe(true);
    expect(creatorSlug("a".repeat(90)).length).toBe(60);
    expect(isValidSlug("Bad_Slug")).toBe(false);
  });
  it("adds a suffix when taken", () => {
    expect(uniqueSlug("marie-curie", ["marie-curie", "marie-curie-2"])).toBe("marie-curie-3");
  });
});
