import { describe, expect, it, vi, beforeEach } from "vitest";

// Date formatting and email building only: no email transport is ever called.
const sendCalls: { html: string; text: string; subject: string; to: string }[] = [];
vi.mock("./brevo.server", () => ({ sendBrevoEmail: vi.fn(async (o: any) => { sendCalls.push(o); return { sent: true }; }) }));
import { formatSigningFriday, posterEmails } from "./slideshow-emails.server";

beforeEach(() => { sendCalls.length = 0; });

const SLACK_URL = "https://join.slack.com/t/sophia-system/shared_invite/zt-4dusa2eyo-6_CjWI3ylCGdlAqA8737Ew";

describe("acceptance signing deadline", () => {
  it("shows Friday 23 October for Monday 26 October 2026", () => {
    expect(formatSigningFriday("2026-10-26", "en")).toBe("Friday, October 23");
  });
});

describe("Slack invite link in poster emails", () => {
  it("acceptance email adds the Join Slack link after the Slack bullet (EN + FR labels)", async () => {
    await posterEmails.accepted("p@example.com", "Test P", "en", "2026-10-26", "https://sophia-culture.com/creators/sign/t", 14, 15, null, SLACK_URL);
    let html = sendCalls[0]!.html;
    expect(html).toContain(`href="${SLACK_URL}"`);
    expect(html).toContain(">Join Slack</a>");
    expect(sendCalls[0]!.text).toContain(`Join Slack: ${SLACK_URL}`);

    sendCalls.length = 0;
    await posterEmails.accepted("p@example.com", "Test P", "fr", "2026-10-26", "https://sophia-culture.com/creators/sign/t", 14, 15, null, SLACK_URL);
    html = sendCalls[0]!.html;
    expect(html).toContain(`href="${SLACK_URL}"`);
    expect(html).toContain(">Rejoindre Slack</a>");
    expect(sendCalls[0]!.text).toContain(`Rejoindre Slack: ${SLACK_URL}`);
  });

  it("acceptance email without Slack setting has no link", async () => {
    await posterEmails.accepted("p@example.com", "Test P", "en", "2026-10-26", "https://sophia-culture.com/creators/sign/t", 14, 15, null, null);
    expect(sendCalls[0]!.html).not.toContain("join.slack.com");
  });

  it("logins email puts the link right after #ruul-cohort in the money line", async () => {
    await posterEmails.logins("p@example.com", "Test P", "en", { osUrl: "https://os.example", login: "os@x", password: "pw", slack: SLACK_URL, monday: "2026-10-26", ruulEmail: "p@example.com", weekly: 14, first: 15 });
    const html = sendCalls[0]!.html;
    // "#ruul-cohort" is immediately followed by the clickable link, then the tail.
    expect(html).toContain(`#ruul-cohort <a href="${SLACK_URL}"`);
    expect(html).toContain(`>Join Slack</a>, never in the channel.`);
    expect(sendCalls[0]!.text).toContain(`Join Slack: ${SLACK_URL}`);
  });

  it("logins email without Slack setting keeps the plain money line", async () => {
    await posterEmails.logins("p@example.com", "Test P", "en", { osUrl: "https://os.example", login: "os@x", password: "pw", slack: null, monday: "2026-10-26", ruulEmail: "p@example.com", weekly: 14, first: 15 });
    expect(sendCalls[0]!.html).toContain("never in the channel.");
    expect(sendCalls[0]!.html).not.toContain("join.slack.com");
  });
});
