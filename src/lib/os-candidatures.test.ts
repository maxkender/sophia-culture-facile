import { describe, expect, it } from "vitest";
import { actionSchema } from "./os-candidatures.server";
import { unsubscribeToken, unsubscribeTokenValid } from "./slideshow-unsubscribe.server";

const id = "11111111-1111-4111-8111-111111111111";

describe("os-candidatures actions", () => {
  it("accepts a Monday start date", () => {
    expect(actionSchema.safeParse({ action: "accept", id, start_monday: "2026-11-16" }).success).toBe(true);
  });
  it("rejects a non-Monday start date", () => {
    expect(actionSchema.safeParse({ action: "move_start", id, start_monday: "2026-11-17" }).success).toBe(false);
  });
  it("only allows reminder steps 1, 3 and 6", () => {
    expect(actionSchema.safeParse({ action: "remind_signature", id, step: 3 }).success).toBe(true);
    expect(actionSchema.safeParse({ action: "remind_signature", id, step: 2 }).success).toBe(false);
  });
});

describe("unsubscribe link", () => {
  it("validates only the token made for that email", () => {
    const t = unsubscribeToken("Ana@Example.com", "s");
    expect(unsubscribeTokenValid("ana@example.com", t, "s")).toBe(true);
    expect(unsubscribeTokenValid("bob@example.com", t, "s")).toBe(false);
  });
});
