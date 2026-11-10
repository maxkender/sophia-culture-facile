-- Live database regression: run through the read-only database query tool.
-- Applied data change (not a schema migration):
-- UPDATE public.country_zones SET zone = 'A' WHERE country_code = 'IL' AND zone = 'B';
-- A failed rule raises division-by-zero rather than silently returning false.
SELECT
  1 / CASE WHEN public.lookup_country_zone('IL') = 'A'
    AND public.lookup_country_zone('Israel') = 'A'
    AND public.lookup_country_zone('Israël') = 'A'
    THEN 1 ELSE 0 END AS israel_resolves_to_zone_a,
  1 / CASE WHEN EXISTS (
    SELECT 1 FROM public.country_zones c
    JOIN public.pay_zones p ON p.zone = c.zone
    WHERE c.country_code = 'IL' AND p.weekly_amount = 14
  ) THEN 1 ELSE 0 END AS israel_weekly_rate_is_14;