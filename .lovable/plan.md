# UGC acceptance and onboarding

## Build
- Replace the UGC approval write with one protected admin action that creates or reuses the creator, generates a secure invite, updates the application, and sends one acceptance email automatically.
- Add an admin-editable acceptance email with subject, introduction, instructions, and button label; preview it and allow a manual resend from the application record.
- Make the email button open the creator invitation page with the accepted email prefilled, where the creator chooses their password and activates their account.
- Replace the current onboarding with four visible checkbox stages: review examples and confirm motivation/quality, sign the agreement, create the Sophia-owned social account and record its handle/profile setup, then submit the first post.
- Update progress from completed actions rather than self-reported admin changes, show it in creator operations/applications, and keep briefs and regular workspace access appropriately gated.
- Keep post submission prominent after onboarding so every published post is entered in Sophia; the first valid submitted link completes the final stage automatically.

## Data and security
- Add additive creator progress fields and a singleton admin-editable email settings record, with authenticated/admin-only access and service access where required.
- Validate email copy, handles, account details, invite identifiers, and post URLs on both client and server.
- Keep UGC data separate from authors and slideshow applicants; acceptance remains idempotent to prevent duplicate creators or emails.

## Email prerequisite
- Configure Sophia’s sender domain, then scaffold Lovable managed app emails and style the acceptance email consistently with the site.
- Until the domain is verified, the rest of the workflow can be tested, but acceptance emails cannot be delivered.

## Verification
- Test approval to invite creation, email trigger behavior, password/account activation, all four checklist transitions, first-post completion, subsequent post logging, and admin progress visibility.
