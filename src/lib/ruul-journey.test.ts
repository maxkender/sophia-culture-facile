import { describe, expect, it } from "vitest";
import { buildJourneys, journeyCsv, normalizeReferral, paidPeopleThisWeek, type JourneyApplication } from "./ruul-journey";

const app = (patch: Partial<JourneyApplication> = {}) => ({ id: "a", email: "friend@example.test", full_name: "Friend", country: "FR", status: "pending", created_at: "2026-11-01T10:00:00Z", ...patch }) as JourneyApplication;
const referral = (patch: Record<string, unknown> = {}) => {
  const r = normalizeReferral({ id: "r", friend_email: "friend@example.test", country: "FR", created_at: "2026-10-30T10:00:00Z", ...patch });
  if (!r) throw new Error("Fixture missing"); return r;
};
const now = "2026-11-10T10:00:00Z";
describe("Ruul journey rules", () => {
  it("this-week paid count includes returning posters, not only their first payment", () => {
    expect(paidPeopleThisWeek([{application_id:"a",status:"paid",paid_at:"2026-11-02",week_start:"2026-10-26"},{application_id:"a",status:"paid",paid_at:"2026-11-09",week_start:"2026-11-02"},{application_id:"b",status:"approved",paid_at:null,week_start:"2026-11-02"}],now)).toBe(1);
  });
  it("matches a referral to an application by normalized email, one row per person", () => {
    const rows = buildJourneys([app(),app({ id:"b", email:"FRIEND@example.test" })],[referral()],[],[],now);
    expect(rows).toHaveLength(1); expect(rows[0]?.source).toBe("referral");
  });
  it("does not merge different friends on a shared referrer code", () => {
    const rows = buildJourneys([app({ref:"SHARED"})],[referral({ friend_email:"other@example.test",ref:"SHARED" })],[],[],now);
    expect(rows).toHaveLength(2);
  });
  it("matches a unique ref code when the referral has no email", () => {
    expect(buildJourneys([app({ref:"ONE"})],[referral({ friend_email:"",ref:"ONE" })],[],[],now)).toHaveLength(1);
  });
  it("marks action waits red only after more than 48 hours", () => {
    expect(buildJourneys([app({created_at:"2026-11-08T10:00:00Z"})],[],[],[],now)[0]?.red).toBe(false);
    expect(buildJourneys([app({created_at:"2026-11-08T09:59:59Z"})],[],[],[],now)[0]?.red).toBe(true);
  });
  it("Portugal is closed, grey and never red", () => {
    const row = buildJourneys([app({country:"Portugal"})],[],[],[],now)[0];
    expect(row?.nextAction).toBe("Country closed"); expect(row?.ended).toBe(true); expect(row?.red).toBe(false);
  });
  for (const status of ["refused","rejected","expired","dropped"]) it(`${status} ends a journey`, () => {
    const row = buildJourneys([app({status})],[],[],[],now)[0]; expect(row?.ended).toBe(true); expect(row?.red).toBe(false);
  });
  it("unsubscribed and bounced referrals are ended", () => {
    for (const patch of [{unsubscribed:true},{bounced:true}]) expect(buildJourneys([], [referral(patch)],[],[],now)[0]?.ended).toBe(true);
  });
  it("does not invent login or first-post dates from a snapshot", () => {
    const row = buildJourneys([app({accepted_at:"2026-11-02",contract_signed_at:"2026-11-03",os_created_at:"2026-11-03",ruul_added_at:"2026-11-04"})],[],[{application_id:"a",lundi:"2026-11-02",publies:3,dernier_post_at:"2026-11-06T12:00:00Z"}],[],now)[0];
    expect(row?.dates.login).toBeNull(); expect(row?.dates.post).toBe("2026-11-06T12:00:00Z"); expect(row?.postObserved).toBe(true); expect(row?.current).toBe("paid");
  });
  it("paid means a paid week, not an approved draft", () => {
    const row = buildJourneys([app()],[],[],[{application_id:"a",status:"approved",paid_at:null,week_start:"2026-11-02"},{application_id:"a",status:"paid",paid_at:"2026-11-09",week_start:"2026-11-02"}],now)[0];
    expect(row?.dates.paid).toBe("2026-11-09");
  });
  it("shows missing email next action for a referral-only friend", () => {
    expect(buildJourneys([], [referral({friend_email:""})],[],[],now)[0]?.nextAction).toBe("No email — ask referrer");
  });
  it("shows the J+3 signature reminder without resetting the waiting clock", () => {
    const row = buildJourneys([app({accepted_at:"2026-11-02",timeline:{remind_2:{at:"2026-11-05"}}})],[],[],[],now)[0];
    expect(row?.nextAction).toBe("Waiting for signature — reminder J+3 sent"); expect(row?.daysStuck).toBe(8);
  });
  it("future start Mondays and future payment due dates are not red", () => {
    const base = app({accepted_at:"2026-11-01",contract_signed_at:"2026-11-02",os_created_at:"2026-11-02",ruul_added_at:"2026-11-03",start_monday:"2026-11-16",timeline:{first_login:{at:"2026-11-03"}}});
    const row = buildJourneys([base],[],[],[],now)[0]; expect(row?.red).toBe(false); expect(row?.nextAction).toBe("Waiting for start Monday");
  });
  it("optional J+2/J+5 reminders are not gates for applied people", () => {
    expect(buildJourneys([app()],[referral({j0_sent_at:"2026-10-30"})],[],[],now)[0]?.current).toBe("accepted");
  });
  it("exports only supplied rows and neutralizes spreadsheet formulas", () => {
    const rows = buildJourneys([app({full_name:"=HYPERLINK()"})],[],[],[],now);
    const csv = journeyCsv(rows); expect(csv).toContain("'=HYPERLINK()"); expect(csv.split("\r\n")).toHaveLength(2);
  });
});