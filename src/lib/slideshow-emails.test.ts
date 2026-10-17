import { describe, expect, it, vi } from "vitest";

// Date formatting only: no email transport is ever called.
vi.mock("./brevo.server", () => ({ sendBrevoEmail: vi.fn() }));
vi.mock("./email-send.server", () => ({ buildEmailHtml: vi.fn() }));
import { formatSigningFriday } from "./slideshow-emails.server";

describe("acceptance signing deadline", () => {
  it("shows Friday 23 October for Monday 26 October 2026", () => {
    expect(formatSigningFriday("2026-10-26", "en")).toBe("Friday, October 23");
  });
});