# Parcours Ruul OS read contract

The Hub calls the existing bridge with `{ "action": "parrainages" }`.
Expected success: `{ "ok": true, "rows": [...] }`; `parrainages` or `referrals` arrays are also supported.

Each row uses:
- `id` (or `referral_id`), `ref` (or `ref_code`), `recrue_id` (Hub application ID when known)
- `referrer_name`, `referrer_channel` (`upwork` or `ruul`)
- `friend_first_name`, `friend_last_name`, `friend_email`, `country` (ISO), `created_at`
- `invitation_status`, `j0_sent_at`, `j2_sent_at`, `j5_sent_at`
- `opened_at`, `clicked_at`, `unsubscribed_at`, `bounced_at`, `applied_at`
- `bonus_status` (`pending` or `paid`), `bonus_paid_at`
- Optional precise OS observations: `first_login_at`, `first_post_at`

Dates are ISO timestamps or null. Nested `friend`, `referrer`, `emails_sent` (J0/J+2/J+5), and `referral_bonus` aliases are handled by `normalizeReferral`.
Unknown/missing action or invalid envelope displays the disconnected banner and never blocks applications.
Shared referrer codes cannot safely identify individual friends; match email or Hub application ID, or a unique code without conflicting email.
Current snapshots have `dernier_post_at`, not first-post or first-login dates: the tracker labels earliest recorded posts as observed and leaves missing exact dates blank.
No referral invitations, reminders, bonus payments, OS account creation or payout operations are triggered by this page.